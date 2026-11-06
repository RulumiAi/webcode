import type { ApiCacheTag } from './apiCachePolicy';

type PageSnapshot = {
  tags: Set<ApiCacheTag>;
  value: unknown;
};

const snapshots = new Map<string, PageSnapshot>();
let userId: string | null = null;

export function setPageDataCacheUser(nextUserId: string | null) {
  if (userId === nextUserId) return;
  userId = nextUserId;
  for (const key of snapshots.keys()) {
    if (key.startsWith('private:')) snapshots.delete(key);
  }
}

export function pageDataCacheKey(namespace: string, locale: string, query: string, isPrivate = true) {
  const scope = isPrivate ? `private:${userId || 'anonymous'}` : 'public';
  return `${scope}:${namespace}:${locale}:${query}`;
}

export function readPageDataSnapshot<T>(key: string): T | null {
  return (snapshots.get(key)?.value as T | undefined) || null;
}

export function writePageDataSnapshot<T>(key: string, value: T, tags: ApiCacheTag[]) {
  snapshots.set(key, { value, tags: new Set(tags) });
}

export function invalidatePageDataSnapshots(tags: ApiCacheTag[]) {
  if (tags.length === 0) return;
  for (const [key, snapshot] of snapshots) {
    if (tags.some((tag) => snapshot.tags.has(tag))) snapshots.delete(key);
  }
}

export function resetPageDataCacheForTests() {
  snapshots.clear();
  userId = null;
}
