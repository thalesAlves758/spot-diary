// Backup export (CARD-016). Import arrives in CARD-017. No DOM here: the UI does the download.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import * as meta from '../db/meta.js';
import { SCHEMA_VERSION } from '../db/index.js';
import { nowISO } from '../db/util.js';

export const BACKUP_APP = 'diario-de-role';

/** Backup object in the documented format (refinamento, "Formato do backup"). Pure. */
export function createBackup(places, visits, exportedAt = nowISO()) {
  return { app: BACKUP_APP, schemaVersion: SCHEMA_VERSION, exportedAt, places, visits };
}

/** Reads every place and visit and builds the backup. */
export async function buildBackup() {
  const [places, visits] = await Promise.all([placesDb.list(), visitsDb.listAll()]);
  return createBackup(places, visits);
}

/** Backup as pretty-printed JSON text (readable if the user opens the file). */
export function serializeBackup(backup) {
  return JSON.stringify(backup, null, 2);
}

/**
 * File name with the user's local date: `diario-de-role-2026-11-07.json`.
 * Uses the local calendar day, not UTC (at 22:00 in Brazil, UTC is already the next day).
 */
export function backupFileName(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${BACKUP_APP}-${y}-${m}-${d}.json`;
}

/** Records when the last export happened (used by the backup reminder, CARD-018). */
export function markExported(at = nowISO()) {
  return meta.set('lastExportAt', at);
}

/** ISO date-time of the last export, or `undefined` if there never was one. */
export function getLastExportAt() {
  return meta.get('lastExportAt');
}

/** How many places and visits an export would contain right now. */
export async function countData() {
  const [places, visits] = await Promise.all([placesDb.list(), visitsDb.listAll()]);
  return { places: places.length, visits: visits.length };
}
