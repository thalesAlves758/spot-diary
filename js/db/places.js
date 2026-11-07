import { transaction, request } from './index.js';
import { stamp } from './util.js';

const STORE = 'places';

/** All places, in no guaranteed order. */
export function list() {
  return transaction(STORE, 'readonly', (tx) => request(tx.objectStore(STORE).getAll()));
}

/** Places with a given status (`want_to_go` or `been_there`). */
export function listByStatus(status) {
  return transaction(STORE, 'readonly', (tx) =>
    request(tx.objectStore(STORE).index('status').getAll(status)));
}

/** A place by ID, or `undefined` if it doesn't exist. */
export function get(id) {
  return transaction(STORE, 'readonly', (tx) => request(tx.objectStore(STORE).get(id)));
}

/** Creates or updates a place. Resolves with the stored record (with `id` and timestamps). */
export function save(place) {
  const record = stamp(place);
  return transaction(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put(record);
    return record;
  });
}

/**
 * Deletes the place and all of its visits in a single transaction (RN06).
 * Resolves with the number of visits deleted.
 */
export function deleteWithVisits(id) {
  return transaction([STORE, 'visits'], 'readwrite', async (tx) => {
    const visits = tx.objectStore('visits');
    const ids = await request(visits.index('placeId').getAllKeys(id));
    for (const visitId of ids) visits.delete(visitId);
    tx.objectStore(STORE).delete(id);
    return ids.length;
  });
}
