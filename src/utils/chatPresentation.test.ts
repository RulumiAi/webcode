import assert from 'node:assert/strict';
import test from 'node:test';
import type { ApiGenerationJob } from '../api';
import type { ChatMessage } from '../types';
import {
  buildChatTimeline,
  chatTimelineTailKey,
  CHAT_IMAGE_RETRY_DELAYS,
  canReadMessageAloud,
  chatImageRetryDelay,
  imageGenerationProgress,
  imageGenerationStage,
  characterGenerationState,
  createIdleCharacterGenerationState,
  phaseAfterDelta,
  replaceChatMessageInPlace,
  shouldRenderChatMessage,
  shouldShowBottomThinking,
  shouldShowImageGeneration,
  shouldShowRegenerationThinking,
  shouldApplyCharacterUpdate,
  shouldApplyThreadLoad,
} from './chatPresentation';

const message = (values: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'message',
  role: 'assistant',
  text: '',
  createdAt: '2026-08-13T09:00:00.000Z',
  timestamp: '12:00',
  status: 'streaming',
  ...values,
});

const job = (id: string, status: ApiGenerationJob['status']): ApiGenerationJob => ({
  id,
  mode: 'image',
  characterId: null,
  createdCharacterId: null,
  style: 'anime',
  quality: '1080p',
  status,
  designProfileStatus: 'notRequired',
  progress: 0,
  creditsReserved: 0,
  creditsCharged: 0,
  outputs: [],
  failureCode: null,
  failureMessage: null,
  retryOfJobId: null,
  createdAt: '2026-08-13T09:00:00.000Z',
  completedAt: null,
});

const timelineJob = (id: string, status: ApiGenerationJob['status'], createdAt: string): ApiGenerationJob => ({
  ...job(id, status),
  createdAt,
  outputs: status === 'complete' ? [{ id: `${id}-output`, url: `/media/${id}`, mediaType: 'image', mimeType: 'image/png', width: 100, height: 100, durationSeconds: null, sizeBytes: 1, moderationStatus: 'approved', likeCount: 0, likedByMe: false, createdAt }] : [],
});

test('hides an empty streaming assistant until visible text arrives', () => {
  assert.equal(shouldRenderChatMessage(message()), false);
  assert.equal(phaseAfterDelta('thinking', '  \n'), 'thinking');
  assert.equal(phaseAfterDelta('thinking', 'Hello'), 'streaming');
  assert.equal(shouldRenderChatMessage(message({ text: 'Hello' })), true);
});

test('keeps concurrent role generation state isolated', () => {
  const states = {
    aria: { ...createIdleCharacterGenerationState(), isLoading: true, phase: 'thinking' as const },
    luna: createIdleCharacterGenerationState(),
  };

  assert.equal(characterGenerationState(states, 'aria').isLoading, true);
  assert.equal(characterGenerationState(states, 'luna').isLoading, false);
  assert.equal(characterGenerationState(states, 'unknown').phase, 'idle');
});

test('applies a loaded thread only to its current view and latest request', () => {
  assert.equal(shouldApplyThreadLoad('thread-a', 'thread-a', 2, 2), true);
  assert.equal(shouldApplyThreadLoad('thread-b', 'thread-a', 2, 2), false);
  assert.equal(shouldApplyThreadLoad('thread-a', 'thread-a', 1, 2), false);
  assert.equal(shouldApplyCharacterUpdate('aria', 'aria'), true);
  assert.equal(shouldApplyCharacterUpdate('luna', 'aria'), false);
});

test('keeps regeneration thinking at the replaced message position', () => {
  const original = message({ id: 'original', text: 'Old reply', status: 'complete' });
  const following = message({ id: 'following', role: 'user', text: 'Later item', status: 'complete' });
  const replacement = message({ id: 'replacement' });
  const next = replaceChatMessageInPlace([original, following], original.id, replacement);

  assert.deepEqual(next.map((item) => item.id), ['replacement', 'following']);
  assert.equal(next[0].createdAt, original.createdAt);
  assert.equal(shouldShowRegenerationThinking(original.id, original.id, 'thinking'), true);
  assert.equal(shouldShowRegenerationThinking(replacement.id, replacement.id, 'thinking'), true);
  assert.equal(shouldShowRegenerationThinking(replacement.id, replacement.id, 'streaming'), false);
  assert.equal(shouldShowBottomThinking('thinking', replacement.id), false);
  assert.equal(shouldShowBottomThinking('thinking', null), true);
});

test('completes a replacement without moving it to the end', () => {
  const streaming = message({ id: 'replacement', createdAt: '2026-08-13T09:00:00.000Z' });
  const following = message({ id: 'following', role: 'user', text: 'Later item', createdAt: '2026-08-13T10:00:00.000Z', status: 'complete' });
  const completed = message({ id: 'replacement', text: 'New reply', createdAt: '2026-08-13T11:00:00.000Z', status: 'complete' });
  const next = replaceChatMessageInPlace([streaming, following], 'original', completed);

  assert.deepEqual(next.map((item) => item.id), ['replacement', 'following']);
  assert.equal(next[0].createdAt, streaming.createdAt);
  assert.equal(next[0].text, 'New reply');
});

test('enables read aloud only for completed assistant content', () => {
  assert.equal(canReadMessageAloud(message({ text: 'Hello' })), false);
  assert.equal(canReadMessageAloud(message({ text: 'Hello', status: 'complete' })), true);
  assert.equal(canReadMessageAloud(message({ text: 'Hello', status: 'complete' }), true), false);
  assert.equal(canReadMessageAloud(message({ role: 'user', text: 'Hello', status: 'complete' })), false);
});

test('collapses image submission and multiple pending jobs into one loading flag', () => {
  assert.equal(shouldShowImageGeneration(true, []), true);
  assert.equal(shouldShowImageGeneration(false, [job('one', 'queued'), job('two', 'processing')]), true);
  assert.equal(shouldShowImageGeneration(false, [job('one', 'complete'), job('two', 'failed')]), false);
});

test('maps image jobs to preparation, generation, and persistence stages', () => {
  assert.equal(imageGenerationStage(null), 'preparing');
  assert.equal(imageGenerationProgress(null), null);
  assert.equal(imageGenerationStage({ ...job('prepare', 'queued'), designProfileStatus: 'processing' }), 'preparing');
  assert.equal(imageGenerationProgress({ ...job('prepare', 'queued'), progress: 0 }), 6);
  assert.equal(imageGenerationStage({ ...job('generate', 'processing'), designProfileStatus: 'complete', progress: 45 }), 'generating');
  assert.equal(imageGenerationStage({ ...job('save', 'processing'), designProfileStatus: 'complete', progress: 95 }), 'saving');
  assert.equal(imageGenerationProgress({ ...job('save', 'processing'), progress: 100 }), 95);
});

test('places images by creation time, including after completion', () => {
  const user = message({ id: 'user', role: 'user', text: 'Make an image', createdAt: '2026-08-13T10:00:00.000Z', status: 'complete' });
  const image = timelineJob('image', 'complete', '2026-08-13T09:00:00.000Z');
  assert.deepEqual(buildChatTimeline([user], [image]).map((item) => item.type === 'message' ? item.message.id : item.type === 'image' ? item.job.id : item.type), ['image', 'user']);
});

test('uses the last timeline item as the scroll target, including images', () => {
  const user = message({ id: 'user', role: 'user', createdAt: '2026-08-13T09:00:00.000Z', status: 'complete' });
  const image = timelineJob('image', 'complete', '2026-08-13T10:00:00.000Z');
  const timeline = buildChatTimeline([user], [image]);
  assert.equal(chatTimelineTailKey(timeline), 'image:image:complete::image-output:/media/image');
});

test('changes the image scroll target when pending image completes or fails', () => {
  const pending = timelineJob('image', 'processing', '2026-08-13T10:00:00.000Z');
  const completed = timelineJob('image', 'complete', '2026-08-13T10:00:00.000Z');
  const failed = timelineJob('image', 'failed', '2026-08-13T10:00:00.000Z');
  assert.notEqual(
    chatTimelineTailKey(buildChatTimeline([], [pending])),
    chatTimelineTailKey(buildChatTimeline([], [completed])),
  );
  assert.notEqual(
    chatTimelineTailKey(buildChatTimeline([], [pending])),
    chatTimelineTailKey(buildChatTimeline([], [failed])),
  );
});

test('keeps a newer message as the scroll target when its image is older', () => {
  const image = timelineJob('image', 'complete', '2026-08-13T09:00:00.000Z');
  const user = message({ id: 'user', role: 'user', createdAt: '2026-08-13T10:00:00.000Z', status: 'complete' });
  assert.equal(chatTimelineTailKey(buildChatTimeline([user], [image])), 'message:user:complete:2026-08-13T10:00:00.000Z');
});

test('collapses pending images at earliest creation time and keeps failures', () => {
  const user = message({ id: 'user', role: 'user', createdAt: '2026-08-13T10:00:00.000Z', status: 'complete' });
  const items = buildChatTimeline([user], [
    timelineJob('late', 'processing', '2026-08-13T09:30:00.000Z'),
    timelineJob('early', 'queued', '2026-08-13T09:00:00.000Z'),
    timelineJob('failed', 'failed', '2026-08-13T08:00:00.000Z'),
    timelineJob('canceled', 'canceled', '2026-08-13T08:30:00.000Z'),
  ]);
  const pending = items.find((item) => item.type === 'image-pending');
  assert.ok(pending && pending.type === 'image-pending');
  assert.equal(pending.createdAt, '2026-08-13T09:00:00.000Z');
  assert.equal(pending.job?.id, 'early');
  assert.equal(items.some((item) => item.type === 'image-failed' && item.job.id === 'failed'), true);
  assert.equal(items.some((item) => item.type === 'image' && item.job.id === 'canceled'), false);
});

test('shows output even when final job status is failed', () => {
  const failedWithOutput = {
    ...timelineJob('partial', 'failed', '2026-08-13T09:00:00.000Z'),
    outputs: timelineJob('partial', 'complete', '2026-08-13T09:00:00.000Z').outputs,
  };
  const items = buildChatTimeline([], [failedWithOutput]);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'image');
});

test('retry replaces its failed ancestor at the original timeline position', () => {
  const parent = timelineJob('parent', 'failed', '2026-08-13T09:00:00.000Z');
  const retry = {
    ...timelineJob('retry', 'processing', '2026-08-13T10:00:00.000Z'),
    retryOfJobId: parent.id,
  };
  const user = message({ id: 'user', role: 'user', createdAt: '2026-08-13T09:30:00.000Z', status: 'complete' });
  const items = buildChatTimeline([user], [retry, parent]);
  assert.deepEqual(items.map((item) => item.type === 'message' ? item.message.id : item.type === 'image-pending' ? item.job?.id : item.type), ['retry', 'user']);
  assert.equal(items.filter((item) => item.type === 'image-failed').length, 0);
});

test('latest failed retry is the only failure shown', () => {
  const parent = timelineJob('parent', 'failed', '2026-08-13T09:00:00.000Z');
  const firstRetry = { ...timelineJob('retry-one', 'failed', '2026-08-13T10:00:00.000Z'), retryOfJobId: parent.id };
  const secondRetry = { ...timelineJob('retry-two', 'failed', '2026-08-13T11:00:00.000Z'), retryOfJobId: firstRetry.id };
  const items = buildChatTimeline([], [secondRetry, firstRetry, parent]);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'image-failed');
  assert.equal(items[0].createdAt, parent.createdAt);
  assert.equal(items[0].type === 'image-failed' ? items[0].job.id : null, secondRetry.id);
});

test('prioritizes images at equal timestamps with stable message order', () => {
  const first = message({ id: 'first', role: 'user', createdAt: '2026-08-13T09:00:00.000Z', status: 'complete' });
  const second = message({ id: 'second', role: 'assistant', text: 'Reply', createdAt: '2026-08-13T09:00:00.000Z', status: 'complete' });
  const items = buildChatTimeline([first, second], [timelineJob('image', 'complete', '2026-08-13T09:00:00.000Z')]);
  assert.deepEqual(items.map((item) => item.type === 'message' ? item.message.id : item.type === 'image' ? item.job.id : item.type), ['image', 'first', 'second']);
});

test('keeps completed message order when no images are present', () => {
  const first = message({ id: 'first', role: 'user', createdAt: '2026-08-13T09:00:00.000Z', status: 'complete' });
  const second = message({ id: 'second', role: 'assistant', text: 'Reply', createdAt: '2026-08-13T09:01:00.000Z', status: 'complete' });
  assert.deepEqual(buildChatTimeline([first, second]).map((item) => item.type === 'message' ? item.message.id : item.type), ['first', 'second']);
});

test('removes completed, pending, and failed image items after chat clear', () => {
  const opening = message({ id: 'opening', text: 'Hello again', createdAt: '2026-08-13T12:00:00.000Z', status: 'complete' });
  const oldJobs = [
    timelineJob('complete', 'complete', '2026-08-13T09:00:00.000Z'),
    timelineJob('pending', 'processing', '2026-08-13T10:00:00.000Z'),
    timelineJob('failed', 'failed', '2026-08-13T11:00:00.000Z'),
  ];
  assert.equal(buildChatTimeline([opening], oldJobs).some((item) => item.type !== 'message'), true);
  assert.deepEqual(
    buildChatTimeline([opening], [], false, '').map((item) => item.type === 'message' ? item.message.id : item.type),
    ['opening'],
  );
});

test('uses bounded image retries while temporary media becomes available', () => {
  assert.deepEqual([...CHAT_IMAGE_RETRY_DELAYS], [1000, 2000, 4000]);
  assert.equal(chatImageRetryDelay(0), 1000);
  assert.equal(chatImageRetryDelay(2), 4000);
  assert.equal(chatImageRetryDelay(3), null);
});
