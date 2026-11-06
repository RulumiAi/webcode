import assert from 'node:assert/strict';
import test from 'node:test';
import { api, loadCsrf } from './api';

const thread = {
  id: 'thread-1',
  character: { id: 'character-1', name: 'Test', imageUrl: null, source: 'api' },
  voice: { voiceId: 'voice-1', name: 'Voice' },
  lastMessage: null,
};

test('refreshes CSRF token and retries a failed first write once', async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; csrf: string | null }> = [];
  let csrfRequestCount = 0;
  let createRequestCount = 0;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const csrf = new Headers(init?.headers).get('X-CSRFToken');
    calls.push({ url, csrf });
    if (url.endsWith('/auth/csrf/')) {
      csrfRequestCount += 1;
      return new Response(JSON.stringify({ csrfToken: `csrf-${csrfRequestCount}` }), { status: 200 });
    }
    if (url.endsWith('/chat/threads/')) {
      createRequestCount += 1;
      if (createRequestCount === 1) return new Response(JSON.stringify({ code: 'CSRF_FAILED', message: 'expired' }), { status: 403 });
      return new Response(JSON.stringify(thread), { status: 201 });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  try {
    const result = await api.chat.threads.create('character-1');
    assert.equal(result.id, 'thread-1');
    assert.equal(createRequestCount, 2);
    assert.equal(csrfRequestCount, 2);
    assert.deepEqual(calls.filter((call) => call.url.endsWith('/chat/threads/')).map((call) => call.csrf), ['csrf-1', 'csrf-2']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('concurrent forced CSRF refreshes share one request', async () => {
  const originalFetch = globalThis.fetch;
  let csrfRequestCount = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (!url.endsWith('/auth/csrf/')) throw new Error(`Unexpected request: ${url}`);
    csrfRequestCount += 1;
    return new Response(JSON.stringify({ csrfToken: 'csrf-concurrent' }), { status: 200 });
  }) as typeof fetch;
  try {
    const tokens = await Promise.all([loadCsrf(true), loadCsrf()]);
    assert.deepEqual(tokens, ['csrf-concurrent', 'csrf-concurrent']);
    assert.equal(csrfRequestCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('authentication success invalidates the previous CSRF token', async () => {
  const originalFetch = globalThis.fetch;
  let csrfRequestCount = 0;
  const csrfHeaders: Array<string | null> = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/auth/csrf/')) {
      csrfRequestCount += 1;
      return new Response(JSON.stringify({ csrfToken: `csrf-auth-${csrfRequestCount}` }), { status: 200 });
    }
    if (url.endsWith('/auth/login/')) return new Response(JSON.stringify({ user: { id: 'user-1', displayName: 'User', handle: 'user', email: 'user@example.com' } }), { status: 200 });
    if (url.endsWith('/chat/threads/')) {
      csrfHeaders.push(new Headers(init?.headers).get('X-CSRFToken'));
      return new Response(JSON.stringify(thread), { status: 201 });
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  try {
    await api.auth.login('user@example.com', 'password');
    await api.chat.threads.create('character-1');
    assert.equal(csrfRequestCount, 1);
    assert.deepEqual(csrfHeaders, ['csrf-auth-1']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
