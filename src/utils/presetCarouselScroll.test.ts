import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPresetScrollPositions,
  getPresetScrollPosition,
  updatePresetScrollPosition,
} from './presetCarouselScroll';

test('starts every preset tab at the beginning', () => {
  const positions = createPresetScrollPositions();

  assert.deepEqual(positions, { pose: 0, outfit: 0, scene: 0 });
});

test('stores pose position without changing outfit or scene', () => {
  const positions = updatePresetScrollPosition(
    createPresetScrollPositions(),
    'pose',
    240,
  );

  assert.equal(getPresetScrollPosition(positions, 'pose'), 240);
  assert.equal(getPresetScrollPosition(positions, 'outfit'), 0);
  assert.equal(getPresetScrollPosition(positions, 'scene'), 0);
});

test('restores each tab position independently', () => {
  let positions = createPresetScrollPositions();
  positions = updatePresetScrollPosition(positions, 'pose', 120);
  positions = updatePresetScrollPosition(positions, 'outfit', 360);
  positions = updatePresetScrollPosition(positions, 'scene', 80);

  assert.equal(getPresetScrollPosition(positions, 'pose'), 120);
  assert.equal(getPresetScrollPosition(positions, 'outfit'), 360);
  assert.equal(getPresetScrollPosition(positions, 'scene'), 80);
});

test('normalizes invalid scroll positions to zero', () => {
  const initial = createPresetScrollPositions();
  const negative = updatePresetScrollPosition(initial, 'pose', -20);
  const invalid = updatePresetScrollPosition(negative, 'outfit', Number.NaN);

  assert.equal(getPresetScrollPosition(invalid, 'pose'), 0);
  assert.equal(getPresetScrollPosition(invalid, 'outfit'), 0);
});
