export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

export function emailVerificationResendCooldownKey(userId: string) {
  return `soulmingle:email-verification-resend:${userId}`;
}

export function remainingEmailVerificationResendSeconds(availableAt: number, now = Date.now()) {
  return Math.max(0, Math.ceil((availableAt - now) / 1000));
}

export function readEmailVerificationResendCooldown(userId: string, now = Date.now()) {
  if (typeof localStorage === 'undefined') return 0;
  const key = emailVerificationResendCooldownKey(userId);
  const availableAt = Number(localStorage.getItem(key));
  if (!Number.isFinite(availableAt) || availableAt <= now) {
    localStorage.removeItem(key);
    return 0;
  }
  return availableAt;
}
