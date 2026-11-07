// Business rules for places. No DOM here; persistence goes through db/.
import * as placesDb from '../db/places.js';
import { ValidationError } from './errors.js';

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

  return { errors, value: { name, type, tags: cleanTags(data?.tags), address } };
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
