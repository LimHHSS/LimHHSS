import { test } from 'node:test';
import assert from 'node:assert/strict';
import { range } from './prepare-graph.mjs';

test('range grows with the current month and keeps January 2026 as its start', () => {
  assert.equal(range('2026-09-10').width, 37);
  assert.equal(range('2026-10-10').width, 41);
  assert.equal(range('2026-12-10').width, 50);
  assert.equal(range('2027-01-10').start, '2025-12-28T00:00:00.000Z');
  assert.equal(range('2027-01-10').width, 55);
  assert.throws(() => range('2025-12-31'));
});
