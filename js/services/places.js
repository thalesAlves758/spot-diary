// Business rules for places. No DOM here; persistence goes through db/.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import { ValidationError, NotFoundError } from './errors.js';
import { placeSummary, compareVisitsNewestFirst } from './summary.js';

/** Place types (RN02): stored `value`, displayed `label`, in display order. */
export const PLACE_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'pizzeria', label: 'Pizzaria' },
  { value: 'burger', label: 'Hamburgueria' },
  { value: 'cafe', label: 'Café' },
  { value: 'snack_bar', label: 'Lanchonete' },
  { value: 'nightclub', label: 'Balada' },
  { value: 'other', label: 'Outro' },
];

/** The 27 Brazilian state codes (UF). */
export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const ADDRESS_FIELDS = ['street', 'number', 'complement', 'neighborhood', 'city', 'state'];

export const STATUS = { WANT_TO_GO: 'want_to_go', BEEN_THERE: 'been_there' };

const NAME_MAX = 100;

export function placeTypeLabel(value) {
  return PLACE_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Key used to compare names (RN10): ignores case and surrounding spaces. */
export function nameKey(name) {
  return String(name ?? '').trim().toLowerCase();
}

/** Trims tags, drops empty ones and repeats (case-insensitive, keeps the first spelling). */
export function cleanTags(tags) {
  const seen = new Set();
  const result = [];
  for (const raw of tags ?? []) {
    const tag = String(raw ?? '').trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

/** Lowercase without accents, for loose matching ("Música" → "musica"). */
export function foldText(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** All distinct tags used by `places` (case-insensitive), alphabetically. Pure. */
export function uniqueTags(places) {
  return cleanTags(places.flatMap((p) => p.tags ?? []))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

/** Distinct tags of every saved place (RF11). */
export async function listTags() {
  return uniqueTags(await placesDb.list());
}

/**
 * Reuses the spelling of a tag that already exists (RN03): with "BH" saved, "bh" becomes "BH".
 * Returns the trimmed tag unchanged when it's new.
 */
export function normalizeTag(tag, existingTags = []) {
  const trimmed = String(tag ?? '').trim();
  const key = trimmed.toLowerCase();
  return existingTags.find((t) => t.toLowerCase() === key) ?? trimmed;
}

/**
 * Suggestions while typing (RF11): existing tags starting with `query`, ignoring case and accents,
 * minus the ones already on the place.
 */
export function suggestTags(query, existingTags = [], selected = [], limit = 6) {
  const q = foldText(query).trim();
  if (!q) return [];
  const taken = new Set(selected.map((t) => t.toLowerCase()));
  return existingTags
    .filter((t) => !taken.has(t.toLowerCase()) && foldText(t).startsWith(q))
    .slice(0, limit);
}

/** Keeps only the filled address fields, trimmed. */
export function cleanAddress(address) {
  const result = {};
  for (const field of ADDRESS_FIELDS) {
    const value = String(address?.[field] ?? '').trim();
    if (value) result[field] = value;
  }
  return result;
}

/**
 * Validates and normalizes the editable fields of a place (RN01, RN02, RN10).
 * Pure: `existing` is the list of places to check duplicates against; `ignoreId` skips the place
 * being edited. Returns `{ errors, value }`; `errors` is empty when the input is valid.
 */
export function validatePlace(data, existing = [], { ignoreId = null } = {}) {
  const errors = {};
  const name = String(data?.name ?? '').trim();
  const type = data?.type ?? '';
  const address = cleanAddress(data?.address);

  if (!name) errors.name = 'Informe o nome';
  else if (name.length > NAME_MAX) errors.name = `Use no máximo ${NAME_MAX} caracteres`;
  else if (existing.some((p) => p.id !== ignoreId && nameKey(p.name) === nameKey(name))) {
    errors.name = 'Nome já cadastrado';
  }

  if (!type) errors.type = 'Escolha o tipo';
  else if (!PLACE_TYPES.some((t) => t.value === type)) errors.type = 'Tipo inválido';

  if (address.state && !BRAZIL_STATES.includes(address.state)) errors.state = 'UF inválida';

  const existingTags = uniqueTags(existing);
  const tags = cleanTags((data?.tags ?? []).map((t) => normalizeTag(t, existingTags)));

  return { errors, value: { name, type, tags, address } };
}

/**
 * Creates a place (RF01): validates, then saves it as "Quero ir" and not favorite.
 * Resolves with the stored place; throws `ValidationError` if the input is invalid.
 */
export async function createPlace(data) {
  const existing = await placesDb.list();
  const { errors, value } = validatePlace(data, existing);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return placesDb.save({ ...value, status: STATUS.WANT_TO_GO, favorite: false });
}

/**
 * Everything the detail screen shows (RF06): the place, its summary and its visits newest first
 * (same date: last created first). `null` if the place doesn't exist.
 */
export async function getPlaceDetail(id) {
  const [place, visits] = await Promise.all([placesDb.get(id), visitsDb.listByPlace(id)]);
  if (!place) return null;
  return {
    place,
    summary: placeSummary(place, visits),
    visits: [...visits].sort(compareVisitsNewestFirst),
  };
}

/** A place by ID, or `null` if it doesn't exist (deleted, or a bad link). */
export async function getPlace(id) {
  return (await placesDb.get(id)) ?? null;
}

/**
 * Updates the editable fields of a place (RF02). Same rules as creation; the duplicate-name check
 * ignores the place itself. Status, favorite and `createdAt` are kept (status follows the visits,
 * RN04); `updatedAt` is refreshed. Throws `ValidationError`, or `NotFoundError` if it's gone.
 */
export async function updatePlace(id, data) {
  const existing = await placesDb.list();
  const place = existing.find((p) => p.id === id);
  if (!place) throw new NotFoundError('place', id);
  const { errors, value } = validatePlace(data, existing, { ignoreId: id });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return placesDb.save({ ...place, ...value });
}

/** How many visits a place has (shown before deleting it). */
export async function countVisits(placeId) {
  return (await visitsDb.listByPlace(placeId)).length;
}

/** Deletes a place and all of its visits in one transaction (RF03, RN06). Resolves with the visit count. */
export function deletePlace(id) {
  return placesDb.deleteWithVisits(id);
}
