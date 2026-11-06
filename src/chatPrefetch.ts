import { api, type ApiChatMessage, type ApiChatThread } from './api';
import { preloadChatBackground } from './chatTimelineCache';
import type { Character } from './types';

type ChatPrefetch = {
  messages: Promise<{ items: ApiChatMessage[]; nextCursor: string | null; hasMore: boolean }>;
  character: Promise<Character>;
  background: Promise<boolean>;
};

const prefetchedChats = new Map<string, ChatPrefetch>();

const prefetchKey = (userId: string, threadId: string) => `${userId}:${threadId}`;

export function getChatPrefetch(userId: string, thread: ApiChatThread): ChatPrefetch {
  const key = prefetchKey(userId, thread.id);
  const existing = prefetchedChats.get(key);
  if (existing) return existing;

  const source = thread.character.source || 'api';
  const prefetch = {
    messages: api.chat.threads.messages(thread.id, undefined, 100),
    character: source === 'created'
      ? api.createdCharacters.get(thread.character.id)
      : api.characters.get(thread.character.id),
    background: preloadChatBackground(userId, thread.character.id, thread.character.imageUrl || ''),
  };
  prefetchedChats.set(key, prefetch);
  return prefetch;
}

export function clearChatPrefetches(userId?: string) {
  if (!userId) {
    prefetchedChats.clear();
    return;
  }
  for (const key of prefetchedChats.keys()) {
    if (key.startsWith(`${userId}:`)) prefetchedChats.delete(key);
  }
}
