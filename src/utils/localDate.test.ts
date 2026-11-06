import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatLocalDate } from './localDate';

test('formats the local calendar date as YYYY-MM-DD', () => {
  const date = new Date(2026, 7, 11, 23, 59, 59);
  assert.equal(formatLocalDate(date), '2026-08-11');
});

test('pads single-digit month and day values', () => {
  const date = new Date(2026, 0, 3);
  assert.equal(formatLocalDate(date), '2026-01-03');
});
