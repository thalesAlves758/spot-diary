// Color theme preference (RF21, RN17). No DOM here; applying it is js/ui/theme.js.
import * as meta from '../db/meta.js';

export const THEMES = ['auto', 'light', 'dark'];
export const DEFAULT_THEME = 'auto';

const KEY = 'theme';

/** The value if it is a known theme, otherwise the default. */
export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : DEFAULT_THEME;
}

export async function getTheme() {
  return normalizeTheme(await meta.get(KEY));
}

export async function setTheme(value) {
  await meta.set(KEY, normalizeTheme(value));
}
