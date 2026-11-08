// Backup import (CARD-017, RF13, RN11). Validation and both strategies are pure functions;
// only importBackup() touches the database, and it writes everything in one transaction.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import { SCHEMA_VERSION, bulkWrite } from '../db/index.js';
import { nowISO } from '../db/util.js';
import { BACKUP_APP } from './backup.js';
import {
  PLACE_TYPES, BRAZIL_STATES, STATUS, ADDRESS_FIELDS, cleanTags, cleanAddress, nameKey,
} from './places.js';
import { ImportError } from './errors.js';
import { isCalendarDate } from './dates.js';

export const IMPORT_MODE = { MERGE: 'merge', REPLACE: 'replace' };

const MAX_DETAILS = 5;
const STATUSES = Object.values(STATUS);
const TYPES = PLACE_TYPES.map((t) => t.value);

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isTimestamp = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const time = (iso) => Date.parse(iso);

/**
 * Converts a backup from an older schema version to the current one.
 * Hook for future schema changes (CARD-017): add a step per version, e.g. `if (v < 2) data = toV2(data)`.
 */
export function migrateBackup(data) {
  return { ...data, schemaVersion: SCHEMA_VERSION };
}

/**
 * Parses and validates the text of a backup file. Pure.
 * Returns the backup with normalized places and visits; throws `ImportError` otherwise.
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError('O arquivo não é um JSON válido.');
  }
  if (!isObject(data) || data.app !== BACKUP_APP) {
    throw new ImportError('Esse arquivo não é um backup do Diário de Rolê.');
  }
  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
    throw new ImportError('O backup não informa uma versão válida.');
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new ImportError('Esse backup veio de uma versão mais nova do app. Atualize o app antes de importar.');
  }
  data = migrateBackup(data);
  if (!Array.isArray(data.places) || !Array.isArray(data.visits)) {
    throw new ImportError('O backup não tem as listas de lugares e visitas.');
  }

  const problems = [];
  const places = data.places.map((p, i) => validatePlace(p, `Lugar ${i + 1}`, problems));
  const visits = data.visits.map((v, i) => validateVisit(v, `Visita ${i + 1}`, problems));

  checkUnique(places, (p) => p.id, (p, i) => `Lugar ${i + 1}: ID repetido no arquivo`, problems);
  checkUnique(places, (p) => nameKey(p.name), (p, i) => `Lugar ${i + 1}: nome "${p.name}" repetido no arquivo`, problems);
  checkUnique(visits, (v) => v.id, (v, i) => `Visita ${i + 1}: ID repetido no arquivo`, problems);

  if (problems.length) {
    throw new ImportError('O backup tem dados inválidos e não foi importado.', limitDetails(problems));
  }
  return { app: BACKUP_APP, schemaVersion: SCHEMA_VERSION, exportedAt: isTimestamp(data.exportedAt) ? data.exportedAt : null, places, visits };
}

function validatePlace(p, label, problems) {
  const bad = (msg) => problems.push(`${label}: ${msg}`);
  if (!isObject(p)) { bad('formato inválido'); return {}; }
  if (!isNonEmptyString(p.id)) bad('sem ID');
  if (!isNonEmptyString(p.name)) bad('sem nome');
  if (!TYPES.includes(p.type)) bad('tipo inválido');
  if (!STATUSES.includes(p.status)) bad('status inválido');
  if (p.tags !== undefined && (!Array.isArray(p.tags) || p.tags.some((t) => typeof t !== 'string'))) bad('tags inválidas');
  if (p.address !== undefined && (!isObject(p.address)
    || ADDRESS_FIELDS.some((f) => p.address[f] !== undefined && typeof p.address[f] !== 'string'))) bad('endereço inválido');
  else if (p.address?.state && !BRAZIL_STATES.includes(p.address.state.trim())) bad('UF inválida');
  if (p.favorite !== undefined && typeof p.favorite !== 'boolean') bad('favorito inválido');
  if (!isTimestamp(p.createdAt) || !isTimestamp(p.updatedAt)) bad('datas de criação/atualização inválidas');
  return {
    id: p.id,
    name: typeof p.name === 'string' ? p.name.trim() : p.name,
    type: p.type,
    status: p.status,
    tags: cleanTags(Array.isArray(p.tags) ? p.tags : []),
    address: cleanAddress(isObject(p.address) ? p.address : {}),
    favorite: p.favorite === true,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function validateVisit(v, label, problems) {
  const bad = (msg) => problems.push(`${label}: ${msg}`);
  if (!isObject(v)) { bad('formato inválido'); return {}; }
  if (!isNonEmptyString(v.id)) bad('sem ID');
  if (!isNonEmptyString(v.placeId)) bad('sem lugar');
  if (!isCalendarDate(v.date)) bad('data inválida');
  if (!Number.isInteger(v.rating) || v.rating < 1 || v.rating > 5) bad('nota inválida (inteiro de 1 a 5)');
  if (typeof v.wouldReturn !== 'boolean') bad('"voltaria" inválido');
  if (v.comment !== undefined && v.comment !== null && typeof v.comment !== 'string') bad('comentário inválido');
  if (!isTimestamp(v.createdAt) || !isTimestamp(v.updatedAt)) bad('datas de criação/atualização inválidas');
  const visit = {
    id: v.id, placeId: v.placeId, date: v.date, rating: v.rating, wouldReturn: v.wouldReturn,
    createdAt: v.createdAt, updatedAt: v.updatedAt,
  };
  if (typeof v.comment === 'string' && v.comment.trim()) visit.comment = v.comment;
  return visit;
}

function checkUnique(list, key, message, problems) {
  const seen = new Set();
  list.forEach((item, i) => {
    const k = key(item);
    if (k === undefined || k === '') return;
    if (seen.has(k)) problems.push(message(item, i));
    seen.add(k);
  });
}

function limitDetails(problems) {
  if (problems.length <= MAX_DETAILS) return problems;
  return [...problems.slice(0, MAX_DETAILS), `… e mais ${problems.length - MAX_DETAILS} problemas`];
}

/** Every visit must point to a place in `placeIds`, or nothing is imported. */
function checkVisitRefs(visits, placeIds) {
  const orphans = [];
  visits.forEach((v, i) => { if (!placeIds.has(v.placeId)) orphans.push(`Visita ${i + 1}: aponta para um lugar que não existe`); });
  if (orphans.length) throw new ImportError('O backup tem visitas sem lugar e não foi importado.', limitDetails(orphans));
}

/** A place with visits is "Já fui" (RN04). Returns the place to write, or null if unchanged. */
function promoteIfVisited(place, hasVisits, now) {
  if (!hasVisits || place.status === STATUS.BEEN_THERE) return null;
  return { ...place, status: STATUS.BEEN_THERE, updatedAt: now };
}

/**
 * "Substituir tudo": the app ends up with exactly the file's data. Pure.
 * Returns `{ places, visits, result }`.
 */
export function planReplace(backup) {
  checkVisitRefs(backup.visits, new Set(backup.places.map((p) => p.id)));
  return {
    places: backup.places,
    visits: backup.visits,
    result: {
      mode: IMPORT_MODE.REPLACE,
      places: { inserted: backup.places.length, updated: 0, unchanged: 0 },
      visits: { inserted: backup.visits.length, updated: 0, unchanged: 0 },
      skipped: [],
    },
  };
}

/**
 * "Mesclar" (RN11): matches by ID; on conflict the most recent `updatedAt` wins.
 * A file place whose name belongs to another place (different ID) isn't imported, nor are its
 * visits; it's listed in `result.skipped`. Pure: `existingPlaces`/`existingVisits` are the app data.
 * Returns `{ places, visits, result }` with only the records to write.
 */
export function planMerge(backup, existingPlaces, existingVisits, now = nowISO()) {
  const appById = new Map(existingPlaces.map((p) => [p.id, p]));
  const finalById = new Map(appById);
  const nameOwner = new Map(existingPlaces.map((p) => [nameKey(p.name), p.id]));
  const placeWrites = new Map();
  const skipped = [];
  const skippedIds = new Set();
  const counts = { places: { inserted: 0, updated: 0, unchanged: 0 }, visits: { inserted: 0, updated: 0, unchanged: 0 } };

  // Updates of existing IDs first, then new places, so names are checked against the final state.
  const ordered = [...backup.places].sort((a, b) => Number(appById.has(b.id)) - Number(appById.has(a.id)));
  for (const place of ordered) {
    const current = appById.get(place.id);
    if (current && time(place.updatedAt) <= time(current.updatedAt)) {
      counts.places.unchanged++;
      continue;
    }
    const owner = nameOwner.get(nameKey(place.name));
    if (owner !== undefined && owner !== place.id) {
      skipped.push({ name: place.name, visits: backup.visits.filter((v) => v.placeId === place.id).length });
      skippedIds.add(place.id);
      continue;
    }
    if (current) {
      nameOwner.delete(nameKey(current.name));
      counts.places.updated++;
    } else {
      counts.places.inserted++;
    }
    nameOwner.set(nameKey(place.name), place.id);
    finalById.set(place.id, place);
    placeWrites.set(place.id, place);
  }

  const fileVisits = backup.visits.filter((v) => !skippedIds.has(v.placeId));
  checkVisitRefs(fileVisits, new Set(finalById.keys()));

  const appVisits = new Map(existingVisits.map((v) => [v.id, v]));
  const visitWrites = [];
  for (const visit of fileVisits) {
    const current = appVisits.get(visit.id);
    if (current && time(visit.updatedAt) <= time(current.updatedAt)) {
      counts.visits.unchanged++;
      continue;
    }
    if (current) counts.visits.updated++;
    else counts.visits.inserted++;
    visitWrites.push(visit);
  }

  // Places that now have visits but are still "Quero ir" move to "Já fui" (RN04).
  const withVisits = new Set([...existingVisits, ...visitWrites].map((v) => v.placeId));
  for (const place of finalById.values()) {
    const promoted = promoteIfVisited(placeWrites.get(place.id) ?? place, withVisits.has(place.id), now);
    if (promoted) placeWrites.set(place.id, promoted);
  }

  return {
    places: [...placeWrites.values()],
    visits: visitWrites,
    result: { mode: IMPORT_MODE.MERGE, ...counts, skipped },
  };
}

/**
 * Imports a parsed backup (from `parseBackup`). `mode`: IMPORT_MODE.MERGE or IMPORT_MODE.REPLACE.
 * Everything is written in a single transaction: on any error nothing changes.
 * Resolves with the result (counts and skipped places).
 */
export async function importBackup(backup, mode) {
  let plan;
  if (mode === IMPORT_MODE.REPLACE) {
    plan = planReplace(backup);
  } else if (mode === IMPORT_MODE.MERGE) {
    const [places, visits] = await Promise.all([placesDb.list(), visitsDb.listAll()]);
    plan = planMerge(backup, places, visits);
  } else {
    throw new Error(`Unknown import mode: ${mode}`);
  }
  await bulkWrite({ places: plan.places, visits: plan.visits }, { clearFirst: mode === IMPORT_MODE.REPLACE });
  return plan.result;
}
