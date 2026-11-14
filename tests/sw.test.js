// Service worker rules: single app version (RN19) and a complete ASSETS list (offline mode).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

const swSource = read('sw.js');

function assetsFromSw() {
  const block = swSource.match(/const ASSETS = \[([\s\S]*?)\];/);
  assert.ok(block, 'sw.js must declare `const ASSETS = [ ... ];`');
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function listFiles(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

test('js/version.js defines self.APP_VERSION as MAJOR.MINOR.PATCH', () => {
  const context = { self: {} };
  vm.runInNewContext(read('js/version.js'), context);
  assert.match(context.self.APP_VERSION, /^\d+\.\d+\.\d+$/);
});

test('sw.js loads js/version.js and derives CACHE_VERSION from it', () => {
  assert.match(swSource, /importScripts\(\s*['"]js\/version\.js['"]\s*\)/);
  assert.match(swSource, /const CACHE_VERSION = CACHE_PREFIX \+ self\.APP_VERSION;/);
  assert.match(swSource, /const CACHE_PREFIX = 'diario-';/);
  assert.doesNotMatch(swSource, /['"`]diario-v?\d[^'"`]*['"`]/, 'no hand-written cache version');
});

test('every app file in js/, css/ and icons/ is in ASSETS', () => {
  const assets = new Set(assetsFromSw());
  const files = ['js', 'css', 'icons']
    .flatMap(listFiles)
    .map((path) => path.split(sep).join('/'))
    .filter((path) => !path.endsWith('.test.js'));
  const missing = files.filter((path) => !assets.has(path));
  assert.deepEqual(missing, [], `missing from ASSETS in sw.js: ${missing.join(', ')}`);
});

test('every ASSETS entry exists on disk', () => {
  const missing = assetsFromSw().filter((path) => path !== './' && !existsSync(join(ROOT, path)));
  assert.deepEqual(missing, [], `ASSETS entries not found: ${missing.join(', ')}`);
});

test('ASSETS has no test files and no duplicates', () => {
  const assets = assetsFromSw();
  assert.deepEqual(assets.filter((path) => path.endsWith('.test.js')), []);
  assert.equal(new Set(assets).size, assets.length);
});
