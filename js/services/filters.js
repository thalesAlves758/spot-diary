// Search and filters for the home lists (RF09, RF10). Pure functions, no DOM.
import { foldText, STATUS, PLACE_TYPES } from './places.js';

/** Normalized search term: no accents, lowercase, single spaces. Empty string means "no search". */
export function normalizeTerm(term) {
  return foldText(term).replace(/\s+/g, ' ').trim();
}

/**
 * Keeps the entries whose name contains `term`, ignoring case and accents (RF09):
 * "ze" finds "Bar do Zé". Works with places or with home items (`{ place, summary }`).
 * An empty term returns the list unchanged.
 */
export function searchByName(list, term) {
  const q = normalizeTerm(term);
  if (!q) return list;
  return list.filter((entry) => normalizeTerm((entry.place ?? entry).name).includes(q));
}

// ---------------------------------------------------------------- Filters (CARD-015)

export const MIN_RATINGS = [1, 2, 3, 4, 5];

/** No filter active. */
export function emptyFilters() {
  return { types: [], tags: [], favoritesOnly: false, wouldReturn: false, minRating: null };
}

/**
 * Applies the filters to home items (`{ place, summary }`) (RF10).
 * - Same criterion: OR (bar OR pizzeria). Different criteria: AND.
 * - Tags compare without case. "Só favoritos" is independent of status and rating (RN09).
 * - "Voltaria = sim" looks at the most recent visit (RN07); minimum rating compares with the
 *   average (RN08). Both only apply to "Já fui" places, so they're ignored in "Quero ir";
 *   a "Já fui" place without visits never passes them.
 */
export function applyFilters(items, filters) {
  const f = { ...emptyFilters(), ...filters };
  const types = new Set(f.types);
  const tags = new Set(f.tags.map((t) => t.toLowerCase()));
  return items.filter(({ place, summary }) => {
    if (types.size && !types.has(place.type)) return false;
    if (tags.size && !(place.tags ?? []).some((t) => tags.has(t.toLowerCase()))) return false;
    if (f.favoritesOnly && !place.favorite) return false;
    if (place.status === STATUS.BEEN_THERE) {
      if (f.wouldReturn && !(summary.visitCount > 0 && summary.lastWouldReturn === true)) return false;
      if (f.minRating && !(summary.visitCount > 0 && summary.average >= f.minRating)) return false;
    }
    return true;
  });
}

/** How many criteria are active for a tab (the "Já fui" ones don't count in "Quero ir"). */
export function countActiveFilters(filters, status) {
  const f = { ...emptyFilters(), ...filters };
  let n = 0;
  if (f.types.length) n++;
  if (f.tags.length) n++;
  if (f.favoritesOnly) n++;
  if (status === STATUS.BEEN_THERE) {
    if (f.wouldReturn) n++;
    if (f.minRating) n++;
  }
  return n;
}

/** Filters as URL query entries (empty ones left out): `{ types: 'bar,cafe', tags: '…', fav: '1', ret: '1', min: '4' }`. */
export function filtersToQuery(filters) {
  const f = { ...emptyFilters(), ...filters };
  return {
    types: f.types.length ? f.types.join(',') : null,
    tags: f.tags.length ? f.tags.join(',') : null,
    fav: f.favoritesOnly ? '1' : null,
    ret: f.wouldReturn ? '1' : null,
    min: f.minRating ? String(f.minRating) : null,
  };
}

/** Reads filters back from a URLSearchParams, ignoring anything invalid. */
export function filtersFromQuery(query) {
  const list = (key) => (query.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const validTypes = new Set(PLACE_TYPES.map((t) => t.value));
  const min = Number(query.get('min'));
  return {
    types: list('types').filter((t) => validTypes.has(t)),
    tags: list('tags'),
    favoritesOnly: query.get('fav') === '1',
    wouldReturn: query.get('ret') === '1',
    minRating: MIN_RATINGS.includes(min) ? min : null,
  };
}
