// Display formatting (pt-BR). Values are stored in neutral formats; only the UI formats them.

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
