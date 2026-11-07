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

/** Deletes a visit. */
export function remove(id) {
  return transaction(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).delete(id);
  });
}
