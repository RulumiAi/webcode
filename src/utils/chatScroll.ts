export const CHAT_BOTTOM_THRESHOLD_PX = 48;

export interface ChatScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export interface ChatScrollTarget {
  scrollTop: number;
  readonly scrollHeight: number;
}

export function isChatNearBottom(
  metrics: ChatScrollMetrics,
  threshold = CHAT_BOTTOM_THRESHOLD_PX,
) {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= threshold;
}

export function scrollChatToBottom(target: ChatScrollTarget) {
  target.scrollTop = target.scrollHeight;
}
