// T1 — Home: "Quero ir" / "Já fui" tabs with place cards (CARD-008).
// Search (CARD-009), filters (CARD-015) and the backup reminder (CARD-018) arrive later.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate, setQuery } from '../../router.js';
import { createHeader, iconButton } from '../components/header.js';
import { createEmptyState } from '../components/empty-state.js';
import { formatAverage, formatDate } from '../format.js';
import { loadHomeLists } from '../../services/lists.js';
import { STATUS, placeTypeLabel } from '../../services/places.js';

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
  const lists = await loadHomeLists();
  let current = query.get('tab') === STATUS.BEEN_THERE ? STATUS.BEEN_THERE : STATUS.WANT_TO_GO;

  const tabButtons = new Map();
  const panel = h('section', { class: 'tab-panel', id: 'home-panel', role: 'tabpanel' });

  const select = (status, { focus = false } = {}) => {
    current = status;
    for (const [s, button] of tabButtons) {
      const selected = s === status;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    }
    panel.setAttribute('aria-labelledby', `tab-${status}`);
    panel.replaceChildren(renderList(lists[status], status));
    setQuery({ tab: status === STATUS.WANT_TO_GO ? null : status });
  };

  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Listas' },
    TABS.map(({ status, label }) => {
      const button = h('button', {
        type: 'button',
        class: 'tab',
        role: 'tab',
        id: `tab-${status}`,
        'aria-controls': 'home-panel',
        onclick: () => select(status),
      },
      h('span', {}, label),
      h('span', { class: 'tab__count' }, String(lists[status].length)));
      tabButtons.set(status, button);
      return button;
    }),
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
    tablist,
    h('main', { class: 'page' }, panel),
    h('button', { type: 'button', class: 'fab', onclick: () => navigate('/place/new') },
      icon('plus'), h('span', {}, 'Novo')),
  );
  select(current);
}

function renderList(items, status) {
  if (!items.length) {
    return createEmptyState({
      ...EMPTY[status],
      action: { label: 'Cadastrar lugar', onClick: () => navigate('/place/new') },
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
