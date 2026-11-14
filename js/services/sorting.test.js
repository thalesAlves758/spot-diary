// sortItems: places without visits go last (RN14) and tie-breaks (RN15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortItems } from './sorting.js';

function item(name, { createdAt = '2026-01-01T00:00:00.000Z', lastVisit = null, visitCount = 0, average = null } = {}) {
  return { place: { name, createdAt }, summary: { lastVisit, visitCount, average } };
}

const names = (items) => items.map((i) => i.place.name);

const noVisitsOld = item('Sem visita antigo', { createdAt: '2026-01-01T00:00:00.000Z' });
const noVisitsNew = item('Sem visita novo', { createdAt: '2026-03-01T00:00:00.000Z' });
const visitedA = item('Bar A', { lastVisit: '2026-05-01', visitCount: 1, average: 4 });
const visitedB = item('Bar B', { lastVisit: '2026-06-01', visitCount: 3, average: 4.5 });

test('RN14: places without visits go last in every visit-based order, newest added first', () => {
  const items = [noVisitsOld, visitedA, noVisitsNew, visitedB];
  for (const key of ['last_visit_desc', 'last_visit_asc', 'rating_desc', 'visits_desc']) {
    const sorted = names(sortItems(items, key));
    assert.deepEqual(sorted.slice(2), ['Sem visita novo', 'Sem visita antigo'], key);
  }
});

test('RN14: "last visit oldest" still keeps places without visits at the end', () => {
  assert.deepEqual(
    names(sortItems([noVisitsNew, visitedB, visitedA], 'last_visit_asc')),
    ['Bar A', 'Bar B', 'Sem visita novo'],
  );
});

test('RN15: same last visit date breaks the tie by name', () => {
  const zeta = item('Zeta', { lastVisit: '2026-05-01', visitCount: 1, createdAt: '2026-04-01T00:00:00.000Z' });
  const alfa = item('Alfa', { lastVisit: '2026-05-01', visitCount: 1, createdAt: '2026-01-01T00:00:00.000Z' });
  assert.deepEqual(names(sortItems([zeta, alfa], 'last_visit_desc')), ['Alfa', 'Zeta']);
  assert.deepEqual(names(sortItems([zeta, alfa], 'last_visit_asc')), ['Alfa', 'Zeta']);
});

test('RN15: same rating or visit count breaks the tie by most recent visit, then by name', () => {
  const older = item('Antigo', { lastVisit: '2026-02-01', visitCount: 2, average: 4 });
  const newer = item('Recente', { lastVisit: '2026-07-01', visitCount: 2, average: 4 });
  const sameDayB = item('Bê', { lastVisit: '2026-07-01', visitCount: 2, average: 4 });
  for (const key of ['rating_desc', 'visits_desc']) {
    assert.deepEqual(names(sortItems([older, sameDayB, newer], key)), ['Bê', 'Recente', 'Antigo'], key);
  }
});

test('RN15: higher rating and more visits come first', () => {
  assert.deepEqual(names(sortItems([visitedA, visitedB], 'rating_desc')), ['Bar B', 'Bar A']);
  assert.deepEqual(names(sortItems([visitedA, visitedB], 'visits_desc')), ['Bar B', 'Bar A']);
});

test('RN15: same added date breaks the tie by name', () => {
  const at = '2026-02-02T10:00:00.000Z';
  const b = item('Bravo', { createdAt: at });
  const a = item('Alfa', { createdAt: at });
  assert.deepEqual(names(sortItems([b, a], 'created_desc')), ['Alfa', 'Bravo']);
  assert.deepEqual(names(sortItems([b, a], 'created_asc')), ['Alfa', 'Bravo']);
});

test('RN15: A–Z ignores case and accents, and same name goes to the most recently added', () => {
  const sorted = sortItems([
    item('bar', { createdAt: '2026-01-01T00:00:00.000Z' }),
    item('Árvore'),
    item('Bar', { createdAt: '2026-05-01T00:00:00.000Z' }),
    item('Arvore B'),
    item('cozinha'),
  ], 'name_asc');
  assert.deepEqual(names(sorted), ['Árvore', 'Arvore B', 'Bar', 'bar', 'cozinha']);
});

test('sortItems returns a copy and falls back to "created_desc" for unknown codes', () => {
  const items = [noVisitsOld, noVisitsNew];
  const sorted = sortItems(items, 'nope');
  assert.notEqual(sorted, items);
  assert.deepEqual(names(items), ['Sem visita antigo', 'Sem visita novo']);
  assert.deepEqual(names(sorted), ['Sem visita novo', 'Sem visita antigo']);
});
