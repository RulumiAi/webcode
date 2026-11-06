import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHAT_CACHE_MAX_AGE_MS,
  readCachedTimeline,
  resetChatCacheForTests,
  writeCachedTimeline,
} from './chatTimelineCache';

test.beforeEach(() => resetChatCacheForTests());

test('chat snapshots expire and remain user scoped', async () => {
  const originalNow = Date.now;
  try {
    Date.now = () => 100;
    await writeCachedTimeline('user-a', 'thread-a', [], []);
    assert.ok(await readCachedTimeline('user-a', 'thread-a'));
    assert.equal(await readCachedTimeline('user-b', 'thread-a'), null);
    Date.now = () => 100 + CHAT_CACHE_MAX_AGE_MS + 1;
    assert.equal(await readCachedTimeline('user-a', 'thread-a'), null);
  } finally {
    Date.now = originalNow;
  }
});

test('chat snapshots retain only newest twenty timelines per user', async () => {
  const originalNow = Date.now;
  try {
    for (let index = 0; index < 21; index += 1) {
      Date.now = () => index + 1;
      await writeCachedTimeline('user-a', `thread-${index}`, [], []);
    }
    assert.equal(await readCachedTimeline('user-a', 'thread-0'), null);
    assert.ok(await readCachedTimeline('user-a', 'thread-20'));
  } finally {
    Date.now = originalNow;
  }
});
