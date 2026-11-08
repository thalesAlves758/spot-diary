// "Apagar todos os dados" (CARD-026, RF18). No DOM here.
import { clearData } from '../db/index.js';

/**
 * Deletes every place and visit, and the last-export date, in one transaction.
 * Keeps `schemaVersion` and `persistentStorage`: they describe the database and the device,
 * not the user's data. There is no undo; going back means importing a backup (CARD-017).
 */
export function eraseAllData() {
  return clearData({ metaKeys: ['lastExportAt'] });
}
