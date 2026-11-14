// Display formatting (pt-BR). Values are stored in neutral formats; only the UI formats them.

import { ADDRESS_FIELDS, STATUS, placeTypeLabel } from '../services/places.js';

const averageFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 4.5 → "4,5" */
export function formatAverage(value) {
  return averageFormat.format(value);
}

/** "2026-11-01" → "01/11/2026" (parsed by hand: `new Date('2026-11-01')` is UTC and shifts the day). */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** ISO date-time → "07/11/2026" (calendar day in the device's time zone). */
export function formatLocalDate(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** ISO date-time → "07/11/2026 às 15:30", in the device's time zone. */
export function formatDateTime(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Address as display lines, only with the filled fields (no leftover separators):
 * `["Rua X, 123 - apto 2", "Savassi, Belo Horizonte - MG"]`; only city and state → `["Belo Horizonte - MG"]`.
 */
export function formatAddress(address = {}) {
  const join = (parts, sep) => parts.filter(Boolean).join(sep);
  const street = address.street ?? '';
  const number = address.number ? (street ? address.number : `Nº ${address.number}`) : '';
  const line1 = join([join([street, number], ', '), address.complement], ' - ');
  const line2 = join([address.neighborhood, join([address.city, address.state], ' - ')], ', ');
  return [line1, line2].filter(Boolean);
}

/** 1 → "1 visita", 3 → "3 visitas" */
export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** True when any address field has text beyond whitespace. */
export function hasAddress(address) {
  return ADDRESS_FIELDS.some((field) => String(address?.[field] ?? '').trim() !== '');
}

/** Google Maps search link for the place name plus its address (opened by the user, not fetched by the app). */
export function mapsSearchUrl(place) {
  const query = [place.name, ...formatAddress(place.address)].join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Text sent by "Compartilhar" (RN21): one piece of information per line, no empty lines. */
export function placeShareText(place, summary) {
  const lines = [`${place.name} (${placeTypeLabel(place.type)})`];
  if (place.status === STATUS.BEEN_THERE && summary?.visitCount > 0) {
    lines.push([
      `★ ${formatAverage(summary.average)}`,
      plural(summary.visitCount, 'visita', 'visitas'),
      summary.lastWouldReturn ? 'voltaria' : 'não voltaria',
    ].join(' · '));
  }
  if (hasAddress(place.address)) {
    lines.push(formatAddress(place.address).join(' · '), mapsSearchUrl(place));
  }
  return lines.join('\n');
}
