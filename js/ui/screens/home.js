// T1 — Home: "Quero ir" / "Já fui" tabs with place cards (CARD-008), search by name (CARD-009)
// and the backup reminder (CARD-018). Filters arrive in CARD-015.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate, setQuery } from '../../router.js';
import { createHeader, iconButton } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';
import { createBackupReminder, isBackupReminderDismissed } from '../components/backup-reminder.js';
import { formatAverage, formatDate } from '../format.js';
import { loadHomeLists } from '../../services/lists.js';
import { searchByName, normalizeTerm } from '../../services/filters.js';
import { STATUS, placeTypeLabel } from '../../services/places.js';
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

export async function render(root, { query }) {
  const [lists, lastExportAt] = await Promise.all([loadHomeLists(), getLastExportAt()]);
  const placeCount = lists[STATUS.WANT_TO_GO].length + lists[STATUS.BEEN_THERE].length;
  const reminder = !isBackupReminderDismissed() && shouldRemindBackup({ lastExportAt, placeCount })
    ? createBackupReminder({ neverExported: !lastExportAt, onExport: () => navigate('/backup') })
    : null;
  let current = query.get('tab') === STATUS.BEEN_THERE ? STATUS.BEEN_THERE : STATUS.WANT_TO_GO;
  let term = query.get('q') ?? '';
  let debounce = null;

  const tabButtons = new Map();
  const tabCounts = new Map();
  const panel = h('section', { class: 'tab-panel', id: 'home-panel', role: 'tabpanel' });

  // Redraws counts and list for the current tab and term, and keeps both in the URL
  // so going back from a place returns to the same tab and search.
  const update = () => {
    for (const { status } of TABS) tabCounts.get(status).textContent = String(searchByName(lists[status], term).length);
    panel.replaceChildren(renderList(lists[current], current, term, clearSearch));
    setQuery({ tab: current === STATUS.WANT_TO_GO ? null : current, q: normalizeTerm(term) ? term : null });
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

  const searchBar = h('div', { class: 'search', role: 'search' },
    h('span', { class: 'search__icon' }, icon('search')),
    searchInput,
    clearButton,
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
    h('main', { class: 'page' }, reminder, panel),
    h('button', { type: 'button', class: 'fab', onclick: () => navigate('/place/new') },
      icon('plus'), h('span', {}, 'Novo')),
  );
  select(current);

  return () => clearTimeout(debounce);
}

function renderList(allItems, status, term, clearSearch) {
  if (!allItems.length) {
    return createEmptyState({
      ...EMPTY[status],
      action: { label: 'Cadastrar lugar', onClick: () => navigate('/place/new') },
    });
  }
  const items = searchByName(allItems, term);
  if (!items.length) {
    const tab = TABS.find((t) => t.status === status).label;
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

  return h('li', {},
    h('a', {
      class: 'place-card',
      href,
      onclick: (event) => {
        event.preventDefault();
        navigate(`/place/${encodeURIComponent(place.id)}`);
      },
    },
    h('div', { class: 'place-card__top' },
      h('h2', { class: 'place-card__name' }, place.name),
      place.favorite && h('span', { class: 'place-card__favorite', role: 'img', 'aria-label': 'Favorito' }, icon('heart')),
    ),
    h('p', { class: 'place-card__type' }, placeTypeLabel(place.type)),
    tags.length > 0 && h('ul', { class: 'tag-list', 'aria-label': 'Tags' },
      tags.slice(0, MAX_TAGS_ON_CARD).map((tag) => h('li', { class: 'tag' }, tag)),
      extraTags > 0 && h('li', { class: 'tag tag--more' }, `+${extraTags}`, h('span', { class: 'sr-only' }, ' tags'))),
    visitLine,
    ),
  );
}
