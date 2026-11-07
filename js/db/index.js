// The only module in the app that knows about IndexedDB.
// Opens the database, creates stores and indexes, runs migrations and provides transaction helpers.

const DB_NAME = 'diario-de-role';

/** Schema version: the IndexedDB version, also stored in `meta` and in backups. */
export const SCHEMA_VERSION = 1;

/**
 * Migrations by version. Each entry upgrades the database from the previous version to its own.
 * To change the schema: bump SCHEMA_VERSION and add a new entry here; never edit existing ones.
 */
const migrations = {
  1(db) {
    const places = db.createObjectStore('places', { keyPath: 'id' });
    places.createIndex('name', 'name');
    places.createIndex('type', 'type');
    places.createIndex('tags', 'tags', { multiEntry: true });
    places.createIndex('status', 'status');
    // No `favorite` index: booleans are not valid IndexedDB keys, so the index would always be
    // empty. The favorites filter runs in memory (services/).

    const visits = db.createObjectStore('visits', { keyPath: 'id' });
    visits.createIndex('placeId', 'placeId');
    visits.createIndex('date', 'date');

    db.createObjectStore('meta', { keyPath: 'key' });
  },
};

let connection = null;

/** Opens the database connection (only once). */
export function openDatabase() {
  connection ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;
      for (let v = event.oldVersion + 1; v <= SCHEMA_VERSION; v++) {
        migrations[v](db, req.transaction);
      }
      req.transaction.objectStore('meta').put({ key: 'schemaVersion', value: SCHEMA_VERSION });
    };

    req.onsuccess = () => {
      const db = req.result;
      // Another tab opened a newer version: close this connection so it doesn't block the upgrade.
      db.onversionchange = () => {
        db.close();
        connection = null;
      };
      resolve(db);
    };

    req.onerror = () => {
      connection = null;
      reject(req.error);
    };

    req.onblocked = () => {
      console.warn('Database blocked by another tab running an older version; waiting for it to close.');
    };
  });
  return connection;
}

/** Wraps an IDBRequest in a Promise. */
export function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Runs `fn(tx)` in a transaction and resolves with `fn`'s return value only after commit.
 * If `fn` throws or any request fails, the whole transaction is rolled back.
 *
 * Inside `fn`, only `await` IndexedDB requests (via `request`): awaiting anything else
 * (fetch, timers) lets the transaction auto-commit.
 */
export async function transaction(stores, mode, fn) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let result;
    let failed = false;

    tx.oncomplete = () => resolve(result);
    tx.onabort = () => {
      if (!failed) reject(tx.error ?? new DOMException('Transaction aborted', 'AbortError'));
    };

    const abortWith = (error) => {
      failed = true;
      try { tx.abort(); } catch { /* already finished */ }
      reject(error);
    };

    try {
      Promise.resolve(fn(tx)).then((r) => { result = r; }, abortWith);
    } catch (error) {
      abortWith(error);
    }
  });
}

/**
 * Writes many records in a single transaction without touching timestamps (used by import).
 * `recordsByStore`: e.g. `{ places: [...], visits: [...] }`.
 * With `clearFirst`, empties those stores before writing. All or nothing.
 */
export function bulkWrite(recordsByStore, { clearFirst = false } = {}) {
  const stores = Object.keys(recordsByStore);
  return transaction(stores, 'readwrite', (tx) => {
    for (const name of stores) {
      const store = tx.objectStore(name);
      if (clearFirst) store.clear();
      for (const record of recordsByStore[name]) store.put(record);
    }
  });
}
