import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTheme, THEMES, DEFAULT_THEME } from './theme.js';

test('normalizeTheme keeps the three valid themes', () => {
  for (const theme of ['auto', 'light', 'dark']) assert.equal(normalizeTheme(theme), theme);
  assert.deepEqual(THEMES, ['auto', 'light', 'dark']);
});

test('normalizeTheme falls back to auto for anything else', () => {
  for (const value of [undefined, null, 'blue', 1, '', 'DARK']) assert.equal(normalizeTheme(value), DEFAULT_THEME);
  assert.equal(DEFAULT_THEME, 'auto');
});
