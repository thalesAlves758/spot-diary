// Business rules for visits. No DOM here; persistence goes through db/.
import * as placesDb from '../db/places.js';
import * as visitsDb from '../db/visits.js';
import { STATUS } from './places.js';
import { isCalendarDate, todayLocal } from './dates.js';
import { ValidationError, NotFoundError } from './errors.js';

export const COMMENT_MAX = 1000;

/**
 * Validates and normalizes a visit (RN05): date required, valid and not in the future;
 * integer rating from 1 to 5; "voltaria?" answered; comment optional.
 * Pure: `today` is the local `YYYY-MM-DD`. Returns `{ errors, value }`.
 */
export function validateVisit(data, { today = todayLocal() } = {}) {
  const errors = {};
  const date = String(data?.date ?? '').trim();
  const rating = typeof data?.rating === 'string' ? Number(data.rating) : data?.rating;
  const comment = String(data?.comment ?? '').trim();

  if (!date) errors.date = 'Informe a data';
  else if (!isCalendarDate(date)) errors.date = 'Data inválida';
  else if (date > today) errors.date = 'A data não pode ser no futuro';

  if (rating === undefined || rating === null || rating === '' || Number.isNaN(rating)) errors.rating = 'Escolha uma nota';
  else if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'A nota vai de 1 a 5';

  if (typeof data?.wouldReturn !== 'boolean') errors.wouldReturn = 'Responda se voltaria';

  if (comment.length > COMMENT_MAX) errors.comment = `Use no máximo ${COMMENT_MAX} caracteres`;

  const value = { date, rating, wouldReturn: data?.wouldReturn };
  if (comment) value.comment = comment;
  return { errors, value };
}

/** A visit and its place, or `null` if the visit doesn't exist. */
export async function getVisit(id) {
  const visit = await visitsDb.get(id);
  if (!visit) return null;
  return { visit, place: (await placesDb.get(visit.placeId)) ?? null };
}

/**
 * Updates a visit (RF05) with the same rules as recording it. The place's status never changes
 * here (RN04). The record is rebuilt from the valid fields, so clearing the comment removes it.
 * Throws `ValidationError` or `NotFoundError`. Resolves with the stored visit.
 */
export async function updateVisit(id, data) {
  const current = await visitsDb.get(id);
  if (!current) throw new NotFoundError('visit', id);
  const { errors, value } = validateVisit(data);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return visitsDb.save({ id, placeId: current.placeId, createdAt: current.createdAt, ...value });
}

/** Deletes one visit. The place stays as it is, even with no visits left (RN04). */
export function deleteVisit(id) {
  return visitsDb.remove(id);
}

/**
 * Records a visit (RF04). If the place is still "Quero ir", it moves to "Já fui" in the same
 * transaction (RN04): a failure saves neither. Throws `ValidationError` or `NotFoundError`.
 * Resolves with `{ visit, movedToBeenThere }`.
 */
export async function recordVisit(placeId, data) {
  const place = await placesDb.get(placeId);
  if (!place) throw new NotFoundError('place', placeId);
  const { errors, value } = validateVisit(data);
  if (Object.keys(errors).length) throw new ValidationError(errors);

  const promote = place.status === STATUS.WANT_TO_GO;
  const { visit } = await visitsDb.saveWithPlace(
    { ...value, placeId },
    promote ? { ...place, status: STATUS.BEEN_THERE } : null,
  );
  return { visit, movedToBeenThere: promote };
}
