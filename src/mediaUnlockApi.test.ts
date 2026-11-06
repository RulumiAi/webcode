import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from './api';

test('media unlock uses the env1 character endpoint with an idempotency key', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/csrf/')) {
      return new Response(JSON.stringify({ csrfToken: 'media-csrf' }), { status: 200 });
    }
    if (url.includes('/characters/character-id/media/media-id/unlock/')) {
      return new Response(JSON.stringify({
        mediaId: 'media-id', unlocked: true, charged: 10, walletBalance: 90,
      }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  try {
    const result = await api.characters.unlockMedia('character-id', 'media-id');
    assert.equal(result.walletBalance, 90);
    const unlock = calls.find((call) => call.url.includes('/characters/character-id/media/media-id/unlock/'));
    assert.equal(unlock?.init?.method, 'POST');
    assert.equal(unlock?.init?.credentials, 'include');
    assert.match(String(new Headers(unlock?.init?.headers).get('Idempotency-Key')), /^[0-9a-f-]{36}$/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
