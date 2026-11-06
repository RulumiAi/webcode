import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getApiRequestPolicy,
  invalidateApiCache,
  resetApiCacheForTests,
  runCachedApiRequest,
  setApiCacheUser,
} from './apiCache';
import { pageDataCacheKey, readPageDataSnapshot, writePageDataSnapshot } from './pageDataCache';

test.beforeEach(() => resetApiCacheForTests());

test('anonymous public requests omit credentials and deduplicate concurrent loads', async () => {
  setApiCacheUser(null);
  const policy = getApiRequestPolicy('/characters/?page=1', 'GET');
  let calls = 0;
  const load = async () => ({calls: ++calls});
  const options = {path: '/characters/?page=1', locale: 'en', policy, load};

  const [first, second] = await Promise.all([runCachedApiRequest(options), runCachedApiRequest(options)]);

  assert.equal(policy.credentials, 'omit');
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('anonymous public requests revalidate completed responses on every page entry', async () => {
  setApiCacheUser(null);
  const policy = getApiRequestPolicy('/characters/?page=1', 'GET');
  let calls = 0;
  const load = async () => ({calls: ++calls});

  await runCachedApiRequest({path: '/characters/?page=1', locale: 'en', policy, load});
  await runCachedApiRequest({path: '/characters/?page=1', locale: 'en', policy, load});

  assert.equal(policy.ttlMs, 0);
  assert.equal(calls, 2);
});

test('anonymous character details use public revalidation', () => {
  setApiCacheUser(null);
  const policy = getApiRequestPolicy('/characters/character-1/', 'GET');

  assert.equal(policy.mode, 'public');
  assert.equal(policy.credentials, 'omit');
  assert.equal(policy.ttlMs, 0);
});

test('discovery is public before and after session restoration', () => {
  const path = '/characters/discovery/?page=1&pageSize=24';
  const pending = getApiRequestPolicy(path, 'GET');
  setApiCacheUser('user-one');
  const authenticated = getApiRequestPolicy(path, 'GET');

  assert.equal(pending.mode, 'public');
  assert.equal(pending.credentials, 'omit');
  assert.equal(authenticated.mode, 'public');
  assert.equal(authenticated.credentials, 'omit');
  assert.equal(authenticated.ttlMs, 0);
});

test('discovery personalization is authenticated and never retained', () => {
  setApiCacheUser('user-one');
  const policy = getApiRequestPolicy('/characters/personalization/?id=character-1', 'GET');

  assert.equal(policy.mode, 'volatile');
  assert.equal(policy.credentials, 'include');
  assert.equal(policy.ttlMs, 0);
});

test('private cache is isolated by user and locale', async () => {
  let calls = 0;
  const load = async () => ++calls;
  setApiCacheUser('user-one');
  const firstPolicy = getApiRequestPolicy('/characters/', 'GET');
  await runCachedApiRequest({path: '/characters/', locale: 'en', policy: firstPolicy, load});
  await runCachedApiRequest({path: '/characters/', locale: 'zh-CN', policy: firstPolicy, load});
  setApiCacheUser('user-two');
  const secondPolicy = getApiRequestPolicy('/characters/', 'GET');
  await runCachedApiRequest({path: '/characters/', locale: 'en', policy: secondPolicy, load});

  assert.equal(firstPolicy.credentials, 'include');
  assert.equal(calls, 3);
});

test('tag invalidation removes matching private cache entries', async () => {
  setApiCacheUser('user-one');
  const policy = getApiRequestPolicy('/characters/', 'GET');
  let calls = 0;
  const load = async () => ++calls;
  const options = {path: '/characters/', locale: 'en', policy, load};
  await runCachedApiRequest(options);
  await runCachedApiRequest(options);
  invalidateApiCache(['characters']);
  await runCachedApiRequest(options);
  assert.equal(calls, 3);
});

test('tag invalidation does not reuse or recache an older private in-flight response', async () => {
  setApiCacheUser('user-one');
  const policy = getApiRequestPolicy('/characters/', 'GET');
  let resolveFirst!: (value: number) => void;
  let calls = 0;
  const first = runCachedApiRequest({
    path: '/characters/',
    locale: 'en',
    policy,
    load: () => {
      calls += 1;
      return new Promise<number>((resolve) => { resolveFirst = resolve; });
    },
  });

  invalidateApiCache(['characters']);
  const second = runCachedApiRequest({
    path: '/characters/',
    locale: 'en',
    policy,
    load: async () => {
      calls += 1;
      return 2;
    },
  });
  resolveFirst(1);

  assert.equal(await first, 1);
  assert.equal(await second, 2);
  assert.equal(await runCachedApiRequest({
    path: '/characters/',
    locale: 'en',
    policy,
    load: async () => ++calls,
  }), 3);
  assert.equal(calls, 3);
});

test('volatile and auth requests are not retained', () => {
  setApiCacheUser('user-one');
  assert.equal(getApiRequestPolicy('/generation/jobs/id/', 'GET').ttlMs, 0);
  assert.equal(getApiRequestPolicy('/auth/session/', 'GET').mode, 'network');
  assert.equal(getApiRequestPolicy('/characters/id/favorite/', 'PUT').mode, 'network');
});

test('page snapshots are user scoped and invalidated with API tags', () => {
  setApiCacheUser('user-one');
  const key = pageDataCacheKey('community', 'en', 'all');
  writePageDataSnapshot(key, {items: ['post-one']}, ['feed']);
  assert.deepEqual(readPageDataSnapshot(key), {items: ['post-one']});
  invalidateApiCache(['feed']);
  assert.equal(readPageDataSnapshot(key), null);

  writePageDataSnapshot(key, {items: ['post-two']}, ['feed']);
  setApiCacheUser('user-two');
  assert.equal(readPageDataSnapshot(key), null);
});
