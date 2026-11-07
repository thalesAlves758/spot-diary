// The two home lists ("Quero ir" / "Já fui"). No DOM here.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import { STATUS } from './places.js';
import { withSummaries } from './summary.js';

const byCreatedDesc = (a, b) => (b.place.createdAt ?? '').localeCompare(a.place.createdAt ?? '');

/** "Quero ir": most recently added first. */
export function sortWantToGo(items) {
  return [...items].sort(byCreatedDesc);
}

/** "Já fui": most recent visit first; places without visits at the end. */
export function sortBeenThere(items) {
  return [...items].sort((a, b) => {
    const da = a.summary.lastVisit;
    const db = b.summary.lastVisit;
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? 1 : -1;
    }
    return byCreatedDesc(a, b);
  });
}

/**
 * Splits places by status and sorts each list (RF08). Pure.
 * Returns `{ want_to_go: [{ place, summary }], been_there: [...] }`.
 */
export function buildHomeLists(places, visits) {
  const items = withSummaries(places, visits);
  return {
    [STATUS.WANT_TO_GO]: sortWantToGo(items.filter((i) => i.place.status === STATUS.WANT_TO_GO)),
    [STATUS.BEEN_THERE]: sortBeenThere(items.filter((i) => i.place.status === STATUS.BEEN_THERE)),
  };
}

/** Loads places and visits once and builds both lists. */
export async function loadHomeLists() {
  const [places, visits] = await Promise.all([placesDb.list(), visitsDb.listAll()]);
  return buildHomeLists(places, visits);
}
