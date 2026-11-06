import type { ApiGenerationJob } from '../api';
import type { ChatMessage } from '../types';

export type ChatGenerationPhase = 'idle' | 'thinking' | 'streaming';

export interface CharacterGenerationState {
  isLoading: boolean;
  phase: ChatGenerationPhase;
  assistantMessageId: string | null;
  regeneratingMessageId: string | null;
  error: string | null;
}

export function createIdleCharacterGenerationState(): CharacterGenerationState {
  return {
    isLoading: false,
    phase: 'idle',
    assistantMessageId: null,
    regeneratingMessageId: null,
    error: null,
  };
}

export function characterGenerationState(
  states: Record<string, CharacterGenerationState>,
  characterId: string | null | undefined,
) {
  return characterId ? states[characterId] || createIdleCharacterGenerationState() : createIdleCharacterGenerationState();
}

export function shouldApplyThreadLoad(
  activeThreadId: string | null,
  loadedThreadId: string,
  loadId: number,
  latestLoadId: number,
) {
  return activeThreadId === loadedThreadId && loadId === latestLoadId;
}

export function shouldApplyCharacterUpdate(
  activeCharacterId: string | null,
  targetCharacterId: string | undefined,
) {
  return activeCharacterId === targetCharacterId;
}

export function shouldRenderChatMessage(message: ChatMessage) {
  if (message.role === 'assistant' && (message.status === 'failed' || message.status === 'canceled')) return false;
  return message.role !== 'assistant' || message.status !== 'streaming' || Boolean(message.text.trim());
}

export function canReadMessageAloud(message: ChatMessage, generationActive = false) {
  return !generationActive && message.role === 'assistant' && message.status === 'complete' && Boolean(message.text.trim());
}

export function phaseAfterDelta(phase: ChatGenerationPhase, delta: string): ChatGenerationPhase {
  return phase === 'thinking' && delta.trim() ? 'streaming' : phase;
}

export function shouldShowRegenerationThinking(
  messageId: string,
  regeneratingMessageId: string | null,
  phase: ChatGenerationPhase,
) {
  return phase === 'thinking' && messageId === regeneratingMessageId;
}

export function shouldShowBottomThinking(phase: ChatGenerationPhase, regeneratingMessageId: string | null) {
  return phase === 'thinking' && !regeneratingMessageId;
}

export function replaceChatMessageInPlace(
  messages: ChatMessage[],
  replacedMessageId: string,
  replacement: ChatMessage,
) {
  const replacedIndex = messages.findIndex((message) => message.id === replacedMessageId);
  const replacementIndex = messages.findIndex((message) => message.id === replacement.id);
  const insertionIndex = replacedIndex >= 0 ? replacedIndex : replacementIndex;
  if (insertionIndex < 0) return [...messages, replacement];

  const positionedMessage = messages[insertionIndex];
  const next = messages.filter(
    (message) => message.id !== replacedMessageId && message.id !== replacement.id,
  );
  next.splice(Math.min(insertionIndex, next.length), 0, {
    ...replacement,
    createdAt: positionedMessage.createdAt,
    timestamp: positionedMessage.timestamp,
  });
  return next;
}

export function shouldShowImageGeneration(imageLoading: boolean, jobs: ApiGenerationJob[]) {
  return imageLoading || jobs.some((job) => job.status === 'queued' || job.status === 'processing');
}

export type ChatImageGenerationStage = 'preparing' | 'generating' | 'saving';

export function imageGenerationStage(job: ApiGenerationJob | null): ChatImageGenerationStage {
  if (!job || job.designProfileStatus === 'queued' || job.designProfileStatus === 'processing') return 'preparing';
  return job.progress >= 95 ? 'saving' : 'generating';
}

export function imageGenerationProgress(job: ApiGenerationJob | null) {
  if (!job) return null;
  return Math.min(95, Math.max(6, job.progress));
}

export const CHAT_IMAGE_RETRY_DELAYS = [1000, 2000, 4000] as const;

export function chatImageRetryDelay(attempt: number) {
  return CHAT_IMAGE_RETRY_DELAYS[attempt] ?? null;
}

export type ChatTimelineItem =
  | { type: 'message'; createdAt: string; order: number; message: ChatMessage }
  | { type: 'image'; createdAt: string; order: number; job: ApiGenerationJob }
  | { type: 'image-failed'; createdAt: string; order: number; job: ApiGenerationJob }
  | { type: 'image-pending'; createdAt: string; order: number; job: ApiGenerationJob | null };

export function chatTimelineTailKey(items: ChatTimelineItem[]) {
  const item = items[items.length - 1];
  if (!item) return '';
  if (item.type === 'message') return `message:${item.message.id}:${item.message.status}:${item.createdAt}`;
  if (item.type === 'image-pending') return `image-pending:${item.job?.id || 'request'}:${item.job?.status || 'submitting'}:${item.job?.progress ?? ''}:${item.createdAt}`;
  const output = item.job.outputs[0];
  return `${item.type}:${item.job.id}:${item.job.status}:${item.job.failureCode || ''}:${output?.id || ''}:${output?.url || ''}`;
}

const timeValue = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

export function buildChatTimeline(
  messages: ChatMessage[],
  jobs: ApiGenerationJob[] = [],
  imageLoading = false,
  imageLoadingCreatedAt = '',
): ChatTimelineItem[] {
  const items: ChatTimelineItem[] = messages.map((message, order) => ({
    type: 'message' as const,
    createdAt: message.createdAt,
    order,
    message,
  }));
  let pendingCreatedAt = imageLoading ? imageLoadingCreatedAt : '';
  let pendingOrder = messages.length;
  let pendingJob: ApiGenerationJob | null = null;
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const retryGroups = new Map<string, { job: ApiGenerationJob; createdAt: string; depth: number; index: number }>();

  jobs.forEach((job, index) => {
    let root = job;
    let depth = 0;
    const visited = new Set([job.id]);
    while (root.retryOfJobId) {
      const parent = jobsById.get(root.retryOfJobId);
      if (!parent || visited.has(parent.id)) break;
      visited.add(parent.id);
      root = parent;
      depth += 1;
    }
    const groupKey = root.id;
    const current = retryGroups.get(groupKey);
    if (
      !current
      || depth > current.depth
      || (depth === current.depth && timeValue(job.createdAt) > timeValue(current.job.createdAt))
    ) {
      retryGroups.set(groupKey, { job, createdAt: root.createdAt, depth, index });
    }
  });

  retryGroups.forEach(({ job, createdAt, index }) => {
    if (job.status !== 'canceled' && job.outputs?.[0]) {
      items.push({ type: 'image', createdAt, order: messages.length + index, job });
    } else if (job.status === 'queued' || job.status === 'processing') {
      if (!pendingCreatedAt || timeValue(createdAt) < timeValue(pendingCreatedAt)) {
        pendingCreatedAt = createdAt;
        pendingJob = job;
      } else if (!imageLoading && !pendingJob) {
        pendingJob = job;
      }
      pendingOrder = Math.min(pendingOrder, messages.length + index);
    } else if (job.status === 'failed') {
      items.push({ type: 'image-failed', createdAt, order: messages.length + index, job });
    }
  });
  if (pendingCreatedAt || imageLoading) {
    items.push({ type: 'image-pending', createdAt: pendingCreatedAt, order: pendingOrder, job: pendingJob });
  }

  return items.sort((left, right) => {
    const timeDifference = timeValue(left.createdAt) - timeValue(right.createdAt);
    if (timeDifference !== 0) return timeDifference;
    const imagePriority = (item: ChatTimelineItem) => item.type === 'message' ? 1 : 0;
    return imagePriority(left) - imagePriority(right) || left.order - right.order;
  });
}
