import assert from 'node:assert/strict';
import test from 'node:test';

import { api, ApiError } from './api';

const character = {
  id: 'character-1', name: 'Mira Rowan', age: 30, style: 'realistic', gender: 'female',
  relationship: 'friendship', relationshipDetail: '', heritage: '', complexion: '', hair: '',
  personality: [], interests: [], subtitle: '', backgroundStory: '', bio: '', scenario: '',
  voice: 'ara', tags: [], filterTags: [], systemPrompt: '', firstMessage: '', exampleDialogue: '',
  appearanceProfile: {}, creationSelections: {}, occupation: '', intimacyPreferences: [],
  advancedDetails: '', autoComplete: false, writingModel: '', contentLocale: 'en', image: null,
  gallery: [], designJob: null, generationPrompt: '', createdAt: '', updatedAt: '',
};

const body = {
  name: 'Mira Rowan', age: 30, style: 'realistic' as const, gender: 'female' as const,
  voiceId: 'ara', contentLocale: 'en', selections: {},
};

function installFetch(responses: Response[] | (() => Response | Promise<Response>)) {
  const originalFetch = globalThis.fetch;
  const calls: RequestInit[] = [];
  let index = 0;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(init || {});
    if (url.endsWith('/auth/csrf/')) return new Response(JSON.stringify({ csrfToken: 'csrf-test' }), { status: 200 });
    const response = typeof responses === 'function' ? await responses() : responses[Math.min(index++, responses.length - 1)];
    return response;
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = originalFetch; } };
}

test('wizard generation retries transient failures with one idempotency key', async () => {
  const fetchState = installFetch([
    new Response(JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'temporary' } }), { status: 503 }),
    new Response(JSON.stringify({ character, job: { id: 'job-1', status: 'queued', outputs: [] } }), { status: 201 }),
  ]);
  try {
    const result = await api.createdCharacters.wizardGenerate(body);
    assert.equal(result.character.id, 'character-1');
    const createCalls = fetchState.calls.filter((call) => call.method === 'POST');
    assert.equal(createCalls.length, 2);
    assert.equal(
      new Headers(createCalls[0].headers).get('Idempotency-Key'),
      new Headers(createCalls[1].headers).get('Idempotency-Key'),
    );
  } finally {
    fetchState.restore();
  }
});

test('wizard generation stops after bounded transient retries', async () => {
  const fetchState = installFetch(() => new Response(JSON.stringify({ error: { code: 'UPSTREAM_UNAVAILABLE' } }), { status: 503 }));
  try {
    await assert.rejects(
      api.createdCharacters.wizardGenerate(body),
      (reason: unknown) => reason instanceof ApiError && reason.code === 'UPSTREAM_UNAVAILABLE',
    );
    assert.equal(fetchState.calls.filter((call) => call.method === 'POST').length, 4);
  } finally {
    fetchState.restore();
  }
});

test('wizard generation does not retry non-transient validation failures', async () => {
  const fetchState = installFetch([new Response(JSON.stringify({ error: { code: 'NAME_TAKEN' } }), { status: 409 })]);
  try {
    await assert.rejects(
      api.createdCharacters.wizardGenerate(body),
      (reason: unknown) => reason instanceof ApiError && reason.code === 'NAME_TAKEN',
    );
    assert.equal(fetchState.calls.filter((call) => call.method === 'POST').length, 1);
  } finally {
    fetchState.restore();
  }
});

test('wizard generation propagates caller abort without retrying', async () => {
  const controller = new AbortController();
  const fetchState = installFetch(() => new Promise<Response>((_resolve, reject) => {
    const signal = (fetchState.calls.at(-1)?.signal) as AbortSignal | undefined;
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  try {
    const pending = api.createdCharacters.wizardGenerate(body, controller.signal);
    setTimeout(() => controller.abort(), 0);
    await assert.rejects(pending, (reason: unknown) => reason instanceof Error && reason.name === 'AbortError');
    assert.equal(fetchState.calls.filter((call) => call.method === 'POST').length, 1);
  } finally {
    fetchState.restore();
  }
});
