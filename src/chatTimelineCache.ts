import type { ApiChatThread, ApiGenerationJob } from './api';
import type { ChatMessage } from './types';

export type ChatTimelineSnapshot = {
  threadId: string;
  messages: ChatMessage[];
  imageJobs: ApiGenerationJob[];
  savedAt: number;
};

type StoredRecord = {
  key: string;
  kind: 'threads' | 'timeline';
  userId: string;
  threadId?: string;
  savedAt: number;
  value: ApiChatThread[] | ChatTimelineSnapshot;
};

const DATABASE_NAME = 'soulmingle-chat-cache';
const DATABASE_VERSION = 2;
const STORE_NAME = 'snapshots';
const SCHEMA_VERSION = 2;
export const CHAT_CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_TIMELINE_SNAPSHOTS_PER_USER = 20;
const MAX_BACKGROUND_LOADS = 40;

const memoryRecords = new Map<string, StoredRecord>();
const backgroundLoads = new Map<string, Promise<boolean>>();
let databasePromise: Promise<IDBDatabase | null> | null = null;

function recordKey(userId: string, kind: StoredRecord['kind'], threadId?: string) {
  return `${SCHEMA_VERSION}:${userId}:${kind}:${threadId || 'all'}`;
}

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null);
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase | null>((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      } else {
        request.transaction?.objectStore(STORE_NAME).clear();
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  }).catch(() => null);
  return databasePromise;
}

function isTimelineSnapshot(value: unknown): value is ChatTimelineSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ChatTimelineSnapshot>;
  return typeof candidate.threadId === 'string'
    && Array.isArray(candidate.messages)
    && Array.isArray(candidate.imageJobs)
    && typeof candidate.savedAt === 'number';
}

function isThreadList(value: unknown): value is ApiChatThread[] {
  return Array.isArray(value) && value.every((thread) => Boolean(thread && typeof thread.id === 'string'));
}

function isExpired(record: StoredRecord) {
  return Date.now() - record.savedAt > CHAT_CACHE_MAX_AGE_MS;
}

async function readRecord(key: string): Promise<StoredRecord | null> {
  const memory = memoryRecords.get(key);
  if (memory) {
    if (!isExpired(memory)) return memory;
    await deleteRecord(key);
    return null;
  }
  const database = await openDatabase();
  if (!database) return null;
  return new Promise((resolve) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => {
      const record = request.result as StoredRecord | undefined;
      if (record && isExpired(record)) {
        void deleteRecord(key);
        resolve(null);
        return;
      }
      if (record) memoryRecords.set(key, record);
      resolve(record || null);
    };
    request.onerror = () => resolve(null);
  });
}

async function writeRecord(record: StoredRecord) {
  memoryRecords.set(record.key, record);
  const database = await openDatabase();
  if (database) {
    await new Promise<void>((resolve) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }
  await pruneUserRecords(record.userId);
}

async function pruneUserRecords(userId: string) {
  const prefix = `${SCHEMA_VERSION}:${userId}:`;
  const records = new Map([...memoryRecords.values()]
    .filter((record) => record.key.startsWith(prefix))
    .map((record) => [record.key, record]));
  const database = await openDatabase();
  if (database) {
    const stored = await new Promise<StoredRecord[]>((resolve) => {
      const collected: StoredRecord[] = [];
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).openCursor();
      request.onsuccess = () => {
        const cursor = request.result as IDBCursorWithValue | null;
        if (!cursor) return resolve(collected);
        const value = cursor.value as StoredRecord;
        if (value.key.startsWith(prefix)) collected.push(value);
        cursor.continue();
      };
      request.onerror = () => resolve(collected);
    });
    stored.forEach((record) => records.set(record.key, record));
  }
  const values = [...records.values()];
  const timelines = values
    .filter((record) => record.key.startsWith(prefix) && record.kind === 'timeline')
    .sort((left, right) => right.savedAt - left.savedAt);
  const expired = values.filter(isExpired);
  await Promise.all([
    ...expired.map((record) => deleteRecord(record.key)),
    ...timelines.slice(MAX_TIMELINE_SNAPSHOTS_PER_USER).map((record) => deleteRecord(record.key)),
  ]);
}

async function deleteRecord(key: string) {
  memoryRecords.delete(key);
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
}

export async function readCachedThreads(userId: string): Promise<ApiChatThread[] | null> {
  if (!userId) return null;
  const record = await readRecord(recordKey(userId, 'threads'));
  return record && record.kind === 'threads' && isThreadList(record.value) ? record.value : null;
}

export async function writeCachedThreads(userId: string, threads: ApiChatThread[]) {
  if (!userId) return;
  await writeRecord({
    key: recordKey(userId, 'threads'),
    kind: 'threads',
    userId,
    savedAt: Date.now(),
    value: threads,
  });
}

export async function readCachedTimeline(userId: string, threadId: string): Promise<ChatTimelineSnapshot | null> {
  if (!userId || !threadId) return null;
  const record = await readRecord(recordKey(userId, 'timeline', threadId));
  return record && record.kind === 'timeline' && isTimelineSnapshot(record.value) ? record.value : null;
}

export async function writeCachedTimeline(
  userId: string,
  threadId: string,
  messages: ChatMessage[],
  imageJobs: ApiGenerationJob[],
) {
  if (!userId || !threadId) return;
  const snapshot: ChatTimelineSnapshot = { threadId, messages, imageJobs, savedAt: Date.now() };
  await writeRecord({
    key: recordKey(userId, 'timeline', threadId),
    kind: 'timeline',
    userId,
    threadId,
    savedAt: snapshot.savedAt,
    value: snapshot,
  });
}

export async function removeCachedTimeline(userId: string, threadId: string) {
  if (!userId || !threadId) return;
  await deleteRecord(recordKey(userId, 'timeline', threadId));
}

export async function clearChatCache(userId: string) {
  if (!userId) return;
  const prefix = `${SCHEMA_VERSION}:${userId}:`;
  for (const key of backgroundLoads.keys()) {
    if (key.startsWith(`${userId}:`)) backgroundLoads.delete(key);
  }
  const keys = [...memoryRecords.keys()].filter((key) => key.startsWith(prefix));
  await Promise.all(keys.map((key) => deleteRecord(key)));
  const database = await openDatabase();
  if (!database) return;
  await new Promise<void>((resolve) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).openCursor();
    request.onsuccess = () => {
      const cursor = request.result as IDBCursorWithValue | null;
      if (!cursor) {
        resolve();
        return;
      }
      const record = cursor.value as StoredRecord;
      if (record.key.startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    request.onerror = () => resolve();
  });
}

export function preloadChatBackground(userId: string, characterId: string, url: string): Promise<boolean> {
  if (!userId || !characterId || !url || typeof Image === 'undefined') return Promise.resolve(false);
  const key = `${userId}:${characterId}:${url}`;
  const existing = backgroundLoads.get(key);
  if (existing) return existing;
  while (backgroundLoads.size >= MAX_BACKGROUND_LOADS) {
    const oldestKey = backgroundLoads.keys().next().value as string | undefined;
    if (!oldestKey) break;
    backgroundLoads.delete(oldestKey);
  }
  const load = new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  }).then((loaded) => {
    if (!loaded) backgroundLoads.delete(key);
    return loaded;
  });
  backgroundLoads.set(key, load);
  return load;
}

export function resetChatCacheForTests() {
  memoryRecords.clear();
  databasePromise = null;
}
