// The two home lists ("Quero ir" / "Já fui"). No DOM here.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import * as meta from '../db/meta.js';
import { STATUS } from './places.js';
import { withSummaries } from './summary.js';
import { DEFAULT_SORT, normalizeSort, sortItems } from './sorting.js';

/**
 * Splits places by status and sorts each list (RF08, RF19). Pure.
 * `sort` is `{ want_to_go, been_there }` of sort codes; missing or invalid ones use the defaults.
 * Returns `{ want_to_go: [{ place, summary }], been_there: [...] }`.
 */
export function buildHomeLists(places, visits, sort = DEFAULT_SORT) {
  const items = withSummaries(places, visits);
  const listFor = (status) => sortItems(
    items.filter((i) => i.place.status === status),
    normalizeSort(status, sort?.[status]),
  );
  return {
    [STATUS.WANT_TO_GO]: listFor(STATUS.WANT_TO_GO),
    [STATUS.BEEN_THERE]: listFor(STATUS.BEEN_THERE),
  };
}

/**
 * One random item (RN22). With 2+ items, never returns `excludeId`. `null` if the list is empty.
 * Items are `{ place, summary }`; each candidate has the same chance.
 */
export function pickRandom(items, { excludeId = null, random = Math.random } = {}) {
  if (!items.length) return null;
  const pool = items.length > 1 ? items.filter((i) => i.place.id !== excludeId) : items;
  return pool[Math.floor(random() * pool.length)];
}

/** Loads places and visits once and builds both lists in the given order. */
export async function loadHomeLists(sort) {
  const [places, visits] = await Promise.all([placesDb.list(), visitsDb.listAll()]);
  return buildHomeLists(places, visits, sort);
}

const SORT_KEY = 'homeSort';

/** Saved order of each tab (RN16), already normalized. Never throws on bad stored data. */
export async function getHomeSort() {
  const saved = await meta.get(SORT_KEY);
  return {
    [STATUS.WANT_TO_GO]: normalizeSort(STATUS.WANT_TO_GO, saved?.[STATUS.WANT_TO_GO]),
    [STATUS.BEEN_THERE]: normalizeSort(STATUS.BEEN_THERE, saved?.[STATUS.BEEN_THERE]),
  };
}

let pendingSave = Promise.resolve();

/** Saves the order of one tab; the other tab keeps its own. Saves run one at a time. */
export function setHomeSort(status, key) {
  const run = async () => {
    const current = await getHomeSort();
    const next = { ...current, [status]: normalizeSort(status, key) };
    await meta.set(SORT_KEY, next);
    return next;
  };
  const result = pendingSave.then(run);
  pendingSave = result.catch(() => {});
  return result;
}
