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

/** 1 → "1 visita", 3 → "3 visitas" */
export function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
