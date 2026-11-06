import assert from 'node:assert/strict';
import test from 'node:test';
import { hasDescriptionOverflow } from './ExpandableDescription';

test('only marks text as overflowing when it exceeds two rendered lines', () => {
  assert.equal(hasDescriptionOverflow(32, 32), false);
  assert.equal(hasDescriptionOverflow(33, 32), false);
  assert.equal(hasDescriptionOverflow(34, 32), true);
  assert.equal(hasDescriptionOverflow(64, 32), true);
});
