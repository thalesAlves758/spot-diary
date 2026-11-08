// Ordering of the home lists (RF19, RN13–RN15). Pure: no DOM, no storage.
import { STATUS } from './places.js';

/** Sort options per tab: `code` is stored, `label` is shown in the UI. The first one is the default. */
export const SORT_OPTIONS = {
  [STATUS.WANT_TO_GO]: [
    { code: 'created_desc', label: 'Adicionados mais recentes' },
    { code: 'created_asc', label: 'Adicionados mais antigos' },
    { code: 'name_asc', label: 'A–Z' },
  ],
  [STATUS.BEEN_THERE]: [
    { code: 'last_visit_desc', label: 'Última visita mais recente' },
    { code: 'last_visit_asc', label: 'Última visita mais antiga' },
    { code: 'name_asc', label: 'A–Z' },
    { code: 'rating_desc', label: 'Maior nota' },
    { code: 'visits_desc', label: 'Mais visitados' },
  ],
};

export const DEFAULT_SORT = {
  [STATUS.WANT_TO_GO]: 'created_desc',
  [STATUS.BEEN_THERE]: 'last_visit_desc',
};

export function isValidSort(status, key) {
  return (SORT_OPTIONS[status] ?? []).some((o) => o.code === key);
}

/** A code that doesn't exist in the tab goes back to the tab's default. */
export function normalizeSort(status, key) {
  return isValidSort(status, key) ? key : DEFAULT_SORT[status];
}

export function sortLabel(status, key) {
  return SORT_OPTIONS[status].find((o) => o.code === normalizeSort(status, key)).label;
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

const byName = (a, b) => collator.compare(a.place.name ?? '', b.place.name ?? '');
const created = (item) => item.place.createdAt ?? '';
const byCreatedDesc = (a, b) => created(b).localeCompare(created(a));
const byCreatedAsc = (a, b) => created(a).localeCompare(created(b));
const byLastVisitDesc = (a, b) => (b.summary.lastVisit ?? '').localeCompare(a.summary.lastVisit ?? '');
const byLastVisitAsc = (a, b) => (a.summary.lastVisit ?? '').localeCompare(b.summary.lastVisit ?? '');

const chain = (...comparators) => (a, b) => {
  for (const compare of comparators) {
    const result = compare(a, b);
    if (result) return result;
  }
  return 0;
};

/** Places without visits always go last (RN14), the newest added first among them. */
const withVisitsFirst = (compare) => (a, b) => {
  const hasA = a.summary.visitCount > 0;
  const hasB = b.summary.visitCount > 0;
  if (hasA !== hasB) return hasA ? -1 : 1;
  if (!hasA) return chain(byCreatedDesc, byName)(a, b);
  return compare(a, b);
};

const COMPARATORS = {
  created_desc: chain(byCreatedDesc, byName),
  created_asc: chain(byCreatedAsc, byName),
  name_asc: chain(byName, byCreatedDesc),
  last_visit_desc: withVisitsFirst(chain(byLastVisitDesc, byName)),
  last_visit_asc: withVisitsFirst(chain(byLastVisitAsc, byName)),
  rating_desc: withVisitsFirst(chain((a, b) => (b.summary.average || 0) - (a.summary.average || 0), byLastVisitDesc, byName)),
  visits_desc: withVisitsFirst(chain((a, b) => (b.summary.visitCount || 0) - (a.summary.visitCount || 0), byLastVisitDesc, byName)),
};

/** Sorted copy of `[{ place, summary }]`. An unknown code falls back to "created_desc". */
export function sortItems(items, sortKey) {
  return [...items].sort(COMPARATORS[sortKey] ?? COMPARATORS.created_desc);
}
