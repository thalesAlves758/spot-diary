// pickRandom: random draw among the visible places (RN22).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickRandom } from './lists.js';

const item = (id) => ({ place: { id }, summary: {} });
const [a, b, c] = [item('a'), item('b'), item('c')];

test('empty list returns null', () => {
  assert.equal(pickRandom([]), null);
});

test('one item is returned even when it is the excluded one', () => {
  assert.equal(pickRandom([a], { excludeId: 'a' }), a);
});

test('with 2+ items never returns excludeId', () => {
  for (const r of [0, 0.3, 0.5, 0.999]) {
    assert.notEqual(pickRandom([a, b, c], { excludeId: 'b', random: () => r }).place.id, 'b');
    assert.equal(pickRandom([a, b], { excludeId: 'a', random: () => r }), b);
  }
});

test('random 0 and 0.999 pick the first and the last', () => {
  assert.equal(pickRandom([a, b, c], { random: () => 0 }), a);
  assert.equal(pickRandom([a, b, c], { random: () => 0.999 }), c);
});
