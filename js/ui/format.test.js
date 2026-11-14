// hasAddress, mapsSearchUrl and placeShareText (CARD-032).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAddress, mapsSearchUrl, placeShareText } from './format.js';

const address = { street: 'Rua X', number: '12', neighborhood: 'Savassi', city: 'Belo Horizonte', state: 'MG' };
const bar = { name: 'Bar do Zé', type: 'bar', status: 'been_there', address };

test('hasAddress: empty, whitespace only and filled', () => {
  assert.equal(hasAddress(undefined), false);
  assert.equal(hasAddress({}), false);
  assert.equal(hasAddress({ street: '   ', city: '' }), false);
  assert.equal(hasAddress({ city: 'BH' }), true);
});

test('mapsSearchUrl: name plus address lines, encoded', () => {
  assert.equal(
    mapsSearchUrl(bar),
    'https://www.google.com/maps/search/?api=1&query='
      + encodeURIComponent('Bar do Zé, Rua X, 12, Savassi, Belo Horizonte - MG'),
  );
  assert.equal(
    mapsSearchUrl({ name: 'A', address: {} }),
    'https://www.google.com/maps/search/?api=1&query=A',
  );
  const url = mapsSearchUrl({ name: 'Café & Cia', address: { city: 'São Paulo' } });
  assert.ok(url.includes('Caf%C3%A9%20%26%20Cia'));
  assert.ok(!url.includes('&Cia'));
});

test('placeShareText: visited place with visits, would return', () => {
  const text = placeShareText(bar, { visitCount: 3, average: 4.5, lastWouldReturn: true });
  assert.equal(text, [
    'Bar do Zé (Bar)',
    '★ 4,5 · 3 visitas · voltaria',
    'Rua X, 12 · Savassi, Belo Horizonte - MG',
    mapsSearchUrl(bar),
  ].join('\n'));
});

test('placeShareText: would not return, singular visit', () => {
  const text = placeShareText(bar, { visitCount: 1, average: 3, lastWouldReturn: false });
  assert.equal(text.split('\n')[1], '★ 3,0 · 1 visita · não voltaria');
});

test('placeShareText: been there without visits skips the rating line', () => {
  const text = placeShareText(bar, { visitCount: 0, average: null, lastWouldReturn: null });
  assert.equal(text.split('\n').length, 3);
  assert.ok(!text.includes('★'));
});

test('placeShareText: want to go without address has only name and type', () => {
  const text = placeShareText({ name: 'Pizza Nova', type: 'pizzeria', status: 'want_to_go', address: {} },
    { visitCount: 0, average: null, lastWouldReturn: null });
  assert.equal(text, 'Pizza Nova (Pizzaria)');
});

test('placeShareText: never has empty lines', () => {
  for (const a of [{}, address]) {
    const text = placeShareText({ ...bar, address: a }, { visitCount: 2, average: 4, lastWouldReturn: true });
    assert.ok(text.split('\n').every((line) => line.trim() !== ''));
  }
});
