import { DESIGN_PREVIEW, designPreviewResponse } from './previewApi';
import type { Character, GenderType, ArtStyleType, SortOption, MediaPhoto, MediaVideo, Locale } from './types';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from './i18n';
import {
  normalizePaymentCatalog,
  type BillingCycle,
  type PaymentAccount,
  type PaymentCatalog,
  type PaymentOrder,
  type PaymentProductType,
} from './data/membershipProducts';
import {
  getApiRequestPolicy,
  invalidateApiCacheForMutation,
  runCachedApiRequest,
  setApiCacheUser,
} from './apiCache';

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE = (viteEnv?.VITE_API_BASE_URL || '/api/env1/v1').replace(/\/$/, '');
let csrfToken: string | undefined;
let csrfPromise: Promise<string> | null = null;
let authBootstrapPromise: Promise<{ authenticated: boolean; user: ApiUser | null }> | null = null;

export class ApiError extends Error {
  code: string;
  status: number;
  fields: Record<string, unknown>;
  requestId: string;

  constructor(code: string, message: string, status: number, fields: Record<string, unknown> = {}, requestId = '') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.requestId = requestId;
  }
}

export interface ApiUser {
  id: string;
  displayName: string;
  handle: string;
  email: string;
  emailVerified: boolean;
  avatar: ApiMedia | null;
  privateProfile: boolean;
  notificationsEnabled: boolean;
  locale: Locale;
  accountStatus: string;
  adultConfirmedAt: string | null;
  authMethods: string[];
  createdAt: string;
}

export interface ApiCharacterComment {
  id: string;
  characterId: string;
  parentId: string | null;
  author: { id: string; displayName: string; handle: string; avatar: ApiMedia | null };
  content: string;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  isMine: boolean;
  createdAt: string;
}

export interface ApiCharacterCommentPage extends ApiCursorPage<ApiCharacterComment> {
  commentCount?: number;
  replyCount?: number;
}

export interface ApiMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  thumbnailLargeUrl?: string | null;
  mediaType: 'image' | 'video' | 'audio';
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sizeBytes: number;
  moderationStatus: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export type ApiCardMedia = Pick<ApiMedia, 'id' | 'url' | 'mediaType' | 'durationSeconds' | 'thumbnailUrl' | 'thumbnailLargeUrl'>;

export interface ApiShowcaseItem {
  media: Omit<ApiMedia, 'url'> & { url: string | null };
  sortOrder: number;
  isCover: boolean;
  locked?: boolean;
  unlockCost?: number;
  previewUrl?: string | null;
}

export interface ApiFilterTag {
  slug: string;
  label: string;
}

export interface ApiCharacter {
  id: string;
  slug: string;
  name: string;
  age: number | null;
  ageStatus?: 'known' | 'secret';
  image: ApiMedia | null;
  style: 'realistic' | 'anime' | null;
  gender: 'female' | 'male' | 'nonbinary' | null;
  relationship: string | null;
  heritage: string;
  complexion: string;
  hair: string;
  personality: string[];
  interests: string[];
  bio: string;
  displayDescription: string;
  scenario: string;
  firstMes: string;
  voice: string;
  contentLocale: string;
  tags: string[];
  displayTags: string[];
  filterTags: ApiFilterTag[];
  creator: { id: string; displayName: string; handle: string; avatar: ApiMedia | null; privateProfile: boolean };
  favoriteCount: number;
  chatCount: number;
  commentCount: number;
  favoritedByMe: boolean;
  cardPreview: { image: ApiMedia | null; video: ApiMedia | null };
  visibility: string;
  moderationStatus: string;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  gallery?: Array<{ media: ApiMedia; sortOrder: number; videoThumbnail: ApiMedia | null; isCover: boolean }>;
  showcase?: ApiShowcaseItem[];
}

export type ApiDiscoveryCharacter = Pick<ApiCharacter,
  'id' | 'name' | 'age' | 'ageStatus' | 'style' | 'gender' | 'relationship'
  | 'displayDescription' | 'firstMes' | 'voice' | 'tags' | 'displayTags' | 'filterTags'
  | 'creator' | 'favoriteCount' | 'chatCount' | 'commentCount' | 'favoritedByMe'
> & { cardPreview: { image: ApiCardMedia | null; video: ApiCardMedia | null } };

export type ApiCharacterPersonalization = Pick<ApiCharacter, 'id' | 'favoritedByMe' | 'cardPreview'>;

export interface ApiGenerationJob {
  id: string;
  mode: 'image' | 'video';
  chatThreadId?: string | null;
  characterId: string | null;
  createdCharacterId: string | null;
  imageOperation?: 'textToImage' | 'imageToImage';
  videoOperation?: 'textToVideo' | 'imageToVideo' | 'extendVideo' | '';
  sourceMediaId?: string | null;
  pose?: string;
  outfit?: string;
  scene?: string;
  style: 'anime' | 'realistic';
  quality: '720p' | '1080p' | '4k';
  prompt?: string;
  safetyFallbackUsed?: boolean;
  aspectRatio?: string;
  count?: number;
  durationSeconds?: number;
  dialogue?: string;
  voiceId?: string | null;
  status: 'queued' | 'processing' | 'complete' | 'failed' | 'canceled';
  audioStatus?: 'notRequired' | 'queued' | 'processing' | 'complete' | 'failed' | 'canceled';
  designProfileStatus: 'notRequired' | 'queued' | 'processing' | 'complete' | 'failed';
  progress: number;
  outputs: ApiMedia[];
  failureCode: string | null;
  failureMessage: string | null;
  retryOfJobId: string | null;
  createdAt: string;
  promptStartedAt?: string | null;
  promptCompletedAt?: string | null;
  providerSubmittedAt?: string | null;
  providerCompletedAt?: string | null;
  completedAt: string | null;
  [key: string]: unknown;
}

export interface ApiGenerationOptions {
  modes: Array<{
    value: 'image' | 'video';
    enabled: boolean;
    aspectRatios: string[];
    styles?: Array<'anime' | 'realistic'>;
    qualities?: Array<'720p' | '1080p' | '4k'>;
    premiumQualities?: Array<'4k'>;
    premiumOperations?: string[];
    counts: number[];
    baseCreditCost: number;
    operations?: string[];
    durations?: number[];
    audioStatuses?: Array<'notRequired' | 'queued' | 'processing' | 'complete' | 'failed' | 'canceled'>;
  }>;
  poses: string[];
  outfits: string[];
  scenes: string[];
  freeMonthlyCredits: number;
  requiredMembershipFeature?: string;
  maxPromptLength: number;
}

export interface ApiGenerationQueueSnapshot {
  mode: 'image' | 'video';
  activeLimit: number;
  running: number;
  queued: number;
  p95Seconds: number;
  estimatedWaitSeconds: number;
  maxWaitSeconds: number;
}

export interface ApiGenerationTarget {
  id: string;
  target: 'character' | 'createdCharacter';
  source: 'public' | 'created';
  name: string;
  age: number | null;
  style: 'realistic' | 'anime';
  gender: 'female' | 'male' | 'nonbinary';
  image: ApiMedia | null;
  cardPreview: { image: ApiMedia | null; video: ApiMedia | null };
  voiceId?: string | null;
}

export interface ApiGenerationCreateRequest {
  mode: 'image' | 'video';
  characterId?: string;
  createdCharacterId?: string;
  imageOperation?: 'textToImage' | 'imageToImage';
  videoOperation?: 'textToVideo' | 'imageToVideo' | 'extendVideo';
  pose?: string;
  outfit?: string;
  scene?: string;
  style?: 'anime' | 'realistic';
  quality?: '720p' | '1080p' | '4k';
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  count?: number;
  sourceMediaId?: string;
  durationSeconds?: number;
  dialogue?: string;
  voiceId?: string;
}

export interface ApiCreatedCharacter {
  id: string;
  name: string;
  age: number | null;
  creationMode: 'manual' | 'aiDesign' | 'guided';
  style: 'realistic' | 'anime';
  gender: 'female' | 'male' | 'nonbinary';
  relationship: string;
  relationshipDetail: string;
  heritage: string;
  complexion: string;
  hair: string;
  personality: string[];
  interests: string[];
  subtitle: string;
  backgroundStory: string;
  bio: string;
  scenario: string;
  voice: string;
  tags: string[];
  filterTags: ApiFilterTag[];
  systemPrompt: string;
  firstMessage: string;
  exampleDialogue: string;
  postHistoryInstructions?: string;
  stCard?: { status: 'pending' | 'complete' | 'failed'; remoteIdentifier: string | null; errorCode: string | null; errorMessage: string | null } | null;
  publicStatus?: 'notSubmitted' | 'pending' | 'approved' | 'rejected';
  publicCharacterId?: string | null;
  publicSubmittedAt?: string | null;
  publicPublishedAt?: string | null;
  publicModerationReason?: string | null;
  appearanceProfile: Record<string, unknown>;
  creationSelections: Record<string, unknown>;
  occupation: string;
  intimacyPreferences: string[];
  advancedDetails: string;
  autoComplete: boolean;
  writingModel: string;
  contentLocale: string;
  image: ApiMedia | null;
  gallery: ApiMedia[];
  designJob: { id: string; status: ApiGenerationJob['status']; designProfileStatus: ApiGenerationJob['designProfileStatus']; hasPortrait: boolean } | null;
  generationPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiWizardNickname {
  nickname: string;
  locale: Locale;
}
export interface ApiWizardNameAvailability {
  available: boolean;
  code?: string;
}
export interface GuidedCharacterGenerateRequest {
  characterId?: string;
  name: string;
  age: number;
  style: 'realistic' | 'anime';
  gender: 'female' | 'male' | 'nonbinary';
  voiceId: string;
  contentLocale: string;
  imagePrompt?: string;
  subtitle?: string;
  backgroundStory?: string;
  firstMessage?: string;
  systemPrompt?: string;
  relationship?: string;
  selections: Record<string, unknown>;
}

export interface GeneratedImageDraftRequest {
  generationJobId: string;
  mediaId: string;
  gender: 'female' | 'male' | 'nonbinary';
  contentLocale: string;
  selections: Record<string, unknown>;
}

export interface GeneratedImageDraft {
  name: string;
  subtitle: string;
  backgroundStory: string;
  firstMessage: string;
  systemPrompt: string;
}

export interface GeneratedImageCreateRequest extends GeneratedImageDraftRequest {
  name: string;
  subtitle: string;
  backgroundStory: string;
  firstMessage: string;
  systemPrompt?: string;
  voiceId: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CharacterFilters {
  query?: string;
  style?: Exclude<ArtStyleType, 'all'>;
  gender?: Exclude<GenderType, 'all'>;
  ageGroup?: 'teen' | 'young' | 'adult' | 'mature';
  tag?: string;
  sort?: Extract<SortOption, 'trending' | 'newest' | 'popular'>;
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  retryCsrf?: boolean;
  idempotencyKey?: string;
};

export interface ApiCursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiFeedPost {
  id: string;
  author: { id: string; displayName: string; handle: string; avatar: ApiMedia | null; privateProfile: boolean };
  character: { id: string; name: string; imageUrl: string | null; imageThumbnailUrl?: string | null; imageThumbnailLargeUrl?: string | null } | null;
  media: ApiMedia;
  caption: string;
  contentLocale: string;
  likeCount: number;
  likedByMe: boolean;
  moderationStatus: string;
  moderationReason?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNotification {
  id: string;
  type: 'creatorNewCharacter' | 'creatorUpdate' | 'systemNotice';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; displayName: string; handle: string; avatar: ApiMedia | null; privateProfile?: boolean } | null;
  character: { id: string; name: string; image: ApiMedia | null } | null;
  actionType: 'viewCharacter' | 'chat' | 'creatorProfile' | 'none';
}

export interface ApiCreditBalance {
  available: number;
  reserved: number;
  monthlyAllowance: number;
  periodStartsAt: string;
  periodEndsAt: string;
  lifetimeGranted: number;
  lifetimeSpent: number;
}

export interface ApiCreditTransaction {
  id: string;
  type: 'monthlyGrant' | 'reservation' | 'capture' | 'release' | 'refund' | 'expiration' | 'adminAdjustment';
  amount: number;
  balanceAfter: number;
  jobId: string | null;
  reason: string;
  createdAt: string;
}

export interface ApiCreatorSummary {
  id: string;
  displayName: string;
  handle: string;
  avatar: ApiMedia | null;
  bio: string | null;
  verified: boolean;
  followerCount: number;
  followedByMe: boolean;
  interactionCount: number;
  level: string;
  publicCharacterCount: number;
  publicPostCount: number;
}

export interface ApiFollowingCreator extends ApiCreatorSummary {
  followedAt: string;
}

export interface ApiAppeal {
  id: string;
  characterId: string;
  details: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ApiReport {
  id: string;
  targetType: 'character' | 'feedPost' | 'user';
  targetId: string;
  reason: 'underage' | 'realPersonImpersonation' | 'nonConsensual' | 'illegalContent' | 'harassment' | 'spam' | 'other';
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface ApiChatVoice {
  voiceId: string;
  name: string;
  gender: 'female' | 'male';
  language: string;
  previewUrl: string | null;
  previewText: string | null;
  isFree?: boolean;
  requiredMembershipFeature?: string | null;
}

export interface ApiChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'complete' | 'failed' | 'canceled';
  failureCode: string | null;
  failureStage?: 'provision_user' | 'login' | 'character_copy' | 'model_config' | 'generation' | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ApiChatThread {
  id: string;
  character: { id: string; name: string; imageUrl: string | null; chatCount?: number; source?: 'api' | 'created' };
  voice: ApiChatVoice;
  lastMessage: ApiChatMessage | null;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ApiChatAudio {
  id: string;
  messageId: string;
  voice: ApiChatVoice;
  voiceId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  audioUrl: string | null;
  failureCode: string | null;
  createdAt: string;
  providerSubmittedAt: string | null;
  providerCompletedAt: string | null;
  lastPolledAt: string | null;
  nextPollAt: string | null;
  completedAt: string | null;
}


export interface ApiVoicePreviewAudio {
  id: string;
  threadId: string;
  voice: ApiChatVoice;
  voiceId: string;
  locale: Locale;
  previewText: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  audioUrl: string | null;
  failureCode: string | null;
  createdAt: string;
  providerSubmittedAt: string | null;
  providerCompletedAt: string | null;
  lastPolledAt: string | null;
  nextPollAt: string | null;
  completedAt: string | null;
}

export type ApiSseEvent =
  | { type: 'message.created'; userMessage: ApiChatMessage | null; assistantMessageId: string; replacedMessageId: string | null }
  | { type: 'message.delta'; messageId: string; delta: string }
  | { type: 'message.completed'; message: ApiChatMessage }
  | { type: 'message.error'; messageId: string; code: string; message: string; retryable: boolean; requestId: string };

function mediaUrl(url: string | null | undefined, mediaId?: string, thumbnailWidth?: 320 | 640) {
  if (!url) return '';
  try {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const parsed = new URL(url, origin);
    if (parsed.pathname.startsWith('/api/env1/v1/')) return `${parsed.pathname}${parsed.search}`;
    const hostname = parsed.hostname.toLowerCase();
    const isS3MediaUrl = hostname.endsWith('.amazonaws.com')
      && hostname.includes('.s3.')
      && parsed.pathname.includes('/app/prod/');
    if (isS3MediaUrl && mediaId) {
      const suffix = thumbnailWidth ? `/thumbnail/${thumbnailWidth}/` : '/';
      return `${API_BASE}/media/${encodeURIComponent(mediaId)}${suffix}`;
    }
  } catch {
    return url;
  }
  return url;
}

function parseMedia(media: ApiMedia | null | undefined): ApiMedia | null {
  return media ? {
    ...media,
    url: mediaUrl(media.url, media.id),
    thumbnailUrl: mediaUrl(media.thumbnailUrl, media.id, 320) || null,
    thumbnailLargeUrl: mediaUrl(media.thumbnailLargeUrl, media.id, 640) || null,
  } : null;
}

function parseCardMedia(media: ApiMedia | ApiCardMedia | null | undefined): ApiMedia | null {
  if (!media) return null;
  return {
    mimeType: '', width: null, height: null, sizeBytes: 0, moderationStatus: 'approved',
    likeCount: 0, likedByMe: false, createdAt: '',
    ...media,
    url: mediaUrl(media.url, media.id),
    thumbnailUrl: mediaUrl('thumbnailUrl' in media ? media.thumbnailUrl : '', media.id, 320) || null,
    thumbnailLargeUrl: mediaUrl('thumbnailLargeUrl' in media ? media.thumbnailLargeUrl : '', media.id, 640) || null,
  };
}

function parseUser(user: ApiUser): ApiUser {
  return { ...user, avatar: parseMedia(user.avatar) };
}

function normalizeCharacterComment(comment: ApiCharacterComment): ApiCharacterComment {
  return { ...comment, author: { ...comment.author, avatar: parseMedia(comment.author.avatar) } };
}

async function uploadMedia(file: File, purpose: 'userAvatar' | 'characterAvatar' | 'feedPost' | 'generationInput') {
  const body = new FormData();
  body.set('file', file);
  body.set('purpose', purpose);
  return request<ApiMedia>('/media/', { method: 'POST', body }).then((item) => parseMedia(item) as ApiMedia);
}

function normalizeChatMessage(message: ApiChatMessage): ApiChatMessage {
  return message;
}

function normalizeChatThread(thread: ApiChatThread): ApiChatThread {
  return {
    ...thread,
    character: {
      ...thread.character,
      imageUrl: mediaUrl(thread.character.imageUrl) || null,
      source: thread.character.source || 'api',
    },
    lastMessage: thread.lastMessage ? normalizeChatMessage(thread.lastMessage) : null,
  };
}

function normalizeChatAudio(audio: ApiChatAudio): ApiChatAudio {
  return { ...audio, audioUrl: mediaUrl(audio.audioUrl) || null };
}

function normalizeVoicePreviewAudio(audio: ApiVoicePreviewAudio): ApiVoicePreviewAudio {
  return { ...audio, audioUrl: mediaUrl(audio.audioUrl) || null };
}
function normalizeGenerationJob(job: ApiGenerationJob): ApiGenerationJob {
  return {
    ...job,
    outputs: (job.outputs || []).map((output) => parseMedia(output) as ApiMedia),
  };
}

function normalizeGenerationTarget(target: ApiGenerationTarget): ApiGenerationTarget {
  return {
    ...target,
    image: parseMedia(target.image),
    cardPreview: {
      image: parseMedia(target.cardPreview?.image),
      video: parseMedia(target.cardPreview?.video),
    },
  };
}

function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function waitForRetry(delay: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, delay);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function isTransientGuidedCreateError(reason: unknown) {
  if (reason instanceof ApiError) return reason.status >= 500 || [408, 425, 429].includes(reason.status);
  return reason instanceof TypeError || (reason instanceof DOMException && reason.name === 'NetworkError');
}

const GUIDED_CREATE_MAX_ATTEMPTS = 4;
const GUIDED_CREATE_REQUEST_TIMEOUT_MS = 30_000;
const GUIDED_CREATE_RETRY_DELAYS_MS = [500, 1000, 2000] as const;

function guidedCreateAttemptSignal(parentSignal?: AbortSignal) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, GUIDED_CREATE_REQUEST_TIMEOUT_MS);
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) controller.abort(parentSignal.reason);
  else parentSignal?.addEventListener('abort', abortFromParent, { once: true });
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timeout);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
  };
}

async function parseError(response: Response): Promise<ApiError> {
  const headerRequestId = response.headers.get('X-Request-ID') || response.headers.get('X-Request-Id') || '';
  const body = await response.text().catch(() => '');
  let payload: Record<string, unknown> = {};
  if (body.trim()) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) payload = parsed as Record<string, unknown>;
    } catch {
      // Proxies sometimes return a plain-text provider error.
    }
  }
  const nested = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
    ? payload.error as Record<string, unknown> : {};
  const plainError = typeof payload.error === 'string' ? payload.error : '';
  const candidate = nested.message || payload.detail || payload.message || plainError;
  const fallback = body.trim() && !/^</.test(body.trim()) ? body.trim().slice(0, 500) : '';
  const message = typeof candidate === 'string' && candidate.trim()
    ? candidate
    : fallback || `Request failed with status ${response.status}.`;
  const fields = (nested.fields || payload.fields);
  return new ApiError(
    String(nested.code || payload.code || 'HTTP_ERROR'), message, response.status,
    fields && typeof fields === 'object' && !Array.isArray(fields) ? fields as Record<string, unknown> : {},
    String(nested.requestId || payload.requestId || headerRequestId || ''),
  );
}

export function loadCsrf(forceRefresh = false): Promise<string> {
  if (forceRefresh) csrfToken = undefined;
  if (csrfToken) return Promise.resolve(csrfToken);
  if (csrfPromise) return csrfPromise;
  const pending = (async () => {
    const requestedLocale = typeof localStorage !== 'undefined'
      ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
      : typeof document !== 'undefined'
        ? normalizeLocale(document.documentElement.lang)
        : DEFAULT_LOCALE;
    const response = await fetch(`${API_BASE}/auth/csrf/`, {
      credentials: 'include',
      cache: 'no-cache',
      headers: { Accept: 'application/json', 'Accept-Language': requestedLocale },
    });
    if (!response.ok) throw await parseError(response);
    const payload = await response.json() as { csrfToken: string };
    csrfToken = payload.csrfToken;
    return csrfToken;
  })();
  const tracked = pending.finally(() => {
    if (csrfPromise === tracked) csrfPromise = null;
  });
  csrfPromise = tracked;
  return tracked;
}

function invalidateCsrf() {
  csrfToken = undefined;
}

function isUnsafe(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
}

async function requestResponse(
  path: string,
  options: RequestOptions = {},
  credentials: RequestCredentials = 'include',
): Promise<Response> {
  if (DESIGN_PREVIEW) {
    const response = await designPreviewResponse(path, options);
    if (!response.ok) throw await parseError(response);
    return response;
  }
  const method = (options.method || 'GET').toUpperCase();
  if (isUnsafe(method) && !csrfToken) await loadCsrf();
  const headers = new Headers(options.headers);
  headers.set('Accept', headers.get('Accept') || 'application/json');
  const requestedLocale = typeof localStorage !== 'undefined'
    ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
    : typeof document !== 'undefined'
      ? normalizeLocale(document.documentElement.lang)
      : DEFAULT_LOCALE;
  headers.set('Accept-Language', normalizeLocale(requestedLocale));
  if (isUnsafe(method) && csrfToken) headers.set('X-CSRFToken', csrfToken);
  if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);
  let body: BodyInit | undefined;
  if (options.body instanceof FormData || typeof options.body === 'string') {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }
  const fetchOptions = { ...options };
  delete (fetchOptions as { retryCsrf?: boolean }).retryCsrf;
  delete (fetchOptions as { idempotencyKey?: string }).idempotencyKey;
  delete (fetchOptions as { body?: unknown }).body;
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    cache: 'no-cache',
    method,
    headers,
    body,
    credentials,
  });
  if (response.status === 401) setApiCacheUser(null);
  if (response.status === 403 && options.retryCsrf !== false) {
    const error = await parseError(response.clone());
    if (error.code === 'CSRF_FAILED') {
      await loadCsrf(true);
      return requestResponse(path, { ...options, retryCsrf: false }, credentials);
    }
  }
  if (!response.ok) throw await parseError(response);
  return response;
}

function parseSseBlock(block: string): ApiSseEvent | null {
  let eventName = '';
  const data: string[] = [];
  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(':')) continue;
    const separator = rawLine.indexOf(':');
    const field = separator === -1 ? rawLine : rawLine.slice(0, separator);
    const value = separator === -1 ? '' : rawLine.slice(separator + 1).replace(/^ /, '');
    if (field === 'event') eventName = value;
    if (field === 'data') data.push(value);
  }
  if (!eventName || data.length === 0) return null;
  const payload = JSON.parse(data.join('\n')) as Record<string, unknown>;
  if (eventName === 'message.created') {
    return {
      type: eventName,
      userMessage: payload.userMessage ? normalizeChatMessage(payload.userMessage as ApiChatMessage) : null,
      assistantMessageId: String(payload.assistantMessageId),
      replacedMessageId: payload.replacedMessageId ? String(payload.replacedMessageId) : null,
    };
  }
  if (eventName === 'message.delta') {
    return { type: eventName, messageId: String(payload.messageId), delta: String(payload.delta || '') };
  }
  if (eventName === 'message.completed') {
    return { type: eventName, message: normalizeChatMessage(payload.message as ApiChatMessage) };
  }
  if (eventName === 'message.error') {
    return {
      type: eventName,
      messageId: String(payload.messageId),
      code: String(payload.code || 'INTERNAL_ERROR'),
      message: String(payload.message || 'The message could not be generated.'),
      retryable: Boolean(payload.retryable),
      requestId: String(payload.requestId || ''),
    };
  }
  return null;
}

type ChatStreamOptions = { signal?: AbortSignal; onEvent: (event: ApiSseEvent) => void };

async function streamChatRequest(
  path: string,
  body: Record<string, never> | { content: string },
  options: ChatStreamOptions,
) {
  const response = await requestResponse(path, {
    method: 'POST',
    body,
    headers: { Accept: 'text/event-stream' },
    idempotencyKey: uuid(),
    signal: options.signal,
  });
  if (!response.body) throw new ApiError('STREAM_UNAVAILABLE', 'The chat stream is unavailable.', response.status);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let terminal = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = parseSseBlock(block);
        if (event) {
          options.onEvent(event);
          terminal = event.type === 'message.completed' || event.type === 'message.error' || terminal;
        }
        boundary = buffer.indexOf('\n\n');
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  return { terminal };
}

function streamChat(threadId: string, content: string, options: ChatStreamOptions) {
  return streamChatRequest(`/chat/threads/${threadId}/messages/stream/`, { content }, options);
}

function streamChatAction(threadId: string, messageId: string, action: 'regenerate' | 'continue', options: ChatStreamOptions) {
  return streamChatRequest(`/chat/threads/${threadId}/messages/${messageId}/${action}/`, {}, options);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const requestedLocale = typeof localStorage !== 'undefined'
    ? normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
    : typeof document !== 'undefined'
      ? normalizeLocale(document.documentElement.lang)
      : DEFAULT_LOCALE;
  const policy = getApiRequestPolicy(path, method);
  const load = async (credentials: RequestCredentials, signal?: AbortSignal) => {
    const response = await requestResponse(path, {...options, signal}, credentials);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  };

  if (!DESIGN_PREVIEW && ['GET', 'HEAD'].includes(method) && policy.mode !== 'network') {
    const value = await runCachedApiRequest({
      path,
      locale: requestedLocale,
      policy,
      signal: options.signal,
      load: () => load(policy.credentials),
    });
    return value;
  }

  const value = await load('include', options.signal);
  if (!['GET', 'HEAD'].includes(method)) invalidateApiCacheForMutation(path);
  return value;
}

function query(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

const HOME_BOOTSTRAP_SCRIPT_ID = 'lurova-home-bootstrap';
let homeDiscoveryBootstrap: PageResult<ApiDiscoveryCharacter> | null | undefined;

function readHomeDiscoveryBootstrap() {
  if (homeDiscoveryBootstrap !== undefined) return homeDiscoveryBootstrap;
  homeDiscoveryBootstrap = null;
  if (typeof document === 'undefined') return null;
  const script = document.getElementById(HOME_BOOTSTRAP_SCRIPT_ID);
  if (!script?.textContent) return null;
  try {
    const payload = JSON.parse(script.textContent) as Partial<PageResult<ApiDiscoveryCharacter>>;
    if (!Array.isArray(payload.items) || typeof payload.total !== 'number') return null;
    homeDiscoveryBootstrap = {
      items: payload.items,
      total: payload.total,
      page: 1,
      pageSize: typeof payload.pageSize === 'number' ? payload.pageSize : payload.items.length,
    };
  } catch {
    homeDiscoveryBootstrap = null;
  } finally {
    script.remove();
  }
  return homeDiscoveryBootstrap;
}

function canUseHomeDiscoveryBootstrap(filters: CharacterFilters) {
  return filters.sort === 'trending'
    && !filters.query
    && !filters.style
    && !filters.gender
    && !filters.ageGroup
    && !filters.tag;
}

function durationLabel(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

function mapCharacterMedia(
  character: { name: string; cardPreview: { image: ApiMedia | ApiCardMedia | null; video: ApiMedia | ApiCardMedia | null } },
  media: ApiMedia | ApiShowcaseItem['media'] | null,
  index: number,
  thumbnail: ApiMedia | null = null,
  access?: Pick<ApiShowcaseItem, 'locked' | 'unlockCost' | 'previewUrl'>,
): MediaPhoto | MediaVideo {
  const normalized = media ? {
    ...media,
    url: media.url ? mediaUrl(media.url, media.id) : '',
    thumbnailUrl: 'thumbnailUrl' in media ? mediaUrl(media.thumbnailUrl, media.id, 320) : '',
    thumbnailLargeUrl: 'thumbnailLargeUrl' in media ? mediaUrl(media.thumbnailLargeUrl, media.id, 640) : '',
  } : null;
  if (!normalized) throw new Error('Cannot map missing media');
  const cardImage = parseCardMedia(character.cardPreview.image);
  // The character name is user content; keep the synthetic media title locale-neutral.
  const title = `${character.name} ${index + 1}`;
  const locked = Boolean(access?.locked);
  const previewUrl = access?.previewUrl ? mediaUrl(access.previewUrl) : '';
  if (normalized.mediaType === 'video') {
    return {
      id: normalized.id,
      coverUrl: locked
        ? previewUrl
        : parseMedia(thumbnail)?.thumbnailLargeUrl
          || parseMedia(thumbnail)?.thumbnailUrl
          || parseMedia(thumbnail)?.url
          || cardImage?.thumbnailLargeUrl
          || cardImage?.thumbnailUrl
          || cardImage?.url
          || '',
      coverFallbackUrl: locked ? undefined : parseMedia(thumbnail)?.url || cardImage?.url || undefined,
      videoUrl: normalized.url || undefined,
      title,
      duration: durationLabel(normalized.durationSeconds),
      views: '—',
      likes: normalized.likeCount,
      locked,
      unlockCost: access?.unlockCost,
    };
  }
  return {
    id: normalized.id,
    url: locked ? previewUrl : normalized.url,
    thumbnailUrl: locked ? undefined : normalized.thumbnailUrl || undefined,
    thumbnailLargeUrl: locked ? undefined : normalized.thumbnailLargeUrl || undefined,
    previewUrl: locked && previewUrl ? previewUrl : undefined,
    title,
    likes: normalized.likeCount,
    locked,
    unlockCost: access?.unlockCost,
  };
}

export function mapCharacter(character: ApiCharacter | ApiDiscoveryCharacter, detail = false): Character {
  const primary = parseCardMedia(character.cardPreview?.image) || ('image' in character ? parseMedia(character.image) : null);
  const previewVideo = parseCardMedia(character.cardPreview?.video);
  const bio = 'bio' in character ? character.bio : '';
  const showcase = detail ? ((character as ApiCharacter).showcase || []) : [];
  const photoItems = showcase.filter((item) => item.media.mediaType === 'image');
  const photos = photoItems.map((item, index) => mapCharacterMedia(character, item.media, index, null, item) as MediaPhoto);
  const videos = showcase
    .filter((item) => item.media.mediaType === 'video')
    .map((item, index) => mapCharacterMedia(character, item.media, index, null, item) as MediaVideo);
  const cardVideo = previewVideo ? [mapCharacterMedia(character, previewVideo, 0, primary) as MediaVideo] : [];
  return {
    id: character.id, name: character.name, age: character.age, ageStatus: character.ageStatus || 'known',
    subtitle: character.displayDescription || bio, description: bio || character.displayDescription || '',
    displayDescription: character.displayDescription || '',
    avatar: primary?.url || '', avatarThumbnail: primary?.thumbnailUrl || '', avatarThumbnailLarge: primary?.thumbnailLargeUrl || primary?.thumbnailUrl || '', bgImage: undefined, author: character.creator?.handle || character.creator?.displayName || '—',
    creatorId: character.creator?.id, creatorAvatar: parseMedia(character.creator?.avatar)?.url || '', likes: character.favoriteCount || 0, chatCount: character.chatCount || 0, commentCount: character.commentCount || 0,
    tags: character.displayTags?.length ? character.displayTags : (character.tags || []),
    filterTags: character.filterTags || [],
    gender: character.gender, artStyle: character.style, category: '',
    isHot: undefined, isNew: undefined, systemInstruction: '', greeting: character.firstMes || '', voiceStyle: character.voice || '',
    isFavorite: Boolean(character.favoritedByMe), photos, videos: detail ? videos : cardVideo, scenarios: [], source: 'api',
    galleryLoaded: detail, rawTags: character.tags || [], relationship: character.relationship,
  };
}

export function patchCharacterPersonalization(character: Character, patch: ApiCharacterPersonalization): Character {
  const image = parseMedia(patch.cardPreview?.image);
  const video = parseMedia(patch.cardPreview?.video);
  return {
    ...character,
    isFavorite: Boolean(patch.favoritedByMe),
    avatar: image?.url || character.avatar,
    avatarThumbnail: image?.thumbnailUrl || character.avatarThumbnail,
    avatarThumbnailLarge: image?.thumbnailLargeUrl || image?.thumbnailUrl || character.avatarThumbnailLarge,
    videos: video ? [{
      id: video.id,
      coverUrl: image?.url || character.avatar,
      videoUrl: video.url,
      title: `${character.name} - 1`,
      duration: durationLabel(video.durationSeconds),
      likes: video.likeCount,
    }] : [],
  };
}

export function mapCreatedCharacter(character: ApiCreatedCharacter, detail = false): Character {
  const background = character.backgroundStory || character.bio || '';
  const primary = parseMedia(character.image);
  const media = (character.gallery || []).map(parseMedia).filter((item): item is ApiMedia => Boolean(item));
  const photos = media
    .filter((item) => item.mediaType === 'image')
    .map((item, index) => ({
      id: item.id,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || undefined,
      thumbnailLargeUrl: item.thumbnailLargeUrl || undefined,
      title: `${character.name} - image ${index + 1}`,
      likes: item.likeCount,
    }));
  const videos = media
    .filter((item) => item.mediaType === 'video')
    .map((item, index) => ({
      id: item.id,
      coverUrl: primary?.thumbnailLargeUrl || primary?.thumbnailUrl || primary?.url || '',
      coverFallbackUrl: primary?.url || undefined,
      videoUrl: item.url,
      title: `${character.name} - video ${index + 1}`,
      duration: durationLabel(item.durationSeconds),
      likes: item.likeCount,
    }));
  return {
    id: character.id,
    name: character.name,
    age: character.age,
    ageStatus: 'known',
    subtitle: character.subtitle || character.bio || '',
    description: background,
    displayDescription: background,
    avatar: primary?.url || '',
    avatarThumbnail: primary?.thumbnailUrl || '',
    avatarThumbnailLarge: primary?.thumbnailLargeUrl || primary?.thumbnailUrl || '',
    bgImage: undefined,
    author: '@you',
    likes: 0,
    chatCount: 0,
    commentCount: 0,
    tags: character.tags || [],
    filterTags: character.filterTags || [],
    gender: character.gender,
    artStyle: character.style,
    category: character.tags?.[0] || 'created',
    isNew: true,
    warningBadge: 'created',
    badgeColor: 'bg-pink-500 text-white',
    systemInstruction: character.systemPrompt || '',
    greeting: character.firstMessage || '',
    voiceStyle: character.voice || '',
    isFavorite: false,
    photos: detail ? photos : [],
    videos: detail ? videos : [],
    scenarios: character.scenario ? [{ id: `${character.id}-scenario`, title: 'Scenario', description: character.scenario, openingLine: character.firstMessage || '' }] : [],
    source: 'created',
    galleryLoaded: detail,
    rawTags: character.tags || [],
    relationship: character.relationship,
    subtitleSource: character.subtitle,
    backgroundStory: background,
    firstMessage: character.firstMessage,
    creationSelections: character.creationSelections,
    stCard: character.stCard || null,
    publicStatus: character.publicStatus || 'notSubmitted',
    publicModerationReason: character.publicModerationReason || null,
  };
}

export interface CreatorProfile {
  id: string; displayName: string; handle: string; avatar: ApiMedia | null;
  bio: string | null; verified: boolean; followerCount: number; likeCount: number; followedByMe: boolean;
}

type CreatorProfileResponse = CreatorProfile;

export interface FavoriteResult {
  favorited: boolean;
  favoriteCount: number;
}

export const api = {
  auth: {
    csrf: loadCsrf,
    bootstrap: () => {
      if (authBootstrapPromise) return authBootstrapPromise;
      authBootstrapPromise = request<{ authenticated: boolean; user: ApiUser | null }>('/auth/session/').then((result) => {
        const user = result.user ? parseUser(result.user) : null;
        setApiCacheUser(user?.id || null);
        return {...result, user};
      }).catch((error) => {
        setApiCacheUser(null);
        throw error;
      }).finally(() => {
        authBootstrapPromise = null;
      });
      return authBootstrapPromise;
    },
    session: async () => {
      try {
        const result = await request<{ authenticated: boolean; user: ApiUser | null }>('/auth/session/');
        const user = result.user ? parseUser(result.user) : null;
        setApiCacheUser(user?.id || null);
        return {...result, user};
      } catch (error) {
        setApiCacheUser(null);
        throw error;
      }
    },
    login: async (email: string, password: string) => {
      const result = await request<{ user: ApiUser }>('/auth/login/', { method: 'POST', body: { email, password } });
      const user = parseUser(result.user);
      invalidateCsrf();
      setApiCacheUser(user.id);
      return user;
    },
    register: async (displayName: string, email: string, password: string, locale: Locale = DEFAULT_LOCALE) => {
      const result = await request<{ user: ApiUser }>('/auth/register/', { method: 'POST', body: { displayName, email, password, adultConfirmed: true, locale } });
      const user = parseUser(result.user);
      invalidateCsrf();
      setApiCacheUser(user.id);
      return user;
    },
    google: async (credential: string, locale: Locale = DEFAULT_LOCALE, adultConfirmed = true) => {
      const result = await request<{ user: ApiUser }>('/auth/google/', { method: 'POST', body: { credential, adultConfirmed, locale } });
      const user = parseUser(result.user);
      invalidateCsrf();
      setApiCacheUser(user.id);
      return user;
    },
    requestPasswordReset: (email: string) => request<{ accepted: boolean }>('/auth/password/reset/request/', { method: 'POST', body: { email } }),
    confirmPasswordReset: (token: string, newPassword: string) => request<void>('/auth/password/reset/confirm/', { method: 'POST', body: { token, newPassword } }),
    confirmEmailVerification: (token: string) => request<{ verified: boolean }>('/auth/email/verification/confirm/', { method: 'POST', body: { token } }),
    resendEmailVerification: () => request<{ accepted: boolean }>('/auth/email/verification/resend/', { method: 'POST', body: {} }),
    logout: async () => {
      await request<void>('/auth/logout/', { method: 'POST' });
      setApiCacheUser(null);
    },
  },
  users: {
    me: {
      updateLocale: async (locale: Locale) => parseUser(await request<ApiUser>('/users/me/', { method: 'PATCH', body: { locale } })),
      updateAvatar: async (file: File) => {
        const media = await uploadMedia(file, 'userAvatar');
        try {
          return parseUser(await request<ApiUser>('/users/me/', { method: 'PATCH', body: { avatarId: media.id } }));
        } catch (error) {
          await request<void>(`/media/${media.id}/`, { method: 'DELETE' }).catch(() => undefined);
          throw error;
        }
      },
    },
  },
  characters: {
    filterTags: async (signal?: AbortSignal) => request<ApiFilterTag[]>("/meta/character-filter-tags/", { signal }),
    discovery: async (filters: CharacterFilters, page = 1, pageSize = 24, signal?: AbortSignal) => {
      if (page === 1 && canUseHomeDiscoveryBootstrap(filters)) {
        const bootstrap = readHomeDiscoveryBootstrap();
        if (bootstrap) {
          return {
            ...bootstrap,
            items: bootstrap.items.slice(0, pageSize).map((item) => mapCharacter(item, false)),
            pageSize,
          };
        }
      }
      const result = await request<PageResult<ApiDiscoveryCharacter>>(`/characters/discovery/${query({ ...filters, page, pageSize })}`, { signal });
      return { ...result, items: result.items.map((item) => mapCharacter(item, false)) };
    },
    personalization: (characterIds: string[], signal?: AbortSignal) => {
      const params = new URLSearchParams();
      characterIds.forEach((id) => params.append('id', id));
      return request<{items: ApiCharacterPersonalization[]}>(`/characters/personalization/?${params.toString()}`, { signal });
    },
    list: async (filters: CharacterFilters, page = 1, pageSize = 100, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiCharacter>>(`/characters/${query({ ...filters, page, pageSize })}`, { signal });
      return { ...result, items: result.items.map((item) => mapCharacter(item, false)) };
    },
    favorites: async (page = 1, pageSize = 100, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiCharacter>>(`/users/me/favorites/${query({ page, pageSize })}`, { signal });
      return { ...result, items: result.items.map((item) => mapCharacter(item, false)) };
    },
    get: async (id: string, signal?: AbortSignal) => mapCharacter(await request<ApiCharacter>(`/characters/${id}/`, { signal }), true),
    unlockMedia: (characterId: string, mediaId: string) => request<{ mediaId: string; unlocked: boolean; charged: number; walletBalance: number }>(
      `/characters/${characterId}/media/${mediaId}/unlock/`,
      { method: 'POST', body: {}, idempotencyKey: uuid() },
    ),
    favorite: (id: string) => request<FavoriteResult>(`/characters/${id}/favorite/`, { method: 'PUT' }),
    unfavorite: (id: string) => request<FavoriteResult>(`/characters/${id}/favorite/`, { method: 'DELETE' }),
  },
  comments: {
    list: async (characterId: string, sort: 'hot' | 'newest', cursor?: string | null, signal?: AbortSignal) => {
      const result = await request<ApiCharacterCommentPage>(`/characters/${characterId}/comments/${query({ sort, cursor: cursor || undefined })}`, { signal });
      return { ...result, items: result.items.map(normalizeCharacterComment) };
    },
    replies: async (commentId: string, cursor?: string | null, signal?: AbortSignal) => {
      const result = await request<ApiCharacterCommentPage>(`/comments/${commentId}/replies/${query({ cursor: cursor || undefined })}`, { signal });
      return { ...result, items: result.items.map(normalizeCharacterComment) };
    },
    create: async (characterId: string, content: string, parentId?: string) => {
      const result = await request<{ comment: ApiCharacterComment; commentCount: number; replyCount: number }>(`/characters/${characterId}/comments/`, {
        method: 'POST', body: { content, parentId }, idempotencyKey: uuid(),
      });
      return { ...result, comment: normalizeCharacterComment(result.comment) };
    },
    like: (commentId: string) => request<{ liked: true; likeCount: number }>(`/comments/${commentId}/like/`, { method: 'PUT' }),
    unlike: (commentId: string) => request<{ liked: false; likeCount: number }>(`/comments/${commentId}/like/`, { method: 'DELETE' }),
    remove: (commentId: string) => request<{ deleted: true; commentCount: number; replyCount: number }>(`/comments/${commentId}/`, { method: 'DELETE' }),
  },
  createdCharacters: {
    voices: (gender: 'female' | 'male' | 'nonbinary', locale: Locale) =>
      request<{ defaultVoiceId: string; voices: ApiChatVoice[] }>(`/ai-characters/voices/${query({ gender, locale })}`),
    list: async (filters: {
      query?: string;
      style?: 'realistic' | 'anime';
      gender?: 'female' | 'male' | 'nonbinary';
      ageGroup?: 'teen' | 'young' | 'adult' | 'mature';
      page?: number;
      pageSize?: number;
    } = {}, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiCreatedCharacter>>(`/ai-characters/${query(filters)}`, { signal });
      return { ...result, items: result.items.map((item) => mapCreatedCharacter(item, false)) };
    },
    get: async (id: string, signal?: AbortSignal) => mapCreatedCharacter(await request<ApiCreatedCharacter>(`/ai-characters/${id}/`, { signal }), true),
    create: async (body: Partial<ApiCreatedCharacter> & { name: string; imageId?: string | null }) =>
      mapCreatedCharacter(await request<ApiCreatedCharacter>('/ai-characters/', {
        method: 'POST',
        body,
        idempotencyKey: uuid(),
      }), true),
    update: async (id: string, body: Partial<ApiCreatedCharacter>) => mapCreatedCharacter(await request<ApiCreatedCharacter>(`/ai-characters/${id}/`, { method: 'PATCH', body }), true),
    delete: (id: string) => request<void>(`/ai-characters/${id}/`, { method: 'DELETE' }),
    retryStCard: async (id: string) => request<{ queued: true }>(`/ai-characters/${id}/st-card/retry/`, { method: 'POST', body: {}, idempotencyKey: uuid() }),
    publish: async (id: string) => {
      const result = await request<{ character: ApiCreatedCharacter }>(`/ai-characters/${id}/publish/`, {
        method: 'POST', body: {}, idempotencyKey: uuid(),
      });
      return mapCreatedCharacter(result.character, true);
    },
    wizardNickname: {
      get: async (locale: Locale) => request<ApiWizardNickname>('/ai-characters/wizard/nickname/', {
        method: 'POST',
        body: { locale },
        idempotencyKey: uuid(),
      }),
      consume: async () => request<{ consumed: true }>('/ai-characters/wizard/nickname/consume/', {
        method: 'POST',
        body: {},
        idempotencyKey: uuid(),
      }),
    },
    wizardNameAvailability: async (name: string, characterId?: string) => request<ApiWizardNameAvailability>('/ai-characters/wizard/name-availability/', {
      method: 'POST',
      body: { name, characterId },
      idempotencyKey: uuid(),
    }),
    wizardGenerate: async (body: GuidedCharacterGenerateRequest, signal?: AbortSignal) => {
      const idempotencyKey = uuid();
      for (let attempt = 0; attempt < GUIDED_CREATE_MAX_ATTEMPTS; attempt += 1) {
        const requestAttempt = guidedCreateAttemptSignal(signal);
        try {
          const result = await request<{ character: ApiCreatedCharacter; job: ApiGenerationJob }>('/ai-characters/wizard/generate/', {
            method: 'POST',
            body,
            signal: requestAttempt.signal,
            idempotencyKey,
          });
          return { character: mapCreatedCharacter(result.character, true), job: result.job };
        } catch (reason) {
          if (signal?.aborted) throw reason;
          const timedOut = requestAttempt.didTimeOut();
          const transient = timedOut || isTransientGuidedCreateError(reason);
          if (!transient) throw reason;
          if (attempt === GUIDED_CREATE_MAX_ATTEMPTS - 1) {
            if (timedOut) throw new ApiError('UPSTREAM_TIMEOUT', 'Character creation request timed out.', 408);
            if (reason instanceof ApiError) throw reason;
            throw new ApiError('UPSTREAM_UNAVAILABLE', 'Character creation service is temporarily unavailable.', 503);
          }
          await waitForRetry(GUIDED_CREATE_RETRY_DELAYS_MS[attempt], signal);
        } finally {
          requestAttempt.cleanup();
        }
      }
      throw new ApiError('UPSTREAM_UNAVAILABLE', 'Character creation service is temporarily unavailable.', 503);
    },
    generatedImageDraft: (body: GeneratedImageDraftRequest, signal?: AbortSignal) => request<GeneratedImageDraft>('/ai-characters/from-generation/draft/', {
      method: 'POST', body, signal, idempotencyKey: uuid(),
    }),
    createFromGeneratedImage: async (body: GeneratedImageCreateRequest) => mapCreatedCharacter(await request<ApiCreatedCharacter>('/ai-characters/from-generation/create/', {
      method: 'POST', body, idempotencyKey: uuid(),
    }), true),
  },
  generation: {
    options: () => request<ApiGenerationOptions>('/meta/generation-options/'),
    targets: {
      list: async (filters: {
        query?: string;
        scope?: 'all' | 'created' | 'liked';
        style?: 'realistic' | 'anime';
        gender?: 'female' | 'male' | 'nonbinary';
        ageGroup?: 'teen' | 'young' | 'adult' | 'mature';
        page?: number;
        pageSize?: number;
      } = {}, signal?: AbortSignal) => {
        const result = await request<PageResult<ApiGenerationTarget>>(`/generation/targets/${query(filters)}`, { signal });
        return { ...result, items: result.items.map(normalizeGenerationTarget) };
      },
    },
    jobs: {
      list: async (filters: { mode?: 'image' | 'video'; status?: ApiGenerationJob['status']; threadId?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal) => {
        const result = await request<PageResult<ApiGenerationJob>>(`/generation/jobs/${query(filters)}`, { signal });
        return { ...result, items: result.items.map(normalizeGenerationJob) };
      },
      create: async (body: ApiGenerationCreateRequest) => normalizeGenerationJob(await request<ApiGenerationJob>('/generation/jobs/', {
        method: 'POST',
        body,
        idempotencyKey: uuid(),
      })),
      get: async (id: string, signal?: AbortSignal) => normalizeGenerationJob(await request<ApiGenerationJob>(`/generation/jobs/${id}/`, { signal })),
      status: async (ids: string[], signal?: AbortSignal) => {
        const result = await request<{ items: ApiGenerationJob[]; queues: Partial<Record<'image' | 'video', ApiGenerationQueueSnapshot>>; missingIds: string[] }>(
          `/generation/jobs/status/${query({ ids: ids.join(',') })}`,
          { signal },
        );
        return { ...result, missingIds: result.missingIds || [], items: result.items.map(normalizeGenerationJob) };
      },
      retry: async (id: string) => normalizeGenerationJob(await request<ApiGenerationJob>(`/generation/jobs/${id}/retry/`, { method: 'POST', body: {}, idempotencyKey: uuid() })),
      cancel: async (id: string) => normalizeGenerationJob(await request<ApiGenerationJob>(`/generation/jobs/${id}/cancel/`, { method: 'POST', body: {} })),
    },
  },
  creators: {
    list: async (filters: { query?: string; sort?: 'trending' | 'interactions' | 'newest'; page?: number; pageSize?: number } = {}, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiCreatorSummary>>(`/creators/${query(filters)}`, { signal });
      return { ...result, items: result.items.map((item) => ({ ...item, avatar: parseMedia(item.avatar) })) };
    },
    get: async (id: string) => {
      const result = await request<CreatorProfileResponse>(`/creators/${id}/`);
      return {
        ...result,
        avatar: parseMedia(result.avatar),
      };
    },
    characters: async (id: string, page = 1, pageSize = 12, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiCharacter>>(`/creators/${id}/characters/${query({ page, pageSize })}`, { signal });
      return { ...result, items: result.items.map((item) => mapCharacter(item, false)) };
    },
    dynamics: async (id: string, page = 1, pageSize = 12, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiFeedPost>>(`/creators/${id}/dynamics/${query({ page, pageSize })}`, { signal });
      return {
        ...result,
        items: result.items.map((post) => ({
          ...post,
          author: { ...post.author, avatar: parseMedia(post.author.avatar) },
          media: parseMedia(post.media) as ApiMedia,
          character: post.character ? { ...post.character, imageUrl: mediaUrl(post.character.imageUrl) || null, imageThumbnailUrl: mediaUrl(post.character.imageThumbnailUrl) || null, imageThumbnailLargeUrl: mediaUrl(post.character.imageThumbnailLargeUrl) || null } : null,
        })),
      };
    },
    follow: (id: string) => request<{ following: true; followerCount: number }>(`/creators/${id}/follow/`, { method: 'PUT' }),
    unfollow: (id: string) => request<{ following: false; followerCount: number }>(`/creators/${id}/follow/`, { method: 'DELETE' }),
    following: async (page = 1, pageSize = 100, signal?: AbortSignal) => {
      const result = await request<PageResult<ApiFollowingCreator>>(`/users/me/following/${query({ page, pageSize })}`, { signal });
      return { ...result, items: result.items.map((item) => ({ ...item, avatar: parseMedia(item.avatar) })) };
    },
  },
  media: {
    upload: uploadMedia,
    delete: (id: string) => request<void>(`/media/${id}/`, { method: 'DELETE' }),
  },
  feed: {
    list: async (filters: { cursor?: string; limit?: number; sort?: 'trending' | 'newest'; following?: boolean; characterId?: string; creatorId?: string; mediaType?: 'image' | 'video'; channel?: 'dynamic' | 'community' } = {}, signal?: AbortSignal) => {
      const result = await request<ApiCursorPage<ApiFeedPost>>(`/feed/posts/${query(filters)}`, { signal });
      return {
        ...result,
        items: result.items.map((post) => ({
          ...post,
          author: { ...post.author, avatar: parseMedia(post.author.avatar) },
          media: parseMedia(post.media) as ApiMedia,
          character: post.character ? { ...post.character, imageUrl: mediaUrl(post.character.imageUrl) || null, imageThumbnailUrl: mediaUrl(post.character.imageThumbnailUrl) || null, imageThumbnailLargeUrl: mediaUrl(post.character.imageThumbnailLargeUrl) || null } : null,
        })),
      };
    },
    create: async (body: { generationJobId: string; mediaId: string; characterId?: string; caption: string; contentLocale: string }) => {
      const post = await request<ApiFeedPost>('/feed/posts/', { method: 'POST', body, idempotencyKey: uuid() });
      return {
        ...post,
        author: { ...post.author, avatar: parseMedia(post.author.avatar) },
        media: parseMedia(post.media) as ApiMedia,
        character: post.character ? { ...post.character, imageUrl: mediaUrl(post.character.imageUrl) || null, imageThumbnailUrl: mediaUrl(post.character.imageThumbnailUrl) || null, imageThumbnailLargeUrl: mediaUrl(post.character.imageThumbnailLargeUrl) || null } : null,
      };
    },
    like: (id: string) => request<{ liked: true; likeCount: number }>(`/feed/posts/${id}/like/`, { method: 'PUT' }),
    unlike: (id: string) => request<{ liked: false; likeCount: number }>(`/feed/posts/${id}/like/`, { method: 'DELETE' }),
  },
  notifications: {
    list: (cursor?: string, limit = 100, unreadOnly = false, signal?: AbortSignal) =>
      request<ApiCursorPage<ApiNotification> & { unreadCount: number }>(`/notifications/${query({ cursor, limit, unreadOnly })}`, { signal }),
    read: (id: string) => request<{ id: string; isRead: true; readAt: string }>(`/notifications/${id}/read/`, { method: 'POST', body: {} }),
    readAll: () => request<{ updatedCount: number }>('/notifications/read-all/', { method: 'POST', body: {} }),
    clear: () => request<void>('/notifications/', { method: 'DELETE' }),
  },
  support: {
    feedback: (body: { category: 'suggestion' | 'bug' | 'role' | 'billing' | 'other'; message: string; contactEmail?: string; rating?: number }) =>
      request<{ id: string; status: 'received'; category: string; createdAt: string }>('/support/feedback/', { method: 'POST', body, idempotencyKey: uuid() }),
    paypalComplaint: (body: { complaintType: 'serviceNotReceived' | 'duplicateCharge' | 'incorrectAmount' | 'refundNotReceived' | 'unauthorizedTransaction' | 'other'; paypalTransactionId: string; paymentDate: string; amount: string; currency: string; contactEmail: string; desiredResolution: 'refund' | 'chargeCorrection' | 'serviceDelivery' | 'explanation' | 'other'; details: string }) =>
      request<{ id: string; status: 'received'; createdAt: string }>('/support/paypal-complaints/', { method: 'POST', body, idempotencyKey: uuid() }),
  },
  payments: {
    catalog: async (signal?: AbortSignal): Promise<PaymentCatalog> => normalizePaymentCatalog(await request<unknown>('/payments/catalog/', { signal })),
    account: (signal?: AbortSignal) => request<PaymentAccount>('/payments/account/', { signal }),
    orders: {
      list: (signal?: AbortSignal) => request<{ items: PaymentOrder[] }>('/payments/orders/', { signal }),
      create: (
        body: {
          productType: PaymentProductType; productId: string; billingCycle: BillingCycle | ''; customerName: string; customerPhone: string;
          billingInfo?: { firstName: string; lastName: string; email: string; phone: string; address1: string; address2?: string; city: string; state: string; postalCode: string; country: string };
          deviceInfo?: { language: string; os: string; browser: string; timezone: string; screenResolution: string; cardInputMethod: 'typed' | 'pasted'; cookie: string };
        },
        idempotencyKey: string,
      ) => request<PaymentOrder>('/payments/orders/', { method: 'POST', body, idempotencyKey }),
      get: (reference: string, signal?: AbortSignal) => request<PaymentOrder>(`/payments/orders/${encodeURIComponent(reference)}/`, { signal }),
      query: (reference: string, signal?: AbortSignal) => request<PaymentOrder>(`/payments/orders/${encodeURIComponent(reference)}/query/`, { method: 'POST', body: {}, signal }),
    },
  },
  reports: {
    create: (body: { targetType: ApiReport['targetType']; targetId: string; reason: ApiReport['reason']; details?: string }) =>
      request<ApiReport>('/reports/', { method: 'POST', body, idempotencyKey: uuid() }),
    list: (page = 1, pageSize = 100, signal?: AbortSignal) =>
      request<PageResult<ApiReport>>(`/users/me/reports/${query({ page, pageSize })}`, { signal }),
  },
  appeals: {
    create: (characterId: string, details: string) =>
      request<ApiAppeal>(`/characters/${characterId}/appeals/`, { method: 'POST', body: { details }, idempotencyKey: uuid() }),
    list: (page = 1, pageSize = 100, signal?: AbortSignal) =>
      request<PageResult<ApiAppeal>>(`/users/me/appeals/${query({ page, pageSize })}`, { signal }),
  },
  credits: {
    balance: () => request<ApiCreditBalance>('/credits/balance/'),
    transactions: (page = 1, pageSize = 100, signal?: AbortSignal) =>
      request<PageResult<ApiCreditTransaction>>(`/credits/transactions/${query({ page, pageSize })}`, { signal }),
  },
  chat: {
    voices: (threadId?: string, locale?: Locale) => request<{ defaultVoiceId: string; voices: ApiChatVoice[] }>(`/chat/voices/${query({ threadId, locale })}`),
    threads: {
      list: async (cursor?: string, limit = 100, signal?: AbortSignal) => {
        const result = await request<ApiCursorPage<ApiChatThread>>(`/chat/threads/${query({ cursor, limit })}`, { signal });
        return { ...result, items: result.items.map(normalizeChatThread) };
      },
      create: async (characterId: string) => normalizeChatThread(await request<ApiChatThread>('/chat/threads/', {
        method: 'POST',
        body: { characterId },
        idempotencyKey: uuid(),
      })),
      get: async (threadId: string) => normalizeChatThread(await request<ApiChatThread>(`/chat/threads/${threadId}/`)),
      messages: (threadId: string, cursor?: string, limit = 100, signal?: AbortSignal) =>
        request<ApiCursorPage<ApiChatMessage>>(`/chat/threads/${threadId}/messages/${query({ cursor, limit })}`, { signal }),
      clear: (threadId: string) => request<void>(`/chat/threads/${threadId}/clear/`, { method: 'POST', body: {} }),
      remove: (threadId: string) => request<void>(`/chat/threads/${threadId}/`, { method: 'DELETE' }),
      stream: streamChat,
      regenerate: (threadId: string, messageId: string, options: ChatStreamOptions) => streamChatAction(threadId, messageId, 'regenerate', options),
      continue: (threadId: string, messageId: string, options: ChatStreamOptions) => streamChatAction(threadId, messageId, 'continue', options),
      cancel: (threadId: string, assistantMessageId: string) =>
        request<{ messageId: string; status: ApiChatMessage['status'] }>(`/chat/threads/${threadId}/generations/${assistantMessageId}/cancel/`, { method: 'POST', body: {} }),
      setVoice: async (threadId: string, voiceId: string) => normalizeChatThread(await request<ApiChatThread>(`/chat/threads/${threadId}/voice/`, { method: 'PATCH', body: { voiceId } })),
      warmup: (threadId: string) => request<void>(`/chat/threads/${threadId}/warmup/`, { method: 'POST', body: {} }),
      createImage: async (threadId: string, body: { prompt?: string; aspectRatio?: string; count?: number }) => normalizeGenerationJob(await request<ApiGenerationJob>(`/chat/threads/${threadId}/images/`, {
        method: 'POST',
        body,
        idempotencyKey: uuid(),
      })),
    },
    voicePreviews: {
      get: async (threadId: string, voiceId: string, locale: Locale) => normalizeVoicePreviewAudio(await request<ApiVoicePreviewAudio>(`/chat/threads/${threadId}/voice-previews/${query({ voiceId, locale })}`)),
      request: async (threadId: string, voiceId: string, locale: Locale) => normalizeVoicePreviewAudio(await request<ApiVoicePreviewAudio>(`/chat/threads/${threadId}/voice-previews/`, {
        method: 'POST',
        body: { voiceId, locale },
        idempotencyKey: uuid(),
      })),
    },
    messages: {
      audio: {
        get: async (threadId: string, messageId: string) => normalizeChatAudio(await request<ApiChatAudio>(`/chat/threads/${threadId}/messages/${messageId}/audio/`)),
        request: async (threadId: string, messageId: string) => normalizeChatAudio(await request<ApiChatAudio>(`/chat/threads/${threadId}/messages/${messageId}/audio/`, {
          method: 'POST',
          body: {},
          idempotencyKey: uuid(),
        })),
      },
    },
  },
};
