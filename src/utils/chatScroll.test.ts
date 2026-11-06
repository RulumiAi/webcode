import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isChatNearBottom, scrollChatToBottom } from './chatScroll';

test('treats empty and shorter-than-viewport chats as pinned', () => {
  assert.equal(isChatNearBottom({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }), true);
  assert.equal(isChatNearBottom({ scrollTop: 0, scrollHeight: 300, clientHeight: 600 }), true);
});

test('uses the inclusive 48 pixel bottom threshold', () => {
  assert.equal(isChatNearBottom({ scrollTop: 552, scrollHeight: 1000, clientHeight: 400 }), true);
  assert.equal(isChatNearBottom({ scrollTop: 551, scrollHeight: 1000, clientHeight: 400 }), false);
});

test('scrolls directly to the current content height', () => {
  const target = { scrollTop: 120, scrollHeight: 1400 };
  scrollChatToBottom(target);
  assert.equal(target.scrollTop, 1400);
});
