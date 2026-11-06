import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../api';
import { isNameTaken, isTransientNameCheckFailure } from './nameAvailability';

test('only an explicit NAME_TAKEN response blocks the next wizard step', () => {
  assert.equal(isNameTaken({ available: false, code: 'NAME_TAKEN' }), true);
  assert.equal(isNameTaken({ available: false }), false);
  assert.equal(isNameTaken({ available: true }), false);
});

test('name-check service failures do not block the wizard', () => {
  assert.equal(isTransientNameCheckFailure(new ApiError('BAD_REQUEST', '', 400)), true);
  assert.equal(isTransientNameCheckFailure(new ApiError('PERMISSION_DENIED', '', 403)), true);
  assert.equal(isTransientNameCheckFailure(new ApiError('NOT_FOUND', '', 404)), true);
  assert.equal(isTransientNameCheckFailure(new ApiError('VALIDATION_ERROR', '', 422)), true);
  assert.equal(isTransientNameCheckFailure(new ApiError('RATE_LIMITED', '', 429)), true);
  assert.equal(isTransientNameCheckFailure(new ApiError('UPSTREAM_UNAVAILABLE', '', 503)), true);
  assert.equal(isTransientNameCheckFailure(new TypeError('network unavailable')), true);
});

test('only authentication and explicit duplicate errors remain blocking', () => {
  assert.equal(isTransientNameCheckFailure(new ApiError('AUTH_REQUIRED', '', 401)), false);
  assert.equal(isTransientNameCheckFailure(new ApiError('NAME_TAKEN', '', 409)), false);
});
