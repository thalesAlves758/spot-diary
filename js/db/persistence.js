import * as meta from './meta.js';

/**
 * Asks for persistent storage so the browser doesn't evict the database under storage pressure.
 * Chrome decides on its own (it usually grants it once the app is installed), so asking on every
 * launch is harmless and improves the odds. Stores the result in `meta`.
 */
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  const persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist());
  await meta.set('persistentStorage', persisted);
  return persisted;
}
