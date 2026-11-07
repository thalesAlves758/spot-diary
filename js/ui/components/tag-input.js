import { h } from '../dom.js';
import { icon } from '../icons.js';
import { cleanTags } from '../../services/places.js';

/**
 * Tag field shown as chips. Enter or comma adds the typed tag; the "x" on a chip removes it.
 * Autocomplete arrives in CARD-006.
 * Returns `{ element, input, getTags }`; `getTags()` includes text still being typed.
 */
export function createTagInput({ id, tags = [], describedBy = null }) {
  let current = cleanTags(tags);

  const list = h('ul', { class: 'chips', 'aria-label': 'Tags adicionadas' });
  const input = h('input', {
    id,
    class: 'field__input chips__input',
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'none',
    enterkeyhint: 'enter',
    placeholder: 'Digite e tecle Enter',
    'aria-describedby': describedBy,
  });

  const renderChips = () => {
    list.replaceChildren(...current.map((tag) => h('li', { class: 'chip' },
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
    list.hidden = current.length === 0;
  };

  const add = (text) => {
    current = cleanTags([...current, ...text.split(',')]);
    renderChips();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Enter must not submit the form
      add(input.value);
      input.value = '';
    } else if (event.key === 'Backspace' && !input.value && current.length) {
      current = current.slice(0, -1);
      renderChips();
    }
  });
  // Android keyboards often send a comma without a usable keydown: catch it here.
  input.addEventListener('input', () => {
    if (input.value.includes(',')) {
      const parts = input.value.split(',');
      add(parts.slice(0, -1).join(','));
      input.value = parts.at(-1).trimStart();
    }
  });

  renderChips();

  return {
    element: h('div', { class: 'chips-field' }, list, input),
    input,
    getTags: () => cleanTags([...current, input.value]),
  };
}
