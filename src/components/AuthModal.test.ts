import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const modal = fs.readFileSync(path.join(import.meta.dirname, 'AuthModal.tsx'), 'utf8');

test('auth mode switch opens the email step for the selected flow', () => {
  const switchIntent = modal.match(/const switchIntent = \(next: AuthIntent\) => \{[\s\S]*?\n  \};/)?.[0] || '';

  assert.match(switchIntent, /setIntent\(next\);/);
  assert.match(switchIntent, /setStep\('email'\);/);
  assert.doesNotMatch(switchIntent, /setStep\('methods'\);/);
  assert.match(modal, /const user = intent === 'login'\s*\n\s*\? await api\.auth\.login\(/);
  assert.match(modal, /: await api\.auth\.register\(/);
});
