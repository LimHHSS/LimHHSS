import { test } from 'node:test';
import assert from 'node:assert/strict';
import { range } from './prepare-graph.mjs';

test('range grows with the current month and keeps April 2026 as its start', () => {
  assert.equal(range('2026-09-10').width, 24);
  assert.equal(range('2026-10-10').width, 28);
  assert.equal(range('2026-12-10').width, 37);
  assert.equal(range('2027-01-10').start, '2026-03-29T00:00:00.000Z');
  assert.equal(range('2027-01-10').width, 42);
  assert.throws(() => range('2026-03-31'));
});
