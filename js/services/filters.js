// Search and filters for the home lists. Pure functions, no DOM. Filters arrive in CARD-015.
import { foldText } from './places.js';

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
