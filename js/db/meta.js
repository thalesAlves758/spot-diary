import { transaction, request } from './index.js';

// App key/value pairs: `schemaVersion`, `lastExportAt`, `persistentStorage`.
const STORE = 'meta';

/** Value for a key, or `undefined` if it doesn't exist. */
export async function get(key) {
  const record = await transaction(STORE, 'readonly', (tx) => request(tx.objectStore(STORE).get(key)));
  return record?.value;
}

export function set(key, value) {
  return transaction(STORE, 'readwrite', (tx) => {
    tx.objectStore(STORE).put({ key, value });
  });
}
