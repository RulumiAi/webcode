import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emailVerificationResendCooldownKey,
  readEmailVerificationResendCooldown,
  remainingEmailVerificationResendSeconds,
} from './emailVerificationCooldown';

function installStorage(values = new Map<string, string>()) {
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => { values.clear(); },
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: storage});
  return values;
}

test('uses an account-specific cooldown key', () => {
  assert.notEqual(emailVerificationResendCooldownKey('user-one'), emailVerificationResendCooldownKey('user-two'));
});

test('reads a future cooldown and clears expired or invalid values', () => {
  const values = installStorage();
  const key = emailVerificationResendCooldownKey('user-one');
  values.set(key, '1060000');
  assert.equal(readEmailVerificationResendCooldown('user-one', 1_000_000), 1_060_000);

  values.set(key, '1000000');
  assert.equal(readEmailVerificationResendCooldown('user-one', 1_000_000), 0);
  assert.equal(values.has(key), false);

  values.set(key, 'invalid');
  assert.equal(readEmailVerificationResendCooldown('user-one', 1_000_000), 0);
  assert.equal(values.has(key), false);
});

test('rounds countdown seconds up and never returns a negative value', () => {
  assert.equal(remainingEmailVerificationResendSeconds(1_060_000, 1_000_000), 60);
  assert.equal(remainingEmailVerificationResendSeconds(1_060_000, 1_000_001), 60);
  assert.equal(remainingEmailVerificationResendSeconds(1_060_000, 1_001_000), 59);
  assert.equal(remainingEmailVerificationResendSeconds(1_060_000, 1_060_000), 0);
});
