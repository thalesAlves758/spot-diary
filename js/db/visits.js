import { transaction, request } from './index.js';
import { stamp } from './util.js';

const STORE = 'visits';

/** All visits, in no guaranteed order. */
export function listAll() {
  return transaction(STORE, 'readonly', (tx) => request(tx.objectStore(STORE).getAll()));
}

/** Visits of one place, in no guaranteed order. */
export function listByPlace(placeId) {
  return transaction(STORE, 'readonly', (tx) =>
    request(tx.objectStore(STORE).index('placeId').getAll(placeId)));
}

/** A visit by ID, or `undefined` if it doesn't exist. */
export function get(id) {
  return transaction(STORE, 'readonly', (tx) => request(tx.objectStore(STORE).get(id)));
}

/** Creates or updates a visit. Resolves with the stored record (with `id` and timestamps). */
export function save(visit) {
  const record = stamp(visit);
  return transaction(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put(record);
    return record;
  });
}

/**
 * Saves a visit and, if given, a place in the same transaction (both stamped): either both are
 * written or neither is. Which place changes (and how) is decided by services/.
 * Resolves with `{ visit, place }` as stored (`place` is null when not given).
 */
export function saveWithPlace(visit, place = null) {
  const visitRecord = stamp(visit);
  const placeRecord = place ? stamp(place) : null;
  return transaction([STORE, 'places'], 'readwrite', (tx) => {
    tx.objectStore(STORE).put(visitRecord);
    if (placeRecord) tx.objectStore('places').put(placeRecord);
    return { visit: visitRecord, place: placeRecord };
  });
}

/** Deletes a visit. */
export function remove(id) {
  return transaction(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).delete(id);
  });
}
