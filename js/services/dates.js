// Calendar dates (`YYYY-MM-DD`). Pure.

/** `YYYY-MM-DD` that exists in the calendar (2026-02-30 doesn't). */
export function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Today as `YYYY-MM-DD` in the device's time zone.
 * Not `toISOString()`: that's UTC, and at night in Brazil it's already tomorrow.
 */
export function todayLocal(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
