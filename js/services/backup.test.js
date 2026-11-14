import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupFileName, backupShareFile } from './backup.js';

test('backupShareFile names the shared file as .json.txt, text/plain', () => {
  const date = new Date(2026, 10, 7, 22, 30);
  assert.deepEqual(backupShareFile(date), { name: 'diario-de-role-2026-11-07.json.txt', type: 'text/plain' });
});

test('backupShareFile reuses the downloaded file name rule (local day)', () => {
  const date = new Date(2026, 0, 3, 23, 59);
  assert.equal(backupShareFile(date).name, `${backupFileName(date)}.txt`);
  assert.equal(backupShareFile(date).name, 'diario-de-role-2026-01-03.json.txt');
});
