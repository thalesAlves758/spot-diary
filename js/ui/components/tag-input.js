import { h } from '../dom.js';
import { icon } from '../icons.js';
import { cleanTags, normalizeTag, suggestTags } from '../../services/places.js';

let instances = 0;

/**
 * Tag field shown as chips, with suggestions from tags already in use (CARD-006).
 * - Enter or comma adds the typed tag; the "x" on a chip removes it.
 * - Typing shows existing tags that start with the text; arrows + Enter or a tap picks one.
 * - A tag that already exists with another case keeps the existing spelling ("bh" → "BH").
 * Returns `{ element, input, getTags }`; `getTags()` includes text still being typed.
 */
export function createTagInput({ id, tags = [], existingTags = [] }) {
  const listboxId = `${id}-suggestions-${++instances}`;
  const normalize = (tag) => normalizeTag(tag, existingTags);
  let current = cleanTags(tags.map(normalize));
  let suggestions = [];
  let active = -1;

  const chips = h('ul', { class: 'chips', 'aria-label': 'Tags adicionadas' });
  const listbox = h('ul', { class: 'suggestions', id: listboxId, role: 'listbox', 'aria-label': 'Tags já usadas', hidden: true });
  const input = h('input', {
    id,
    class: 'field__input chips__input',
    type: 'text',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': 'false',
    'aria-controls': listboxId,
    autocomplete: 'off',
    autocapitalize: 'none',
    enterkeyhint: 'enter',
    placeholder: 'Digite e tecle Enter',
  });

  const renderChips = () => {
    chips.replaceChildren(...current.map((tag) => h('li', { class: 'chip' },
      h('span', { class: 'chip__label' }, tag),
      h('button', {
        type: 'button',
        class: 'chip__remove',
        'aria-label': `Remover tag ${tag}`,
        onclick: () => {
          current = current.filter((t) => t !== tag);
          renderChips();
          input.focus();
        },
      }, icon('close')),
    )));
    chips.hidden = current.length === 0;
  };

  const closeSuggestions = () => {
    suggestions = [];
    active = -1;
    listbox.hidden = true;
    listbox.replaceChildren();
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const renderSuggestions = () => {
    suggestions = suggestTags(input.value, existingTags, current);
    if (active >= suggestions.length) active = suggestions.length - 1;
    if (!suggestions.length) {
      closeSuggestions();
      return;
    }
    listbox.replaceChildren(...suggestions.map((tag, i) => h('li', {
      id: `${listboxId}-${i}`,
      class: 'suggestion',
      role: 'option',
      'aria-selected': String(i === active),
      // pointerdown + preventDefault keeps focus in the input (blur would close the list first).
      onpointerdown: (event) => {
        event.preventDefault();
        pick(tag);
      },
    }, tag)));
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (active >= 0) input.setAttribute('aria-activedescendant', `${listboxId}-${active}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const add = (text) => {
    current = cleanTags([...current, ...text.split(',').map(normalize)]);
    renderChips();
  };

  const pick = (tag) => {
    add(tag);
    input.value = '';
    closeSuggestions();
    input.focus();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!suggestions.length) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // Cycles through -1 (nothing selected, the typed text) and 0..n-1.
      const n = suggestions.length;
      active = ((active + 1 + step + n + 1) % (n + 1)) - 1;
      renderSuggestions();
    } else if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Enter must not submit the form
      if (event.key === 'Enter' && active >= 0) pick(suggestions[active]);
      else {
        add(input.value);
        input.value = '';
        closeSuggestions();
      }
    } else if (event.key === 'Escape' && !listbox.hidden) {
      event.preventDefault();
      closeSuggestions();
    } else if (event.key === 'Backspace' && !input.value && current.length) {
      current = current.slice(0, -1);
      renderChips();
    }
  });

  input.addEventListener('input', () => {
    // Android keyboards often send a comma without a usable keydown: catch it here.
    if (input.value.includes(',')) {
      const parts = input.value.split(',');
      add(parts.slice(0, -1).join(','));
      input.value = parts.at(-1).trimStart();
    }
    active = -1;
    renderSuggestions();
  });

  input.addEventListener('blur', closeSuggestions);

  renderChips();

  return {
    element: h('div', { class: 'chips-field' }, chips, h('div', { class: 'combobox' }, input, listbox)),
    input,
    getTags: () => cleanTags([...current, normalize(input.value)]),
  };
}
