import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const modal = fs.readFileSync(path.join(import.meta.dirname, 'UserProfileModal.tsx'), 'utf8');
const app = fs.readFileSync(path.join(import.meta.dirname, '..', 'App.tsx'), 'utf8');

test('email verification resend disables during its persisted cooldown', () => {
  assert.match(modal, /EMAIL_VERIFICATION_RESEND_COOLDOWN_MS/);
  assert.match(modal, /localStorage\.setItem\(emailVerificationResendCooldownKey\(user\.id\), String\(availableAt\)\)/);
  assert.match(modal, /window\.addEventListener\('storage', handleStorage\)/);
  assert.match(modal, /window\.setInterval\(updateClock, 1000\)/);
  assert.match(modal, /disabled=\{resendingVerification \|\| resendCooldownSeconds > 0\}/);
  assert.match(modal, /t\('profile\.resendVerificationCountdown', \{seconds: resendCooldownSeconds\}\)/);
});

test('profile header displays the latest localized diamond balance', () => {
  assert.match(modal, /walletBalance\?: number/);
  assert.match(modal, /Gem className=/);
  assert.match(modal, /walletBalance === undefined \? '…' : new Intl\.NumberFormat\(locale\)\.format\(walletBalance\)/);
  assert.match(modal, /t\('profile\.diamondBalance', \{ count: formattedWalletBalance \}\)/);
  assert.match(modal, /role="status"/);
  assert.match(app, /walletBalance=\{paymentAccount\?\.wallet\.balance\}/);
  assert.match(app, /const handleOpenProfile = \(\) => \{[\s\S]*?api\.payments\.account\(\)[\s\S]*?currentUserRef\.current\?\.id !== userId[\s\S]*?handlePaymentAccountChange\(account\)[\s\S]*?\.catch\(\(\) => undefined\)/);
});
