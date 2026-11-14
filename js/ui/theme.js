// Applies the color theme to the page (RF21). The source of truth is `meta.theme`;
// localStorage only keeps a copy so the inline script in index.html can paint the right theme
// before the database opens.
import { getTheme } from '../services/theme.js';

const STORAGE_KEY = 'diario-theme';
const BAR_LIGHT = '#c2410c';
const BAR_DARK = '#1c1917';

const darkQuery = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);
let current = 'auto';

function updateThemeColor() {
  const dark = current === 'dark' || (current === 'auto' && darkQuery()?.matches === true);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR_DARK : BAR_LIGHT);
}

/** `theme` is 'auto', 'light' or 'dark'. */
export function applyTheme(theme) {
  current = theme === 'light' || theme === 'dark' ? theme : 'auto';
  const root = document.documentElement;
  if (current === 'auto') delete root.dataset.theme;
  else root.dataset.theme = current;
  try {
    localStorage.setItem(STORAGE_KEY, current);
  } catch { /* storage can be blocked; the copy is only an optimization */ }
  updateThemeColor();
}

/** Call after the database is open. */
export async function initTheme() {
  applyTheme(await getTheme());
  darkQuery()?.addEventListener('change', updateThemeColor);
}
