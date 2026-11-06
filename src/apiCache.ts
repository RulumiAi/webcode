import {
  apiRequestPolicy,
  mutationTagsForPath,
  type ApiCacheTag,
  type ApiRequestPolicy,
} from './apiCachePolicy';
import { invalidatePageDataSnapshots, setPageDataCacheUser } from './pageDataCache';

type CacheEntry = {
  expiresAt: number;
  tags: Set<ApiCacheTag>;
  value: unknown;
};

type InFlightEntry = {
  promise: Promise<unknown>;
  tags: Set<ApiCacheTag>;
};

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, InFlightEntry>();
let authenticatedUserId: string | null | undefined;
let cacheGeneration = 0;

function removePrivateEntries() {
  for (const key of memoryCache.keys()) {
    if (key.startsWith('private:')) memoryCache.delete(key);
  }
  for (const key of inFlight.keys()) {
    if (key.startsWith('private:')) inFlight.delete(key);
  }
}

export function setApiCacheUser(userId: string | null) {
  if (authenticatedUserId !== userId) {
    cacheGeneration += 1;
    removePrivateEntries();
  }
  authenticatedUserId = userId;
  setPageDataCacheUser(userId);
}

export function getApiCacheUser() {
  return authenticatedUserId;
}

export function getApiRequestPolicy(path: string, method: string) {
  return apiRequestPolicy(path, method, authenticatedUserId);
}

function cacheKey(path: string, locale: string, policy: ApiRequestPolicy) {
  const scope = policy.mode === 'public'
    ? 'public'
    : `private:${authenticatedUserId === undefined ? 'pending' : authenticatedUserId || 'anonymous'}`;
  return `${scope}:${locale}:${path}`;
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function waitForCaller<T>(promise: Promise<T>, signal?: AbortSignal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener('abort', abort, {once: true});
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export function runCachedApiRequest<T>(options: {
  path: string;
  locale: string;
  policy: ApiRequestPolicy;
  signal?: AbortSignal;
  load: () => Promise<T>;
}) {
  const {path, locale, policy, signal, load} = options;
  const key = cacheKey(path, locale, policy);
  const cached = memoryCache.get(key);
  if (policy.ttlMs > 0 && cached && cached.expiresAt > Date.now()) {
    return waitForCaller(Promise.resolve(cached.value as T), signal);
  }

  let shared = inFlight.get(key)?.promise as Promise<T> | undefined;
  if (!shared) {
    const requestGeneration = cacheGeneration;
    shared = load().then((value) => {
      if (policy.ttlMs > 0 && requestGeneration === cacheGeneration) {
        memoryCache.set(key, {
          expiresAt: Date.now() + policy.ttlMs,
          tags: new Set(policy.tags),
          value,
        });
      }
      return value;
    }).finally(() => {
      if (inFlight.get(key)?.promise === shared) inFlight.delete(key);
    });
    inFlight.set(key, {promise: shared, tags: new Set(policy.tags)});
  }
  return waitForCaller(shared, signal);
}

export function invalidateApiCache(tags: ApiCacheTag[]) {
  if (tags.length === 0) return;
  cacheGeneration += 1;
  for (const [key, entry] of memoryCache) {
    if (tags.some((tag) => entry.tags.has(tag))) memoryCache.delete(key);
  }
  for (const [key, entry] of inFlight) {
    if (tags.some((tag) => entry.tags.has(tag))) inFlight.delete(key);
  }
  invalidatePageDataSnapshots(tags);
}

export function invalidateApiCacheForMutation(path: string) {
  invalidateApiCache(mutationTagsForPath(path));
}

export function resetApiCacheForTests() {
  memoryCache.clear();
  inFlight.clear();
  authenticatedUserId = undefined;
  cacheGeneration = 0;
  setPageDataCacheUser(null);
}
