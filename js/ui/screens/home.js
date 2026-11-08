// T1 — Home: "Quero ir" / "Já fui" tabs with place cards (CARD-008), search by name (CARD-009),
// filters (CARD-015, panel T2) and the backup reminder (CARD-018).
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate, setQuery } from '../../router.js';
import { createHeader, iconButton } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';
import { createBackupReminder, isBackupReminderDismissed } from '../components/backup-reminder.js';
import { createFavoriteButton } from '../components/favorite-button.js';
import { openBottomSheet } from '../components/bottom-sheet.js';
import { showToast } from '../components/toast.js';
import { formatAverage, formatDate } from '../format.js';
import { loadHomeLists, getHomeSort, setHomeSort } from '../../services/lists.js';
import { SORT_OPTIONS, sortItems, sortLabel } from '../../services/sorting.js';
import {
  searchByName, normalizeTerm, applyFilters, countActiveFilters, emptyFilters,
  filtersToQuery, filtersFromQuery, MIN_RATINGS,
} from '../../services/filters.js';
import { STATUS, PLACE_TYPES, placeTypeLabel, uniqueTags } from '../../services/places.js';
import { getLastExportAt, shouldRemindBackup } from '../../services/backup.js';

const SEARCH_DEBOUNCE_MS = 150;

const TABS = [
  { status: STATUS.WANT_TO_GO, label: 'Quero ir' },
  { status: STATUS.BEEN_THERE, label: 'Já fui' },
];

const EMPTY = {
  [STATUS.WANT_TO_GO]: {
    title: 'Nenhum lugar ainda',
    message: 'Cadastre o primeiro lugar que você quer conhecer.',
  },
  [STATUS.BEEN_THERE]: {
    title: 'Nenhum lugar visitado ainda',
    message: 'Registre uma visita num lugar do "Quero ir" ou cadastre um lugar onde você já foi.',
  },
};

const MAX_TAGS_ON_CARD = 3;

/** "Novo" in "Já fui" registers the visit right after the place (CARD-013). */
const newPlacePath = (status) => (status === STATUS.BEEN_THERE ? '/place/new?beenThere=1' : '/place/new');

export async function render(root, { query }) {
  const sort = await getHomeSort();
  const [lists, lastExportAt] = await Promise.all([loadHomeLists(sort), getLastExportAt()]);
  const placeCount = lists[STATUS.WANT_TO_GO].length + lists[STATUS.BEEN_THERE].length;
  const reminder = !isBackupReminderDismissed() && shouldRemindBackup({ lastExportAt, placeCount })
    ? createBackupReminder({ neverExported: !lastExportAt, onExport: () => navigate('/backup') })
    : null;
  let current = query.get('tab') === STATUS.BEEN_THERE ? STATUS.BEEN_THERE : STATUS.WANT_TO_GO;
  let term = query.get('q') ?? '';
  let filters = filtersFromQuery(query);
  let debounce = null;
  const allTags = uniqueTags([...lists[STATUS.WANT_TO_GO], ...lists[STATUS.BEEN_THERE]].map((i) => i.place));

  const tabButtons = new Map();
  const tabCounts = new Map();
  const panel = h('section', { class: 'tab-panel', id: 'home-panel', role: 'tabpanel' });
  const filtered = (status) => applyFilters(searchByName(lists[status], term), filters);
  // `lists` are already in the saved order and search/filters keep the order, so the sort
  // (applied after them, RN16) only reruns when the user picks another one.
  const visible = filtered;

  const sortLabelText = h('span', {});
  const sortButton = h('button', {
    type: 'button',
    class: 'sort-btn',
    onclick: () => openSortSheet({
      status: current,
      selected: sort[current],
      onSelect: async (key) => {
        const status = current;
        const previous = sort[status];
        sort[status] = key;
        lists[status] = sortItems(lists[status], key);
        update();
        try {
          await setHomeSort(status, key);
        } catch {
          // Keep screen and storage consistent: go back to the order that is actually saved.
          sort[status] = previous;
          lists[status] = sortItems(lists[status], previous);
          update();
          showToast('Não foi possível salvar a ordem.');
        }
      },
    }),
  }, sortLabelText, icon('chevron-down'));
  const sortRow = h('div', { class: 'sort-row' }, sortButton);

  // Redraws counts, filter badge and list for the current tab, search and filters, and keeps
  // them all in the URL so going back from a place returns to the same view.
  const update = () => {
    for (const { status } of TABS) tabCounts.get(status).textContent = String(filtered(status).length);
    paintFilterButton();
    const items = visible(current);
    const label = sortLabel(current, sort[current]);
    sortLabelText.textContent = `Ordenar: ${label}`;
    sortButton.setAttribute('aria-label', `Ordenar por: ${label}`);
    sortRow.hidden = items.length === 0;
    panel.replaceChildren(renderList(lists[current], items, current, {
      term, filtersActive: countActiveFilters(filters, current) > 0, clearSearch, clearFilters, clearAll,
    }));
    setQuery({
      tab: current === STATUS.WANT_TO_GO ? null : current,
      q: normalizeTerm(term) ? term : null,
      ...filtersToQuery(filters),
    });
  };

  const select = (status, { focus = false } = {}) => {
    current = status;
    for (const [s, button] of tabButtons) {
      const selected = s === status;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    }
    panel.setAttribute('aria-labelledby', `tab-${status}`);
    update();
  };

  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Listas' },
    TABS.map(({ status, label }) => {
      const count = h('span', { class: 'tab__count' });
      tabCounts.set(status, count);
      const button = h('button', {
        type: 'button',
        class: 'tab',
        role: 'tab',
        id: `tab-${status}`,
        'aria-controls': 'home-panel',
        onclick: () => select(status),
      }, h('span', {}, label), count);
      tabButtons.set(status, button);
      return button;
    }),
  );

  // ---- Search (RF09) ----
  const searchInput = h('input', {
    type: 'search',
    class: 'search__input',
    placeholder: 'Buscar por nome',
    'aria-label': 'Buscar lugar por nome',
    autocomplete: 'off',
    enterkeyhint: 'search',
    value: term,
  });
  const clearButton = h('button', {
    type: 'button',
    class: 'icon-btn search__clear',
    'aria-label': 'Limpar busca',
    hidden: !term,
  }, icon('close'));

  function clearSearch() {
    clearTimeout(debounce);
    searchInput.value = '';
    term = '';
    clearButton.hidden = true;
    update();
    searchInput.focus();
  }

  searchInput.addEventListener('input', () => {
    clearButton.hidden = !searchInput.value;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      term = searchInput.value;
      update();
    }, SEARCH_DEBOUNCE_MS);
  });
  // Enter just closes the on-screen keyboard; results are already live.
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') searchInput.blur();
  });
  clearButton.addEventListener('click', clearSearch);

  // ---- Filters (RF10) ----
  const filterBadge = h('span', { class: 'filter-btn__badge', 'aria-hidden': 'true' });
  const filterButton = h('button', { type: 'button', class: 'icon-btn filter-btn' }, icon('filter'), filterBadge);
  function paintFilterButton() {
    const n = countActiveFilters(filters, current);
    filterBadge.textContent = n ? String(n) : '';
    filterBadge.hidden = !n;
    filterButton.classList.toggle('filter-btn--active', n > 0);
    filterButton.setAttribute('aria-label', n ? `Filtros (${n} ${n === 1 ? 'ativo' : 'ativos'})` : 'Filtros');
  }
  function clearFilters() {
    filters = emptyFilters();
    update();
  }
  function clearAll() {
    clearTimeout(debounce);
    searchInput.value = '';
    term = '';
    clearButton.hidden = true;
    clearFilters();
  }
  filterButton.addEventListener('click', () => openFilterSheet({
    filters,
    status: current,
    allTags,
    onApply: (next) => { filters = next; update(); },
  }));

  const searchBar = h('div', { class: 'search', role: 'search' },
    h('div', { class: 'search__field' },
      h('span', { class: 'search__icon' }, icon('search')),
      searchInput,
      clearButton),
    filterButton,
  );
  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  tablist.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const i = TABS.findIndex((t) => t.status === current);
    const next = TABS[(i + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    select(next.status, { focus: true });
  });

  root.append(
    createHeader({
      title: 'Diário de Rolê',
      actions: [iconButton({ name: 'backup', label: 'Backup', onClick: () => navigate('/backup') })],
    }),
    h('div', { class: 'home-bar' }, tablist, searchBar),
    h('main', { class: 'page' }, reminder, sortRow, panel),
    h('button', { type: 'button', class: 'fab', onclick: () => navigate(newPlacePath(current)) },
      icon('plus'), h('span', {}, 'Novo')),
  );
  select(current);

  return () => clearTimeout(debounce);
}

function renderList(allItems, items, status, { term, filtersActive, clearSearch, clearFilters, clearAll }) {
  if (!allItems.length) {
    return createEmptyState({
      ...EMPTY[status],
      action: { label: 'Cadastrar lugar', onClick: () => navigate(newPlacePath(status)) },
    });
  }
  if (!items.length) {
    const tab = TABS.find((t) => t.status === status).label;
    const searching = Boolean(normalizeTerm(term));
    if (searching && filtersActive) {
      return createEmptyState({
        title: 'Nenhum lugar encontrado',
        message: `Nada com "${term.trim()}" e os filtros atuais em "${tab}".`,
        action: { label: 'Limpar busca e filtros', onClick: clearAll },
      });
    }
    if (filtersActive) {
      return createEmptyState({
        title: 'Nenhum lugar encontrado',
        message: `Nenhum lugar em "${tab}" atende aos filtros.`,
        action: { label: 'Limpar filtros', onClick: clearFilters },
      });
    }
    return createEmptyState({
      title: 'Nenhum lugar encontrado',
      message: `Nada com "${term.trim()}" em "${tab}".`,
      action: { label: 'Limpar busca', onClick: clearSearch },
    });
  }
  const list = h('ul', { class: 'card-list' });
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(renderCard(item, status));
  list.append(fragment);
  return list;
}

function renderCard({ place, summary }, status) {
  const href = `#/place/${encodeURIComponent(place.id)}`;
  const tags = place.tags ?? [];
  const extraTags = tags.length - MAX_TAGS_ON_CARD;

  let visitLine = null;
  if (status === STATUS.BEEN_THERE) {
    visitLine = summary.visitCount
      ? h('p', { class: 'place-card__visits' },
        h('span', { class: 'place-card__rating' },
          h('span', { class: 'sr-only' }, 'Média '), icon('star'), formatAverage(summary.average)),
        h('span', {}, `Última visita ${formatDate(summary.lastVisit)}`))
      : h('p', { class: 'place-card__visits place-card__visits--none' }, 'Nenhuma visita registrada');
  }

  // The heart is a sibling of the link (a button inside a link is invalid and would open the card).
  return h('li', { class: 'card-item' },
    h('a', {
      class: 'place-card',
      href,
      onclick: (event) => {
        event.preventDefault();
        navigate(`/place/${encodeURIComponent(place.id)}`);
      },
    },
    h('h2', { class: 'place-card__name' }, place.name),
    h('p', { class: 'place-card__type' }, placeTypeLabel(place.type)),
    tags.length > 0 && h('ul', { class: 'tag-list', 'aria-label': 'Tags' },
      tags.slice(0, MAX_TAGS_ON_CARD).map((tag) => h('li', { class: 'tag' }, tag)),
      extraTags > 0 && h('li', { class: 'tag tag--more' }, `+${extraTags}`, h('span', { class: 'sr-only' }, ' tags'))),
    visitLine,
    ),
    createFavoriteButton({
      placeId: place.id,
      placeName: place.name,
      favorite: place.favorite,
      className: 'card-item__favorite',
      // Keep the in-memory list in sync so switching tabs shows the right heart.
      onChange: (favorite) => { place.favorite = favorite; },
    }),
  );
}

// ---------------------------------------------------------------- Sort panel (T7, CARD-027)

/** Single-choice sheet: tapping an option applies it and closes; closing any other way changes nothing. */
function openSortSheet({ status, selected, onSelect }) {
  let sheet;
  const options = SORT_OPTIONS[status].map(({ code, label }, i) => {
    const input = h('input', {
      type: 'radio', name: 'sort', class: 'toggle__input', id: `sort-${i}`, value: code, checked: code === selected,
    });
    input.addEventListener('change', () => {
      sheet.close();
      onSelect(code);
    });
    return [input, h('label', { class: 'toggle-chip sort-option', for: input.id }, label)];
  });
  const content = h('div', { class: 'sort-options', role: 'radiogroup', 'aria-label': 'Ordenar por' }, options);
  sheet = openBottomSheet({ title: 'Ordenar por', content });
}

// ---------------------------------------------------------------- Filter panel (T2, CARD-015)

/**
 * Opens the filter bottom sheet. Edits a draft: "Aplicar" applies it, "Limpar" clears everything
 * and applies, closing any other way discards the changes.
 * "Voltaria = sim" and minimum rating only show in "Já fui" (and are kept, untouched, elsewhere).
 */
function openFilterSheet({ filters, status, allTags, onApply }) {
  const draft = { ...filters, types: [...filters.types], tags: [...filters.tags] };
  const beenThere = status === STATUS.BEEN_THERE;

  const toggleList = (key, options, idPrefix) => h('div', { class: 'toggle-group' },
    options.map(({ value, label }, i) => {
      const input = h('input', {
        type: 'checkbox', class: 'toggle__input', id: `${idPrefix}-${i}`, value,
        checked: draft[key].some((v) => v.toLowerCase() === value.toLowerCase()),
      });
      input.addEventListener('change', () => {
        draft[key] = input.checked
          ? [...draft[key], value]
          : draft[key].filter((v) => v.toLowerCase() !== value.toLowerCase());
      });
      return [input, h('label', { class: 'toggle-chip', for: input.id }, label)];
    }));

  const switchRow = (key, id, label) => {
    const input = h('input', { type: 'checkbox', class: 'toggle__input', id, checked: draft[key] });
    input.addEventListener('change', () => { draft[key] = input.checked; });
    return h('div', { class: 'toggle-group' }, input, h('label', { class: 'toggle-chip', for: id }, label));
  };

  const section = (title, ...content) => h('fieldset', { class: 'filter-section' },
    h('legend', { class: 'filter-section__title' }, title), content);

  const minRating = h('div', { class: 'toggle-group', role: 'radiogroup', 'aria-label': 'Nota mínima' },
    [null, ...MIN_RATINGS].map((n) => {
      const input = h('input', {
        type: 'radio', name: 'filter-min', class: 'toggle__input', id: `filter-min-${n ?? 'any'}`,
        checked: draft.minRating === n,
      });
      input.addEventListener('change', () => { if (input.checked) draft.minRating = n; });
      return [input, h('label', { class: 'toggle-chip', for: input.id }, n === null ? 'Qualquer' : n === 5 ? '5' : `${n} ou mais`)];
    }));

  const content = h('div', { class: 'filters' },
    section('Tipo', toggleList('types', PLACE_TYPES, 'filter-type')),
    allTags.length > 0 && section('Tags', toggleList('tags', allTags.map((t) => ({ value: t, label: t })), 'filter-tag')),
    section('Favoritos', switchRow('favoritesOnly', 'filter-fav', 'Só favoritos')),
    beenThere && section('Voltaria', switchRow('wouldReturn', 'filter-ret', 'Voltaria = sim')),
    beenThere && section('Nota mínima (média)', minRating),
  );

  let sheet;
  const footer = h('div', {},
    h('button', {
      type: 'button',
      class: 'btn btn-ghost',
      onclick: () => { sheet.close(); onApply(emptyFilters()); },
    }, 'Limpar'),
    h('button', {
      type: 'button',
      class: 'btn btn-primary',
      onclick: () => { sheet.close(); onApply(draft); },
    }, 'Aplicar'),
  );

  sheet = openBottomSheet({ title: 'Filtros', content, footer });
}
