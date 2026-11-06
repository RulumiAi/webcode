import {ChatCharacterIntro} from './ChatCharacterIntro';
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Send, ChevronRight, Heart, Volume2, VolumeX, LoaderCircle, Trash2, Sparkles, PanelRightOpen, PanelLeftOpen, MessageSquare, Wallpaper, RotateCcw, SkipForward, X, ImageIcon, Check } from 'lucide-react';
import { Character, ChatMessage } from '../types';
import { api, ApiError, ApiChatMessage, ApiChatThread, ApiChatAudio, ApiGenerationJob } from '../api';
import { ChattedListSidebar } from './ChattedListSidebar';
import { CharacterDetailPanel } from './CharacterDetailPanel';
import { parseRoleplayText } from '../utils/roleplayText';
import { isChatNearBottom, scrollChatToBottom } from '../utils/chatScroll';
import { buildChatTimeline, canReadMessageAloud, characterGenerationState, chatImageRetryDelay, chatTimelineTailKey, createIdleCharacterGenerationState, imageGenerationProgress, imageGenerationStage, phaseAfterDelta, replaceChatMessageInPlace, shouldApplyCharacterUpdate, shouldApplyThreadLoad, shouldRenderChatMessage, shouldShowBottomThinking, shouldShowImageGeneration, shouldShowRegenerationThinking, type CharacterGenerationState } from '../utils/chatPresentation';
import { useLocale } from '../i18n';
import {generationPolling} from '../utils/generationPolling';
import {userErrorCodeMessage, userErrorMessage} from '../utils/userError';
import type { MembershipPlanId } from '../data/membershipProducts';
import { preloadChatBackground, readCachedTimeline, removeCachedTimeline, writeCachedTimeline } from '../chatTimelineCache';
import { getChatPrefetch } from '../chatPrefetch';
import { DESIGN_PREVIEW } from '../previewApi';

interface ChatPageProps {
  onOpenCreatorProfile?:(author:string,id?:string)=>void;
  isActive: boolean;
  characters: Character[];
  selectedCharacter: Character | null;
  onSelectCharacter: (char: Character) => void;
  onDeleteChatHistory: (characterId: string) => void;
  onToggleFavorite: (characterId: string, e: React.MouseEvent) => void;
  onGoToExplore: () => void;
  onOpenUpgradeModal: (notice?: string) => void;
  onOpenQuickUpgradeModal?: (notice?: string, featureLabel?: string) => void;
  onOpenCreateModal: () => void;
  onOpenCreation?: () => void;
  onRequireAuth?: () => void;
  isAuthenticated?: boolean;
  membershipTier?: MembershipPlanId | null;
  membershipFeatureKeys?: string[];
  walletBalance?: number;
  freeChatImagesRemaining?: number;
  onOpenRechargeModal?: () => void;
  userAvatar?: string | null;
  onCommentCountChange: (characterId: string, count: number) => void;
  initialThreads: ApiChatThread[];
  initialThreadsReady: boolean;
  initialThreadsLoading: boolean;
  initialThreadsError: string | null;
  isAppNavigationOpen?: boolean;
  isMobileViewport?: boolean;
  onBackToList?: () => void;
  onThreadListChange?: (threads: ApiChatThread[]) => void;
  cacheUserId?: string | null;
}

const uiMessage = (message: ApiChatMessage, locale: string): ChatMessage => ({
  id: message.id,
  role: message.role,
  text: message.content,
  createdAt: message.createdAt,
  timestamp: message.createdAt ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt)) : '—',
  status: message.status,
  failureCode: message.failureCode,
});

const isAutoplayBlocked = (reason: unknown) =>
  typeof reason === 'object' && reason !== null && 'name' in reason && reason.name === 'NotAllowedError';

const RetryingChatImage: React.FC<{
  src: string;
  alt: string;
  className: string;
  onLoad?: () => void;
  framed?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}> = ({ src, alt, className, onLoad, framed = false, loading, fetchPriority }) => {
  const [attempt, setAttempt] = useState(0);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    setAttempt(0);
    setLoadedSource(null);
    return () => {
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    };
  }, [src]);

  const retrySrc = attempt === 0
    ? src
    : `${src}${src.includes('?') ? '&' : '?'}chatImageRetry=${attempt}`;
  const retry = () => {
    const delay = chatImageRetryDelay(attempt);
    if (delay === null || retryTimerRef.current !== null) return;
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setAttempt((current) => current + 1);
    }, delay);
  };
  const loaded = () => {
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    setLoadedSource(retrySrc);
    onLoad?.();
  };

  const image = (
    <img
      src={retrySrc}
      alt={alt}
      className={framed ? `${className} transition-opacity duration-200 motion-reduce:transition-none ${loadedSource === retrySrc ? 'opacity-100' : 'opacity-0'}` : className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={retry}
      onLoad={loaded}
    />
  );

  if (!framed) return image;

  return (
    <span className="relative block h-full w-full overflow-hidden bg-[#111119]">
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center bg-[#111119] transition-opacity duration-200 motion-reduce:transition-none ${loadedSource === retrySrc ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <ImageIcon className="h-6 w-6 text-zinc-700" />
        <span className="chat-image-waiting-shimmer absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </span>
      {image}
    </span>
  );
};

const ChatLoadingShell: React.FC<{
  label: string;
  exploreLabel: string;
  error: string | null;
  onGoToExplore: () => void;
}> = ({ label, exploreLabel, error, onGoToExplore }) => (
  <div className="chat-loading-shell relative flex h-full min-h-0 w-full overflow-hidden bg-[#0b0b0f] text-zinc-100 lg:rounded-3xl lg:border lg:border-zinc-800/80 lg:shadow-2xl">
    <aside className="hidden w-80 shrink-0 border-r border-zinc-800 bg-[#111119] p-4 md:block">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-800/80 motion-reduce:animate-none" />
        <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-800/80 motion-reduce:animate-none" />
      </div>
      <div className="mb-4 h-10 animate-pulse rounded-xl bg-zinc-900 motion-reduce:animate-none" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-zinc-800 motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800 motion-reduce:animate-none" />
              <div className="h-2.5 w-full animate-pulse rounded bg-zinc-900 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </aside>
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800 bg-[#13131b]/90 px-4">
        <LoaderCircle className="h-5 w-5 animate-spin text-pink-400 motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-sm font-bold text-zinc-200">{label}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-5 p-4 sm:p-6" aria-hidden="true">
        <div className="h-20 w-3/4 animate-pulse rounded-2xl bg-zinc-900/80 motion-reduce:animate-none" />
        <div className="ml-auto h-14 w-1/2 animate-pulse rounded-2xl bg-pink-950/40 motion-reduce:animate-none" />
        <div className="h-28 w-4/5 animate-pulse rounded-2xl bg-zinc-900/80 motion-reduce:animate-none" />
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 bg-[#14141d] p-3 sm:p-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-zinc-900 motion-reduce:animate-none" />
        <div className="h-12 min-w-0 flex-1 animate-pulse rounded-xl bg-zinc-900 motion-reduce:animate-none" />
        <div className="h-12 w-12 animate-pulse rounded-xl bg-pink-950/60 motion-reduce:animate-none" />
      </div>
      {error && (
        <div className="absolute inset-x-4 top-20 z-10 flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-[#24151b] px-4 py-3 text-xs text-rose-100 shadow-lg sm:inset-x-auto sm:right-6 sm:w-[min(28rem,calc(100%-3rem))]">
          <span>{error}</span>
          <button type="button" onClick={onGoToExplore} className="shrink-0 rounded-lg bg-pink-500 px-3 py-2 font-bold text-white hover:bg-pink-600">{exploreLabel}</button>
        </div>
      )}
    </section>
  </div>
);

export const ChatPage: React.FC<ChatPageProps> = ({
  isActive,
  characters, selectedCharacter, onSelectCharacter, onDeleteChatHistory, onToggleFavorite,
  onOpenCreatorProfile, onOpenCreation, onGoToExplore, onOpenUpgradeModal, onOpenQuickUpgradeModal, onOpenCreateModal, onRequireAuth,
  isAuthenticated, membershipTier = null, membershipFeatureKeys = [], walletBalance, freeChatImagesRemaining, onOpenRechargeModal, userAvatar, onCommentCountChange,
  initialThreads,
  initialThreadsReady,
  initialThreadsLoading,
  initialThreadsError,
  isAppNavigationOpen = false,
  isMobileViewport = false,
  onBackToList,
  onThreadListChange,
  cacheUserId = null,
}) => {
  const { locale, t, formatTime } = useLocale();
  const [threads, setThreads] = useState<ApiChatThread[]>(initialThreads);
  const [activeThread, setActiveThread] = useState<ApiChatThread | null>(null);
  const [resolvedCharacter, setResolvedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessages, setInputMessages] = useState<Record<string, string>>({});
  const [imageMode, setImageMode] = useState(false);
  const [imageJobs, setImageJobs] = useState<ApiGenerationJob[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadingCreatedAt, setImageLoadingCreatedAt] = useState('');
  const [retryingImageJobId, setRetryingImageJobId] = useState<string | null>(null);
  const [generationStates, setGenerationStates] = useState<Record<string, CharacterGenerationState>>({});
  const [threadLoading, setThreadLoading] = useState(!initialThreadsReady || initialThreadsLoading);
  const [threadError, setThreadError] = useState<string | null>(initialThreadsError);
  const [timelineSynced, setTimelineSynced] = useState<Record<string, boolean>>({});
  const [visibleTimelineThreadId, setVisibleTimelineThreadId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [previewLoadingVoiceId, setPreviewLoadingVoiceId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [voiceSyncing, setVoiceSyncing] = useState(false);
  const [voiceSyncError, setVoiceSyncError] = useState<string | null>(null);
  const [chatBgMap, setChatBgMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('soulmingle_chat_bg_map_v2') || '{}') as Record<string, string>; } catch { return {}; }
  });
  const [bgOpacity, setBgOpacity] = useState(0.82);
  const [loadedChatBgs, setLoadedChatBgs] = useState<Record<string, string>>({});
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [recentOpen,setRecentOpen]=useState(true);
  const [showDetailDrawer, setShowDetailDrawer] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches);
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ type: 'clear_active_history' | 'remove_recent_chat'; characterId: string; characterName: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const streamControllersRef = useRef<Record<string, AbortController>>({});
  const threadsRef = useRef<ApiChatThread[]>([]);
  const threadInitRef = useRef<{ characterId: string; promise: Promise<ApiChatThread> } | null>(null);
  const threadLoadInFlightRef = useRef(false);
  const messageLoadVersionsRef = useRef<Record<string, number>>({});
  const pendingUserMessagesRef = useRef<Record<string, ChatMessage>>({});
  const generationStatesRef = useRef<Record<string, CharacterGenerationState>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPollRef = useRef(0);
  const audioCacheRef = useRef<Record<string, { audioUrl: string }>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const keepPinnedToBottomRef = useRef(true);
  const scrollThreadIdRef = useRef<string | null>(null);
  const imageLoadVersionsRef = useRef<Record<string, number>>({});
  const refreshedImageGalleryJobsRef = useRef(new Set<string>());
  const warmedThreadIdsRef = useRef(new Set<string>());
  const previewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  const stoppingGenerationRef = useRef(new Set<string>());
  const activeCharacterIdRef = useRef<string | null>(null);
  const timelineCacheRef = useRef<Record<string, { messages: ChatMessage[]; imageJobs: ApiGenerationJob[] }>>({});
  const timelineSyncedRef = useRef<Record<string, boolean>>({});
  activeThreadIdRef.current = activeThread?.id || null;

  useEffect(() => { localStorage.setItem('soulmingle_chat_bg_map_v2', JSON.stringify(chatBgMap)); }, [chatBgMap]);

  const cacheTimeline = useCallback((threadId: string, nextMessages: ChatMessage[], nextImageJobs: ApiGenerationJob[]) => {
    timelineCacheRef.current[threadId] = { messages: nextMessages, imageJobs: nextImageJobs };
    if (cacheUserId) void writeCachedTimeline(cacheUserId, threadId, nextMessages, nextImageJobs);
  }, [cacheUserId]);

  useEffect(() => {
    const desktopLayout = window.matchMedia('(min-width: 1280px)');
    const syncLayout = () => {
      setShowDetailDrawer(desktopLayout.matches);
    };
    desktopLayout.addEventListener('change', syncLayout);
    return () => desktopLayout.removeEventListener('change', syncLayout);
  }, []);

  useEffect(() => {
    if (!isActive || !showDetailDrawer || window.matchMedia('(min-width: 1280px)').matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isActive, showDetailDrawer]);

  useEffect(() => {
    if (!isActive || !previewImage) return;
    const previousOverflow = document.body.style.overflow;
    const closePreview = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewImage(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closePreview);
    window.requestAnimationFrame(() => previewCloseButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closePreview);
      previewTriggerRef.current?.focus();
    };
  }, [isActive, previewImage]);

  useEffect(() => {
    if (!isAppNavigationOpen) return;
    setShowDetailDrawer(false);
    setShowBgSelector(false);
  }, [isAppNavigationOpen]);

  const characterForThread = (thread: ApiChatThread): Character => {
    const known = characters.find((character) => character.id === thread.character.id);
    if (known) return {
      ...known,
      source: thread.character.source || known.source,
      chatCount: thread.character.chatCount ?? known.chatCount,
    };
    return {
      id: thread.character.id, name: thread.character.name, age: null, subtitle: '', description: '',
      avatar: thread.character.imageUrl || '', author: '—', likes: 0, chatCount: thread.character.chatCount ?? 0, commentCount: 0, tags: [], gender: null,
      artStyle: null, category: '', systemInstruction: '', greeting: '', voiceStyle: thread.voice.name,
      isFavorite: false, photos: [], videos: [], scenarios: [], source: thread.character.source || 'api', galleryLoaded: false,
    };
  };
  const chattedCharacters = useMemo(() => threads.map(characterForThread), [threads, characters]);
  const selectedDetailCharacter = selectedCharacter?.source === 'api' || selectedCharacter?.source === 'created' ? selectedCharacter : null;
  const detailCharacter = selectedDetailCharacter || (!selectedCharacter ? chattedCharacters[0] : null);
  const activeThreadCharacter = activeThread
    ? chattedCharacters.find((character) => character.id === activeThread.character.id)
    : null;
  const targetCharacterId = selectedDetailCharacter?.id || activeThread?.character.id || null;
  const matchingResolvedCharacter = resolvedCharacter?.id === targetCharacterId ? resolvedCharacter : null;
  const activeCharacter = useMemo(() => matchingResolvedCharacter
    ? {
      ...matchingResolvedCharacter,
      isFavorite: detailCharacter?.isFavorite ?? matchingResolvedCharacter.isFavorite,
      likes: detailCharacter?.likes ?? matchingResolvedCharacter.likes,
      chatCount: activeThreadCharacter?.chatCount ?? matchingResolvedCharacter.chatCount,
      commentCount: detailCharacter?.galleryLoaded ? detailCharacter.commentCount : matchingResolvedCharacter.commentCount,
    }
    : selectedDetailCharacter || activeThreadCharacter || chattedCharacters[0] || null, [
      activeThreadCharacter,
      chattedCharacters,
      detailCharacter?.commentCount,
      detailCharacter?.galleryLoaded,
      detailCharacter?.isFavorite,
      detailCharacter?.likes,
      matchingResolvedCharacter,
      selectedDetailCharacter,
    ]);
  const activeChatBg = activeCharacter ? (chatBgMap[activeCharacter.id] || activeCharacter.avatar) : '';
  const selectedChatCharacterId = selectedDetailCharacter?.id || activeCharacter?.id || null;
  activeCharacterIdRef.current = selectedChatCharacterId;

  useEffect(() => {
    if (!cacheUserId || !activeCharacter || !activeChatBg) return;
    const characterId = activeCharacter.id;
    const backgroundUrl = activeChatBg;
    let active = true;
    void preloadChatBackground(cacheUserId, characterId, backgroundUrl).then((loaded) => {
      if (active && loaded) {
        setLoadedChatBgs((current) => current[characterId] === backgroundUrl
          ? current
          : { ...current, [characterId]: backgroundUrl });
      }
    });
    return () => { active = false; };
  }, [activeCharacter?.id, activeChatBg, cacheUserId]);

  const activeChatFallback = activeCharacter?.avatarThumbnailLarge || activeCharacter?.avatar || '';
  const loadedChatBg = activeCharacter && loadedChatBgs[activeCharacter.id] === activeChatBg
    ? loadedChatBgs[activeCharacter.id]
    : '';
  const renderedChatBg = activeCharacter
    ? loadedChatBg || activeChatBg || activeChatFallback
    : '';

  const setGenerationState = useCallback((characterId: string, patch: Partial<CharacterGenerationState>) => {
    const next = {
      ...generationStatesRef.current,
      [characterId]: { ...characterGenerationState(generationStatesRef.current, characterId), ...patch },
    };
    generationStatesRef.current = next;
    setGenerationStates(next);
  }, []);

  useEffect(() => {
    const phoneLayout = window.matchMedia('(max-width: 767px)');
    const syncLayout = () => {
      setIsPhoneViewport(phoneLayout.matches);
    };
    syncLayout();
    phoneLayout.addEventListener('change', syncLayout);
    return () => phoneLayout.removeEventListener('change', syncLayout);
  }, []);

  const setError = useCallback((value: string | null, characterId = activeCharacterIdRef.current) => {
    if (characterId) setGenerationState(characterId, { error: value });
    else setThreadError(value);
  }, [setGenerationState]);

  const setInputMessage = useCallback((value: React.SetStateAction<string>, characterId = activeCharacterIdRef.current) => {
    if (!characterId) return;
    setInputMessages((current) => {
      const previous = current[characterId] || '';
      const next = typeof value === 'function' ? value(previous) : value;
      return next === previous ? current : { ...current, [characterId]: next };
    });
  }, []);

  const activeGeneration = characterGenerationState(generationStates, selectedChatCharacterId);
  const isLoading = activeGeneration.isLoading;
  const generationPhase = activeGeneration.phase;
  const activeAssistantMessageId = activeGeneration.assistantMessageId;
  const regeneratingMessageId = activeGeneration.regeneratingMessageId;
  const error = activeGeneration.error || threadError;
  const inputMessage = selectedChatCharacterId ? inputMessages[selectedChatCharacterId] || '' : '';

  const showTimeline = useCallback((threadId: string, nextMessages: ChatMessage[], nextImageJobs: ApiGenerationJob[]) => {
    timelineCacheRef.current[threadId] = { messages: nextMessages, imageJobs: nextImageJobs };
    if (activeThreadIdRef.current !== threadId) return;
    setVisibleTimelineThreadId(threadId);
    setMessages(nextMessages);
    setImageJobs(nextImageJobs);
  }, []);

  const activateThread = useCallback((thread: ApiChatThread) => {
    const previousThreadId = activeThreadIdRef.current;
    activeThreadIdRef.current = thread.id;
    setActiveThread(thread);
    timelineSyncedRef.current[thread.id] = false;
    setTimelineSynced((current) => ({ ...current, [thread.id]: false }));
    const cached = timelineCacheRef.current[thread.id];
    if (cached) showTimeline(thread.id, cached.messages, cached.imageJobs);
    else if (
      thread.messageCount === 1
      && thread.lastMessage?.role === 'assistant'
      && thread.lastMessage.status === 'complete'
    ) {
      setVisibleTimelineThreadId(thread.id);
      setMessages([uiMessage(thread.lastMessage, locale)]);
      setImageJobs([]);
    } else if (previousThreadId !== thread.id) setVisibleTimelineThreadId(null);
    if (!cacheUserId || cached) return;
    void readCachedTimeline(cacheUserId, thread.id).then((snapshot) => {
      if (!snapshot || activeThreadIdRef.current !== thread.id || timelineCacheRef.current[thread.id]) return;
      showTimeline(thread.id, snapshot.messages, snapshot.imageJobs);
    }).catch(() => undefined);
  }, [cacheUserId, locale, showTimeline]);

  const abortAllStreams = useCallback(() => {
    (Object.values(streamControllersRef.current) as AbortController[]).forEach((controller) => controller.abort());
    streamControllersRef.current = {};
    pendingUserMessagesRef.current = {};
    stoppingGenerationRef.current.clear();
  }, []);

  useEffect(() => { threadsRef.current = threads; }, [threads]);

  const publishThreads = (nextThreads: ApiChatThread[]) => {
    threadsRef.current = nextThreads;
    setThreads(nextThreads);
    onThreadListChange?.(nextThreads);
  };

  useEffect(() => {
    if (!initialThreadsReady) return;
    threadsRef.current = initialThreads;
    setThreads(initialThreads);
    setThreadLoading(false);
  }, [initialThreadsReady, initialThreads]);

  useEffect(() => {
    setThreadError(initialThreadsError);
  }, [initialThreadsError]);

  const ensureThread = (characterId: string) => {
    const existing = threadsRef.current.find((thread) => thread.character.id === characterId);
    if (existing) return Promise.resolve(existing);
    if (threadInitRef.current?.characterId === characterId) return threadInitRef.current.promise;
    const promise = api.chat.threads.create(characterId).then((thread) => {
      const nextThreads = [thread, ...threadsRef.current.filter((item) => item.id !== thread.id)];
      publishThreads(nextThreads);
      return thread;
    }).finally(() => {
      if (threadInitRef.current?.promise === promise) threadInitRef.current = null;
    });
    threadInitRef.current = { characterId, promise };
    return promise;
  };

  const loadThreads = async (errorCharacterId?: string) => {
    if (threadLoadInFlightRef.current) return;
    threadLoadInFlightRef.current = true;
    try {
      const all: ApiChatThread[] = [];
      let cursor: string | undefined;
      do {
        const page = await api.chat.threads.list(cursor, 100);
        all.push(...page.items);
        cursor = page.nextCursor || undefined;
        if (!page.hasMore) break;
      } while (cursor);
      publishThreads(all);
      setThreadError(null);
      if (errorCharacterId) setError(null, errorCharacterId);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'chat.errorHistory'), errorCharacterId);
    } finally {
      threadLoadInFlightRef.current = false;
    }
  };

  const loadMessages = async (threadId: string, excludedMessageId?: string | null, commit = true) => {
    const loadId = (messageLoadVersionsRef.current[threadId] || 0) + 1;
    messageLoadVersionsRef.current[threadId] = loadId;
    const pages: ApiChatMessage[][] = [];
    let cursor: string | undefined;
    do {
      const page = !cursor && cacheUserId
        ? await getChatPrefetch(cacheUserId, threadsRef.current.find((thread) => thread.id === threadId)!).messages
        : await api.chat.threads.messages(threadId, cursor, 100);
      pages.unshift(page.items); cursor = page.nextCursor || undefined;
      if (!page.hasMore) break;
    } while (cursor);
    const characterId = threadsRef.current.find((thread) => thread.id === threadId)?.character.id;
    const loadedMessages = pages.flat()
      .map((message) => uiMessage(message, locale))
      .filter((message) => message.id !== excludedMessageId);
    if (
      commit &&
      shouldApplyThreadLoad(activeThreadIdRef.current, threadId, loadId, messageLoadVersionsRef.current[threadId])
      && shouldApplyCharacterUpdate(activeCharacterIdRef.current, characterId)
    ) {
      const pendingMessage = characterId ? pendingUserMessagesRef.current[characterId] : undefined;
      setVisibleTimelineThreadId(threadId);
      setMessages(
        pendingMessage && !loadedMessages.some((message) => message.id === pendingMessage.id)
          ? [...loadedMessages, pendingMessage]
          : loadedMessages,
      );
    }
    const imageJobsToCache = timelineCacheRef.current[threadId]?.imageJobs || [];
    cacheTimeline(threadId, loadedMessages, imageJobsToCache);
    return { items: loadedMessages, loadId };
  };

  const loadImageJobs = async (threadId: string, commit = true) => {
    const loadId = (imageLoadVersionsRef.current[threadId] || 0) + 1;
    imageLoadVersionsRef.current[threadId] = loadId;
    const page = await api.generation.jobs.list({ mode: 'image', threadId, page: 1, pageSize: 20 });
    const characterId = threadsRef.current.find((thread) => thread.id === threadId)?.character.id;
    const loadedJobs = page.items.filter((job) => job.chatThreadId === threadId);
    if (
      commit &&
      shouldApplyThreadLoad(activeThreadIdRef.current, threadId, loadId, imageLoadVersionsRef.current[threadId])
      && shouldApplyCharacterUpdate(activeCharacterIdRef.current, characterId)
    ) {
      setVisibleTimelineThreadId(threadId);
      setImageJobs(loadedJobs);
    }
    const messagesToCache = timelineCacheRef.current[threadId]?.messages || [];
    cacheTimeline(threadId, messagesToCache, loadedJobs);
    return { items: loadedJobs, loadId };
  };

  const loadThreadTimeline = async (threadId: string, excludedMessageId?: string | null) => {
    timelineSyncedRef.current[threadId] = false;
    setTimelineSynced((current) => ({ ...current, [threadId]: false }));
    const thread = threadsRef.current.find((item) => item.id === threadId);
    const hasOpeningMessage = !timelineCacheRef.current[threadId]
      && thread?.messageCount === 1
      && thread.lastMessage?.role === 'assistant'
      && thread.lastMessage.status === 'complete';
    if (hasOpeningMessage) {
      timelineSyncedRef.current[threadId] = true;
      setTimelineSynced((current) => ({ ...current, [threadId]: true }));
    }
    const messagesPromise = loadMessages(threadId, excludedMessageId, true);
    const imageJobsPromise = loadImageJobs(threadId, true);
    await Promise.all([messagesPromise, imageJobsPromise]);
    timelineSyncedRef.current[threadId] = true;
    setTimelineSynced((current) => ({ ...current, [threadId]: true }));
  };

  const pendingImageJobIds = imageJobs
    .filter((job) => job.status === 'queued' || job.status === 'processing')
    .map((job) => job.id)
    .join(',');
  const imageBusy = shouldShowImageGeneration(imageLoading, imageJobs);
  const activeTimelineReady = Boolean(activeThread && timelineSynced[activeThread.id]);
  const timeline = useMemo(
    () => visibleTimelineThreadId === activeThread?.id
      ? buildChatTimeline(messages, imageJobs, imageLoading, imageLoadingCreatedAt)
      : [],
    [activeThread?.id, messages, imageJobs, imageLoading, imageLoadingCreatedAt, visibleTimelineThreadId],
  );
  const timelineTailKey = useMemo(() => chatTimelineTailKey(timeline), [timeline]);

  useEffect(() => {
    const threadId = activeThread?.id;
    if (!threadId || !pendingImageJobIds) return;
    const jobIds = pendingImageJobIds.split(',');
    return generationPolling.subscribe(
      jobIds,
      (job) => {
        if (job.chatThreadId !== threadId) return;
        setImageJobs((current) => {
          const next = current.map((item) => item.id === job.id ? job : item);
          cacheTimeline(threadId, timelineCacheRef.current[threadId]?.messages || [], next);
          return next;
        });
        if (job.status !== 'complete' || !job.outputs?.length || refreshedImageGalleryJobsRef.current.has(job.id)) return;
        refreshedImageGalleryJobsRef.current.add(job.id);
        const detail = job.createdCharacterId
          ? api.createdCharacters.get(job.createdCharacterId)
          : api.characters.get(job.characterId || activeThread.character.id);
        void detail
          .then((character) => { if (activeThreadIdRef.current === threadId) setResolvedCharacter(character); })
          .catch(() => { refreshedImageGalleryJobsRef.current.delete(job.id); });
      },
      (jobId) => {
        setImageJobs((current) => {
          const next = current.map((item) => item.id === jobId ? {
            ...item,
            status: 'failed' as const,
            failureCode: 'GENERATION_NOT_FOUND',
            failureMessage: null,
            completedAt: new Date().toISOString(),
          } : item);
          cacheTimeline(threadId, timelineCacheRef.current[threadId]?.messages || [], next);
          return next;
        });
        setError(t('chat.imageError'), activeThread.character.id);
      },
    );
  }, [activeThread?.id, pendingImageJobIds, cacheTimeline]);

  useEffect(() => {
    const threadId = activeThread?.id;
    if (!threadId || warmedThreadIdsRef.current.has(threadId)) return;
    warmedThreadIdsRef.current.add(threadId);
    void api.chat.threads.warmup(threadId).catch(() => undefined);
  }, [activeThread?.id]);

  useEffect(() => {
    if (isAuthenticated === false) {
      abortAllStreams();
      setThreads([]);
      threadsRef.current = [];
      setActiveThread(null);
      activeThreadIdRef.current = null;
      setResolvedCharacter(null);
      setLoadedChatBgs({});
      setMessages([]);
      setVisibleTimelineThreadId(null);
      setInputMessages({});
      setImageMode(false);
      setImageJobs([]);
      timelineCacheRef.current = {};
      timelineSyncedRef.current = {};
      setTimelineSynced({});
      imageLoadVersionsRef.current = {};
      setImageLoading(false);
      setImageLoadingCreatedAt('');
      setRetryingImageJobId(null);
      generationStatesRef.current = {};
      setGenerationStates({});
      setThreadError(null);
      setPlayingAudioId(null);
      setLoadingAudioId(null);
      setPreviewVoiceId(null);
      setPreviewLoadingVoiceId(null);
      setVoiceSyncing(false);
      setVoiceSyncError(null);
      audioCacheRef.current = {};
      setThreadLoading(false);
      warmedThreadIdsRef.current.clear();
      return () => { abortAllStreams(); audioRef.current?.pause(); audioRef.current = null; audioPollRef.current += 1; };
    }
    return () => { abortAllStreams(); audioRef.current?.pause(); audioRef.current = null; audioPollRef.current += 1; };
  }, [abortAllStreams, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated === false) return;
    setThreadLoading(!initialThreadsReady || initialThreadsLoading);
  }, [isAuthenticated, initialThreadsReady, initialThreadsLoading]);

  useEffect(() => {
    if (selectedCharacter || !threads[0]) return;
    let cancelled = false;
    const thread = threads[0];
    activateThread(thread);
    void loadThreadTimeline(thread.id).catch((reason) => {
      if (!cancelled) setError(userErrorMessage(reason, t, 'chat.errorMessages'), thread.character.id);
    });
    return () => { cancelled = true; };
  }, [selectedCharacter?.id, threads[0]?.id]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!detailCharacter) {
      setResolvedCharacter(null);
      return () => { active = false; controller.abort(); };
    }
    const characterId = detailCharacter.id;
    const source = detailCharacter.source === 'created' ? 'created' : 'api';
    setResolvedCharacter((current) => current?.id === characterId && current.source === source ? current : null);
    if (detailCharacter.galleryLoaded) {
      return () => { active = false; controller.abort(); };
    }
    const thread = threadsRef.current.find((item) => item.character.id === characterId);
    const request = thread && cacheUserId
      ? getChatPrefetch(cacheUserId, thread).character
      : source === 'created'
        ? api.createdCharacters.get(characterId, controller.signal)
        : api.characters.get(characterId, controller.signal);
    void request
      .then((detail) => { if (active && !controller.signal.aborted) setResolvedCharacter(detail); })
      .catch((reason) => {
        if (active && !controller.signal.aborted && !(reason instanceof ApiError && reason.status === 404)) {
          setError(userErrorMessage(reason, t, 'chat.errorCharacterDetails'), characterId);
        }
      });
    return () => { active = false; controller.abort(); };
  }, [detailCharacter?.id, detailCharacter?.source, detailCharacter?.galleryLoaded]);

  const handleDetailCommentCountChange = useCallback((characterId: string, count: number) => {
    setResolvedCharacter((current) => current?.id === characterId ? { ...current, commentCount: count } : current);
    onCommentCountChange(characterId, count);
  }, [onCommentCountChange]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedCharacter) return () => { cancelled = true; };
    if (selectedCharacter.source !== 'api' && selectedCharacter.source !== 'created' && threadsRef.current.length > 0) {
      const fallbackThread = threadsRef.current[0];
      setError(null, fallbackThread.character.id);
      activateThread(fallbackThread);
      void loadThreadTimeline(fallbackThread.id).catch((reason) => {
        if (!cancelled) setError(userErrorMessage(reason, t, 'chat.errorMessages'), fallbackThread.character.id);
      });
      return () => { cancelled = true; };
    }
    if (selectedCharacter.source !== 'api' && selectedCharacter.source !== 'created') { setActiveThread(null); activeThreadIdRef.current = null; setMessages([]); setThreadError(t('chat.disabled')); return () => { cancelled = true; }; }
    if (isAuthenticated === false) return () => { cancelled = true; };
    void ensureThread(selectedCharacter.id).then(async (thread) => {
      if (cancelled) return;
      activateThread(thread);
      await loadThreadTimeline(thread.id);
    }).catch((reason) => {
      if (cancelled) return;
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'errors.chatLoad'), selectedCharacter.id);
    });
    return () => { cancelled = true; audioRef.current?.pause(); audioRef.current = null; audioPollRef.current += 1; setPlayingAudioId(null); setLoadingAudioId(null); setPreviewVoiceId(null); setPreviewLoadingVoiceId(null); setPreviewError(null); audioCacheRef.current = {}; };
  }, [selectedCharacter?.id, selectedCharacter?.source, isAuthenticated, threadLoading]);

  useLayoutEffect(() => {
    if (!isActive) return;
    const threadId = activeThread?.id || null;
    if (scrollThreadIdRef.current !== threadId) {
      scrollThreadIdRef.current = threadId;
      keepPinnedToBottomRef.current = true;
    }
    const container = messagesContainerRef.current;
    if (container && keepPinnedToBottomRef.current) scrollChatToBottom(container);
  }, [isActive, activeThread?.id, messages, timelineTailKey, isLoading]);

  useEffect(() => {
    if (!isActive) return;
    const container = messagesContainerRef.current;
    const content = timelineContentRef.current;
    if (!container || !content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (keepPinnedToBottomRef.current) scrollChatToBottom(container);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [isActive, activeThread?.id, threadLoading]);

  const handleMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    keepPinnedToBottomRef.current = isChatNearBottom(event.currentTarget);
  };

  const handleTimelineImageLoad = useCallback(() => {
    if (!isActive) return;
    const container = messagesContainerRef.current;
    if (container && keepPinnedToBottomRef.current) scrollChatToBottom(container);
  }, [isActive]);

  const runGeneration = async (mode: 'send' | 'regenerate' | 'continue', value?: string) => {
    if (!activeCharacter || activeCharacter.id !== activeCharacterIdRef.current) return;
    const characterId = activeCharacter.id;
    if (activeThread?.character.id === characterId && !timelineSyncedRef.current[activeThread.id]) return;
    if (characterGenerationState(generationStatesRef.current, characterId).isLoading) return;
    if (!isAuthenticated) { onRequireAuth?.(); return; }
    if (!membershipFeatureKeys.includes('unlimitedMessages') && walletBalance !== undefined && walletBalance < 1) {
      onOpenRechargeModal?.();
      return;
    }
    if (activeCharacter.source !== 'api' && activeCharacter.source !== 'created') {
      setError(t('chat.disabled'), characterId);
      return;
    }
    const isSend = mode === 'send';
    const content = isSend ? (value ?? inputMessage).trim() : '';
    if (isSend && !content) return;
    if (isSend && content.length > 8000) { setError(t('chat.messageTooLong'), characterId); return; }
    const submittedInput = isSend && value === undefined ? inputMessage : null;
    const pendingUserId = isSend ? `pending-user-${Date.now()}-${Math.random().toString(36).slice(2)}` : null;
    const pendingUserMessage: ChatMessage | null = isSend ? {
      id: pendingUserId as string,
      role: 'user',
      text: content,
      createdAt: new Date().toISOString(),
      timestamp: formatTime(new Date()),
      status: 'streaming',
      failureCode: null,
    } : null;
    keepPinnedToBottomRef.current = true;
    if (pendingUserMessage) {
      pendingUserMessagesRef.current[characterId] = pendingUserMessage;
      if (activeThread?.id) messageLoadVersionsRef.current[activeThread.id] = (messageLoadVersionsRef.current[activeThread.id] || 0) + 1;
      if (activeCharacterIdRef.current === characterId) {
        setMessages((prev) => [...prev.filter((message) => message.id !== pendingUserId), pendingUserMessage]);
      }
    }
    if (isSend && value === undefined) setInputMessage('', characterId);
    setError(null, characterId);
    setGenerationState(characterId, {
      isLoading: true,
      phase: 'thinking',
      assistantMessageId: null,
      regeneratingMessageId: mode === 'regenerate' ? value as string : null,
    });
    const controller = new AbortController();
    streamControllersRef.current[characterId] = controller;
    let thread = activeThread?.character.id === characterId ? activeThread : null;
    let serverAccepted = false;
    let acceptedAssistantMessageId: string | null = null;
    let replacedMessageId: string | null = mode === 'regenerate' ? (value as string) : null;
    const discardPendingMessage = (restoreInput: boolean) => {
      if (!pendingUserId) return;
      if (pendingUserMessagesRef.current[characterId]?.id === pendingUserId) delete pendingUserMessagesRef.current[characterId];
      if (activeThreadIdRef.current === thread?.id || (!thread && activeCharacterIdRef.current === characterId)) {
        setMessages((prev) => prev.filter((message) => message.id !== pendingUserId));
      }
      if (restoreInput && submittedInput !== null) setInputMessage((current) => current || submittedInput, characterId);
    };
    try {
      if (!thread) {
        thread = await ensureThread(characterId);
        if (controller.signal.aborted) {
          discardPendingMessage(true);
          return;
        }
        if (activeCharacterIdRef.current === characterId) {
          activateThread(thread);
          await loadThreadTimeline(thread.id);
        }
      }
      if (!thread) return;
      const streamThread = thread;
      const updateVisibleMessages = (updater: (current: ChatMessage[]) => ChatMessage[]) => {
        if (activeThreadIdRef.current === streamThread.id && shouldApplyCharacterUpdate(activeCharacterIdRef.current, characterId)) setMessages(updater);
      };
      let streamError = false;
      const streamOptions = {
        signal: controller.signal,
        onEvent: (event) => {
          if (streamControllersRef.current[characterId] !== controller) return;
          if (event.type === 'message.created') {
            serverAccepted = true;
            acceptedAssistantMessageId = event.assistantMessageId;
            replacedMessageId = event.replacedMessageId || replacedMessageId;
            if (pendingUserId && pendingUserMessagesRef.current[characterId]?.id === pendingUserId) delete pendingUserMessagesRef.current[characterId];
            messageLoadVersionsRef.current[streamThread.id] = (messageLoadVersionsRef.current[streamThread.id] || 0) + 1;
            setGenerationState(characterId, {
              assistantMessageId: event.assistantMessageId,
              regeneratingMessageId: mode === 'regenerate' ? event.assistantMessageId : null,
            });
            updateVisibleMessages((prev) => {
              let next = [...prev];
              if (event.userMessage) {
                const serverUserMessage = uiMessage(event.userMessage, locale);
                const pendingIndex = next.findIndex((message) => message.id === pendingUserId);
                const serverIndex = next.findIndex((message) => message.id === serverUserMessage.id);
                const insertionIndex = pendingIndex >= 0 ? pendingIndex : serverIndex >= 0 ? serverIndex : next.length;
                next = next.filter((message) => message.id !== pendingUserId && message.id !== serverUserMessage.id);
                next.splice(Math.min(insertionIndex, next.length), 0, serverUserMessage);
              }
              const createdAt = new Date().toISOString();
              const replacement: ChatMessage = { id: event.assistantMessageId, role: 'assistant', text: '', createdAt, timestamp: formatTime(new Date(createdAt)), status: 'streaming', failureCode: null };
              if (mode === 'regenerate' && replacedMessageId) return replaceChatMessageInPlace(next, replacedMessageId, replacement);
              return next.some((message) => message.id === event.assistantMessageId) ? next : [...next, replacement];
            });
          }
          else if (event.type === 'message.delta') {
            setGenerationState(characterId, {
              phase: phaseAfterDelta(characterGenerationState(generationStatesRef.current, characterId).phase, event.delta),
            });
            updateVisibleMessages((prev) => prev.map((item) => item.id === event.messageId ? { ...item, text: item.text + event.delta, status: 'streaming' } : item));
          }
          else if (event.type === 'message.completed') {
            if (mode === 'regenerate' && event.message.status !== 'complete') {
              streamError = true;
              setError(t('chat.regenerateEmptyError'), characterId);
              setGenerationState(characterId, { assistantMessageId: null });
              return;
            }
            updateVisibleMessages((prev) => {
              if (mode === 'regenerate' && replacedMessageId) {
                return replaceChatMessageInPlace(prev, replacedMessageId, uiMessage(event.message, locale));
              }
              const next = replacedMessageId ? prev.filter((item) => item.id !== replacedMessageId) : prev;
              return next.some((item) => item.id === event.message.id)
                ? next.map((item) => item.id === event.message.id ? uiMessage(event.message, locale) : item)
                : [...next, uiMessage(event.message, locale)];
            });
            setGenerationState(characterId, { phase: 'idle', assistantMessageId: null, regeneratingMessageId: null });
          }
          else {
            streamError = true;
            setError(mode === 'regenerate'
              ? t('chat.regenerateEmptyError')
              : userErrorCodeMessage(event.code, t, mode === 'continue' ? 'chat.continueError' : 'chat.errorSend'), characterId);
            setGenerationState(characterId, { phase: 'idle', assistantMessageId: null, regeneratingMessageId: null });
          }
        },
      };
      const stream = mode === 'send'
        ? await api.chat.threads.stream(streamThread.id, content, streamOptions)
        : mode === 'regenerate'
          ? await api.chat.threads.regenerate(streamThread.id, value as string, streamOptions)
          : await api.chat.threads.continue(streamThread.id, value as string, streamOptions);
      if (!serverAccepted) {
        if (isSend) discardPendingMessage(false);
        await loadMessages(streamThread.id, mode === 'regenerate' ? acceptedAssistantMessageId : null);
        setError(mode === 'regenerate' ? t('chat.regenerateEmptyError') : t('chat.incomplete'), characterId);
      } else if (!stream.terminal || streamError) {
        await loadMessages(streamThread.id, mode === 'regenerate' ? acceptedAssistantMessageId : null);
        if (mode === 'regenerate') setError(t('chat.regenerateEmptyError'), characterId);
      }
      if (mode === 'regenerate') {
        setGenerationState(characterId, { phase: 'idle', regeneratingMessageId: null });
      }
      await loadThreads(characterId);
    } catch (reason) {
      if (!serverAccepted && isSend) discardPendingMessage(true);
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
        else setError(mode === 'regenerate'
          ? t('chat.regenerateEmptyError')
          : userErrorMessage(reason, t, mode === 'continue' ? 'chat.continueError' : 'chat.errorSend'), characterId);
        if (thread) await loadMessages(thread.id, mode === 'regenerate' ? acceptedAssistantMessageId : null).catch(() => undefined);
      }
      if (mode === 'regenerate' && !stoppingGenerationRef.current.has(characterId)) {
        setGenerationState(characterId, { phase: 'idle', regeneratingMessageId: null });
      }
    } finally {
      if (streamControllersRef.current[characterId] === controller) {
        delete streamControllersRef.current[characterId];
        setGenerationState(characterId, {
          isLoading: false,
          phase: 'idle',
          assistantMessageId: null,
          regeneratingMessageId: null,
        });
      }
    }
  };

  const sendMessage = async (preset?: string) => runGeneration('send', preset);
  const regenerateMessage = async (messageId: string) => runGeneration('regenerate', messageId);
  const continueMessage = async (messageId: string) => runGeneration('continue', messageId);

  const generateChatImage = async () => {
    if (imageBusy || isLoading || !activeCharacter || activeCharacter.id !== activeCharacterIdRef.current) return;
    const characterId = activeCharacter.id;
    if (activeThread?.character.id === characterId && !timelineSyncedRef.current[activeThread.id]) return;
    if (!isAuthenticated) { onRequireAuth?.(); return; }
    if (activeCharacter.source !== 'api' && activeCharacter.source !== 'created') { setError(t('chat.disabled'), characterId); return; }
    if ((freeChatImagesRemaining ?? 0) < 1 && walletBalance !== undefined && walletBalance < 10) {
      onOpenRechargeModal?.();
      return;
    }
    setError(null, characterId);
    setImageLoadingCreatedAt(new Date().toISOString());
    setImageLoading(true);
    try {
      const thread = activeThread?.character.id === characterId ? activeThread : await ensureThread(characterId);
      if (activeThreadIdRef.current !== thread.id && activeCharacterIdRef.current === characterId) {
        activateThread(thread);
        await loadThreadTimeline(thread.id);
      }
      const job = await api.chat.threads.createImage(thread.id, {
        prompt: inputMessage.trim(),
        aspectRatio: '3:4',
        count: 1,
      });
      setInputMessage('', characterId);
      if (activeThreadIdRef.current === thread.id) {
        setImageJobs((current) => {
          const next = [job, ...current.filter((item) => item.id !== job.id)];
          cacheTimeline(thread.id, timelineCacheRef.current[thread.id]?.messages || [], next);
          return next;
        });
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'chat.imageError'), characterId);
    } finally {
      setImageLoading(false);
      setImageLoadingCreatedAt('');
    }
  };

  const retryChatImage = async (job: ApiGenerationJob) => {
    if (imageBusy || isLoading || retryingImageJobId) return;
    const characterId = activeCharacter?.id;
    const threadId = activeThread?.id;
    if (!isAuthenticated) { onRequireAuth?.(); return; }
    setError(null, characterId);
    setRetryingImageJobId(job.id);
    try {
      const retryJob = await api.generation.jobs.retry(job.id);
      if (activeThreadIdRef.current === threadId) {
        setImageJobs((current) => {
          const next = [retryJob, ...current.filter((item) => item.id !== retryJob.id)];
          cacheTimeline(threadId, timelineCacheRef.current[threadId]?.messages || [], next);
          return next;
        });
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'chat.imageRetryError'), characterId);
    } finally {
      setRetryingImageJobId(null);
    }
  };

  const stopGeneration = async () => {
    if (!activeCharacter) return;
    const characterId = activeCharacter.id;
    const state = characterGenerationState(generationStatesRef.current, characterId);
    const controller = streamControllersRef.current[characterId];
    if (!activeThread || !state.assistantMessageId) {
      stoppingGenerationRef.current.add(characterId);
      controller?.abort();
      if (streamControllersRef.current[characterId] === controller) delete streamControllersRef.current[characterId];
      if (state.regeneratingMessageId) setError(t('chat.regenerateEmptyError'), characterId);
      setGenerationState(characterId, {
        isLoading: false,
        phase: 'idle',
        assistantMessageId: null,
        regeneratingMessageId: null,
      });
      stoppingGenerationRef.current.delete(characterId);
      return;
    }
    const canceledAssistantMessageId = state.assistantMessageId;
    const restoringRegeneration = Boolean(state.regeneratingMessageId);
    stoppingGenerationRef.current.add(characterId);
    try {
      await api.chat.threads.cancel(activeThread.id, state.assistantMessageId);
    } catch (reason) {
      if (!(reason instanceof ApiError && reason.code === 'MESSAGE_NOT_ACTIVE')) {
        setError(userErrorMessage(reason, t, 'chat.errorStop'), characterId);
      }
    } finally {
      controller?.abort();
      if (streamControllersRef.current[characterId] === controller) delete streamControllersRef.current[characterId];
      await loadMessages(activeThread.id, state.regeneratingMessageId ? canceledAssistantMessageId : null).catch(() => undefined);
      if (restoringRegeneration) {
        setError(t('chat.regenerateEmptyError'), characterId);
      }
      setGenerationState(characterId, {
        isLoading: false,
        phase: 'idle',
        assistantMessageId: null,
        regeneratingMessageId: null,
      });
      await loadThreads(characterId).catch(() => undefined);
      stoppingGenerationRef.current.delete(characterId);
    }
  };

  const stopAudio = useCallback(() => {
    audioPollRef.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingAudioId(null);
    setLoadingAudioId(null);
    setPreviewVoiceId(null);
    setPreviewLoadingVoiceId(null);
  }, []);

  useEffect(() => {
    if (isActive) return;
    stopAudio();
    setPreviewError(null);
    setShowBgSelector(false);
    previewTriggerRef.current = null;
    setPreviewImage(null);
    if (!window.matchMedia('(min-width: 1280px)').matches) setShowDetailDrawer(false);
  }, [isActive]);

  useEffect(() => {
    const thread = activeThread;
    if (!thread) {
      setVoiceSyncing(false);
      setVoiceSyncError(null);
      return;
    }
    let active = true;
    setVoiceSyncing(true);
    setVoiceSyncError(null);
    void api.chat.voices(thread.id).then(async (catalog) => {
      const defaultVoiceId = catalog.voices[0]?.voiceId || catalog.defaultVoiceId;
      if (!active || activeThreadIdRef.current !== thread.id || !defaultVoiceId) return;
      if (thread.voice.voiceId === defaultVoiceId) return;
      const updatedThread = await api.chat.threads.setVoice(thread.id, defaultVoiceId);
      if (!active || activeThreadIdRef.current !== thread.id) return;
      setActiveThread(updatedThread);
      publishThreads(threadsRef.current.map((item) => item.id === updatedThread.id ? updatedThread : item));
      stopAudio();
    }).catch((reason) => {
      if (active && activeThreadIdRef.current === thread.id) {
        setVoiceSyncError(userErrorMessage(reason, t, 'panel.voiceUnavailable'));
      }
    }).finally(() => {
      if (active && activeThreadIdRef.current === thread.id) setVoiceSyncing(false);
    });
    return () => { active = false; };
  }, [activeThread?.id]);

  const playMessageAudio = (messageId: string) => {
    if (!activeThread) return;
    const message = messages.find((item) => item.id === messageId);
    if (!message || message.role !== 'assistant' || message.status !== 'complete' || !message.text.trim()) {
      setError(t('chat.readAloudUnavailable'));
      return;
    }
    if (playingAudioId === messageId) {
      stopAudio();
      return;
    }
    stopAudio();
    const pollToken = audioPollRef.current;
    const threadId = activeThread.id;
    const voiceId = activeThread.voice.voiceId;
    setError(null);
    setLoadingAudioId(messageId);
    void (async () => {
      const cacheKey = messageId + ':' + voiceId;
      try {
        let audio: Pick<ApiChatAudio, 'status' | 'audioUrl'> | undefined = audioCacheRef.current[cacheKey]
          ? { status: 'complete', audioUrl: audioCacheRef.current[cacheKey].audioUrl }
          : undefined;
        if (!audio) {
          try {
            audio = await api.chat.messages.audio.get(threadId, messageId);
          } catch (reason) {
            if (reason instanceof ApiError && reason.status === 404) audio = await api.chat.messages.audio.request(threadId, messageId);
            else throw reason;
          }
        }
        if (audio.status === 'failed') throw new ApiError('AUDIO_FAILED', t('chat.errorVoice'), 409);
        if (audio.status !== 'complete' || !audio.audioUrl) {
          for (let attempt = 0; attempt < 30; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 1000));
            if (audioPollRef.current !== pollToken) return;
            audio = await api.chat.messages.audio.get(threadId, messageId);
            if (audio.status === 'failed') throw new ApiError('AUDIO_FAILED', t('chat.errorVoice'), 409);
            if (audio.status === 'complete' && audio.audioUrl) break;
          }
        }
        if (!audio || audio.status !== 'complete' || !audio.audioUrl) throw new ApiError('AUDIO_PENDING', t('chat.voiceGenerating'), 409);
        if (audioPollRef.current !== pollToken) return;
        audioCacheRef.current[cacheKey] = { audioUrl: audio.audioUrl };
        const player = new Audio(audio.audioUrl);
        audioRef.current = player;
        setLoadingAudioId(null);
        setPlayingAudioId(messageId);
        player.onended = () => {
          if (audioPollRef.current !== pollToken) return;
          setPlayingAudioId(null);
        };
        player.onerror = () => {
          if (audioPollRef.current !== pollToken) return;
          setPlayingAudioId(null);
          setError(t('chat.voicePlayback'));
        };
        await player.play();
      } catch (reason) {
        if (audioPollRef.current !== pollToken) return;
        audioRef.current = null;
        setLoadingAudioId(null);
        setPlayingAudioId(null);
        setError(isAutoplayBlocked(reason) ? t('chat.voiceReady') : userErrorMessage(reason, t, 'chat.voiceRead'));
      }
    })();
  };

  const playVoice = (messageId: string) => {
    playMessageAudio(messageId);
  };

  const previewVoice = useCallback((voiceId: string, previewUrl: string) => {
    if (!activeThread || !activeCharacter) {
      setPreviewError(t('chat.noActive'));
      return;
    }
    if (previewVoiceId === voiceId) {
      stopAudio();
      return;
    }
    stopAudio();
    const pollToken = audioPollRef.current;
    setPreviewError(null);
    setPreviewLoadingVoiceId(voiceId);
    void (async () => {
      try {
        if (audioPollRef.current !== pollToken) return;
        const player = new Audio(previewUrl);
        player.preload = 'auto';
        audioRef.current = player;
        player.onended = () => {
          if (audioPollRef.current !== pollToken) return;
          setPreviewVoiceId(null);
        };
        player.onerror = () => {
          if (audioPollRef.current !== pollToken) return;
          setPreviewVoiceId(null);
          setPreviewError(t('chat.voicePlayback'));
        };
        await player.play();
        if (audioPollRef.current !== pollToken) return;
        setPreviewLoadingVoiceId(null);
        setPreviewVoiceId(voiceId);
      } catch (reason) {
        if (audioPollRef.current !== pollToken) return;
        audioRef.current = null;
        setPreviewLoadingVoiceId(null);
        setPreviewVoiceId(null);
        setPreviewError(isAutoplayBlocked(reason) ? t('chat.voiceReady') : userErrorMessage(reason, t, 'chat.voiceRead'));
      }
    })();
  }, [activeCharacter, activeThread, previewVoiceId, stopAudio, t]);

  useEffect(() => {
    stopAudio();
    setPreviewError(null);
    return () => {
      audioPollRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [activeThread?.id, activeThread?.voice.voiceId, activeCharacter?.id, activeCharacter?.name, locale]);

  const setBackground = useCallback((url: string) => {
    if (activeCharacter) setChatBgMap((prev) => ({ ...prev, [activeCharacter.id]: url }));
  }, [activeCharacter]);
  const resetBackground = useCallback(() => {
    if (activeCharacter) setChatBgMap((prev) => {
      const next = { ...prev };
      delete next[activeCharacter.id];
      return next;
    });
  }, [activeCharacter]);
  const abortGenerationForCharacter = async (characterId: string, thread: ApiChatThread) => {
    const state = characterGenerationState(generationStatesRef.current, characterId);
    const controller = streamControllersRef.current[characterId];
    if (!state.isLoading && !controller) return;
    stoppingGenerationRef.current.add(characterId);
    try {
      if (state.assistantMessageId) await api.chat.threads.cancel(thread.id, state.assistantMessageId);
    } catch (reason) {
      if (!(reason instanceof ApiError && reason.code === 'MESSAGE_NOT_ACTIVE')) {
        setError(userErrorMessage(reason, t, 'chat.errorStop'), characterId);
      }
    } finally {
      controller?.abort();
      if (streamControllersRef.current[characterId] === controller) delete streamControllersRef.current[characterId];
      delete pendingUserMessagesRef.current[characterId];
      setGenerationState(characterId, {
        isLoading: false,
        phase: 'idle',
        assistantMessageId: null,
        regeneratingMessageId: null,
      });
      stoppingGenerationRef.current.delete(characterId);
    }
  };
  const executeDelete = async () => {
    if (!deleteConfirmState) return;
    try {
      if (deleteConfirmState.type === 'clear_active_history') {
        if (!activeThread) {
          setDeleteConfirmState(null);
          return;
        }
        const characterId = activeThread.character.id;
        await abortGenerationForCharacter(characterId, activeThread);
        await api.chat.threads.clear(activeThread.id);
        delete timelineCacheRef.current[activeThread.id];
        if (cacheUserId) void removeCachedTimeline(cacheUserId, activeThread.id);
        if (activeThreadIdRef.current === activeThread.id) {
          setMessages([]);
          setImageJobs([]);
          setImageLoading(false);
          setImageLoadingCreatedAt('');
          setRetryingImageJobId(null);
        }
        await Promise.all([loadThreadTimeline(activeThread.id), loadThreads(characterId)]);
      } else {
        const targetThread = threads.find((thread) => thread.character.id === deleteConfirmState.characterId);
        if (!targetThread) {
          setDeleteConfirmState(null);
          return;
        }
        await abortGenerationForCharacter(targetThread.character.id, targetThread);
        await api.chat.threads.remove(targetThread.id);
        delete timelineCacheRef.current[targetThread.id];
        if (cacheUserId) void removeCachedTimeline(cacheUserId, targetThread.id);
        const nextThreads = threads.filter((thread) => thread.id !== targetThread.id);
        publishThreads(nextThreads);
        onDeleteChatHistory(targetThread.character.id);
        if (activeThread?.id === targetThread.id) {
          setActiveThread(null);
          activeThreadIdRef.current = null;
          setVisibleTimelineThreadId(null);
          setMessages([]);
          setImageJobs([]);
        }
        setInputMessages((current) => {
          const next = { ...current };
          delete next[targetThread.character.id];
          return next;
        });
      }
    } catch (reason) { setError(userErrorMessage(reason, t, 'chat.errorHistoryAction'), deleteConfirmState.characterId); }
    setDeleteConfirmState(null);
  };

  const renderAssistantText = (text: string) => parseRoleplayText(text).map((segment, index) => segment.type === 'narration'
    ? <span key={`${segment.type}-${index}`} className="italic text-rose-300">{segment.text}</span>
    : <span key={`${segment.type}-${index}`}>{segment.text}</span>);
  const prompts = useMemo(() => [t('chat.promptGreeting'), t('chat.promptDay'), t('chat.promptIntro'), t('chat.promptSecret')], [t]);
  const gallery = useMemo(() => [activeCharacter?.avatar || '', ...(activeCharacter?.photos || []).map((photo) => photo.url)].filter(Boolean).slice(0, 4), [activeCharacter]);
  const recentMap = useMemo(() => Object.fromEntries(threads.map((thread) => [thread.character.id, {
    characterId: thread.character.id,
    lastMessage: thread.lastMessage?.content || t('chat.noMessages'),
    lastTimestamp: formatTime(thread.updatedAt),
  }])), [formatTime, t, threads]);
  const handleDeleteRecentChat = useCallback((id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmState({ type: 'remove_recent_chat', characterId: id, characterName: name });
  }, []);
  const closeDetailDrawer = useCallback(() => setShowDetailDrawer(false), []);
  const handleVoiceChanged = useCallback((thread: ApiChatThread) => {
    setActiveThread(thread);
    const nextThreads = threads.map((item) => item.id === thread.id ? thread : item);
    setThreads(nextThreads);
    onThreadListChange?.(nextThreads);
    stopAudio();
    setPreviewError(null);
  }, [onThreadListChange, stopAudio, threads]);
  const renderAvatar = (className: string) => activeCharacter.avatar
    ? <img src={activeCharacter.avatar} alt={activeCharacter.name} className={className} />
    : <div className={`${className} bg-zinc-800 flex items-center justify-center`}><MessageSquare className="w-4 h-4 text-zinc-500" /></div>;
  const renderImagePending = (job: ApiGenerationJob | null) => {
    const stage = imageGenerationStage(job);
    const progress = imageGenerationProgress(job);
    const stageLabel = t(
      stage === 'preparing'
        ? 'chat.imagePreparing'
        : stage === 'saving'
          ? 'chat.imageSaving'
          : 'chat.imageCreating',
    );
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={stageLabel}
        className="relative ml-10 aspect-[3/4] w-1/4 overflow-hidden rounded-xl border border-zinc-700/80 bg-[#111119] shadow-lg shadow-black/35 sm:ml-12"
      >
        <div className="absolute inset-0 bg-[#111119]" />
        {activeCharacter.avatar ? (
          <div
            className="absolute inset-[-8%] bg-cover bg-center opacity-35 grayscale"
            style={{
              backgroundImage: `url(${activeCharacter.avatar})`,
              WebkitMaskImage: 'radial-gradient(circle, black 1px, transparent 1.7px)',
              WebkitMaskSize: '5px 5px',
              maskImage: 'radial-gradient(circle, black 1px, transparent 1.7px)',
              maskSize: '5px 5px',
            }}
          />
        ) : (
          <ImageIcon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-zinc-700" />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="chat-image-waiting-shimmer absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="chat-image-waiting-scan absolute inset-x-0 top-0 h-px bg-pink-300/70 shadow-[0_0_12px_rgba(244,114,182,0.65)]" />
        <div className="absolute inset-x-0 top-0 z-10 bg-black/45 p-2 backdrop-blur-[2px] sm:p-3">
          <div className="flex min-w-0 items-center gap-1.5">
            {renderAvatar('h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-pink-400/70 sm:h-6 sm:w-6')}
            <span className="min-w-0 truncate text-[9px] font-bold text-white sm:text-[11px]">{activeCharacter.name}</span>
          </div>
          <p className="mt-1 truncate text-[8px] text-zinc-300 sm:text-[10px]">{stageLabel}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 h-0.5 overflow-hidden bg-white/10">
          {progress == null ? (
            <div className="chat-image-waiting-progress h-full w-1/2 bg-pink-400" />
          ) : (
            <div className="h-full bg-pink-400 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
          )}
        </div>
      </div>
    );
  };
  const renderImageFailure = (job: ApiGenerationJob) => {
    const retrying = retryingImageJobId === job.id;
    const sensitive = job.failureCode === 'UPSTREAM_SENSITIVE_CONTENT';
    const retryLabel = t(retrying ? 'chat.imageRetrying' : 'chat.imageRetry');
    return (
      <div
        role="alert"
        className="relative ml-10 flex aspect-[3/4] w-1/4 flex-col items-center justify-center overflow-hidden rounded-xl border border-rose-500/35 bg-[#151116] p-2 text-center shadow-lg shadow-black/35 sm:ml-12 sm:p-3"
      >
        <ImageIcon className="mb-1.5 h-5 w-5 shrink-0 text-rose-300 sm:h-6 sm:w-6" aria-hidden="true" />
        <p className="text-[9px] font-bold leading-tight text-zinc-100 sm:text-[11px]">{t('chat.imageFailedTitle')}</p>
        <p className="mt-1 max-h-[4.5em] overflow-hidden text-[8px] leading-[1.15] text-zinc-400 sm:text-[10px]">
          {t(sensitive ? 'chat.imageSensitiveFailure' : 'chat.imageGenericFailure')}
        </p>
        <button
          type="button"
          onClick={() => void retryChatImage(job)}
          disabled={retrying || imageBusy || isLoading}
          title={retryLabel}
          aria-label={retryLabel}
          className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-200 transition-colors hover:border-pink-400 hover:text-pink-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>
    );
  };

  const deleteConfirmation = deleteConfirmState && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-700/80 bg-[#181826] p-5 text-center shadow-2xl">
        <Trash2 className="mx-auto h-6 w-6 text-rose-400" />
        <h3 className="text-base font-extrabold text-white">{deleteConfirmState.type === 'clear_active_history' ? t('chat.clearHistoryTitle') : t('chat.removeRecentTitle')}</h3>
        <p className="text-xs text-zinc-300">{t(deleteConfirmState.type === 'clear_active_history' ? 'chat.confirmClearText' : 'chat.confirmDeleteText', { name: deleteConfirmState.characterName })}</p>
        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => setDeleteConfirmState(null)} className="min-h-11 rounded-xl bg-zinc-800 px-5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">{t('common.cancel')}</button>
          <button type="button" onClick={() => void executeDelete()} className="min-h-11 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 text-xs font-extrabold text-white"><Trash2 className="mr-1 inline h-4 w-4" />{t('chat.confirm')}</button>
        </div>
      </div>
    </div>
  );

  if (isPhoneViewport && !selectedCharacter && !threadLoading) {
    return (
      <>
        <div className="mobile-chat-list-page flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0b0b0f] text-zinc-100">
          <ChattedListSidebar
            chattedCharacters={chattedCharacters}
            selectedCharacterId={null}
            recentChatsMap={recentMap}
            onSelectCharacter={onSelectCharacter}
            onDeleteChatHistory={handleDeleteRecentChat}
            onGoToExplore={onGoToExplore}
            onOpenCreateModal={onOpenCreateModal}
          />
        </div>
        {deleteConfirmation}
      </>
    );
  }

  if (threadLoading && !selectedCharacter) return <ChatLoadingShell label={t('chat.loadingHistory')} exploreLabel={t('chat.exploreLobby')} error={error} onGoToExplore={onGoToExplore} />;
  if (!activeCharacter) return <div className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-[#0b0b0f] p-6 text-center text-zinc-100 lg:rounded-3xl lg:p-8"><MessageSquare className="mb-4 h-12 w-12 text-zinc-500" /><h2 className="text-xl font-bold">{t('chat.noActive')}</h2><p className="mt-2 text-sm text-zinc-400">{error || t('chat.noActiveHint')}</p><button onClick={onGoToExplore} className="mt-6 min-h-11 rounded-xl bg-pink-500 px-6 font-bold text-white hover:bg-pink-600">{t('chat.exploreLobby')}</button></div>;
  if (selectedCharacter?.source !== 'api' && selectedCharacter?.source !== 'created' && threads.length === 0) return <div className="flex h-full min-h-0 w-full flex-col items-center justify-center bg-[#0b0b0f] p-6 text-center text-zinc-100 lg:rounded-3xl lg:p-8"><MessageSquare className="mb-4 h-12 w-12 text-zinc-500" /><h2 className="text-xl font-bold">{t('chat.unavailableTitle')}</h2><p className="mt-2 text-sm text-zinc-400">{t('chat.publicOnly')}</p><button onClick={onGoToExplore} className="mt-6 min-h-11 rounded-xl bg-pink-500 px-6 font-bold text-white hover:bg-pink-600">{t('chat.exploreLobby')}</button></div>;

  const ageLabel = activeCharacter.age == null ? '—' : `${activeCharacter.age}${t('create.ageUnit')}`;
  const lastAssistantMessageId = [...messages].reverse().find((message) => message.role === 'assistant' && message.status === 'complete' && message.text.trim())?.id || null;
  const renderChatList = (onClose?: () => void) => (
    <ChattedListSidebar
      chattedCharacters={chattedCharacters}
      selectedCharacterId={activeCharacter?.id || null}
      recentChatsMap={recentMap}
      onSelectCharacter={onSelectCharacter}
      onDeleteChatHistory={handleDeleteRecentChat}
      onGoToExplore={onGoToExplore}
      onOpenCreateModal={() => { onClose?.(); onOpenCreateModal(); }}
      onClose={onClose}
    />
  );

  const detailPanel = (
    <CharacterDetailPanel
      key={activeCharacter.id}
      character={activeCharacter}
      onClose={closeDetailDrawer}
      onOpenUpgradeModal={onOpenUpgradeModal}
      onOpenQuickUpgradeModal={onOpenQuickUpgradeModal}
      onSetChatBg={setBackground}
      activeChatBg={activeChatBg}
      threadId={activeThread?.id}
      currentVoiceId={activeThread?.voice.voiceId}
      onVoicePreview={previewVoice}
      previewVoiceId={previewVoiceId}
      previewLoadingVoiceId={previewLoadingVoiceId}
      previewError={previewError}
      voiceSyncing={voiceSyncing}
      voiceSyncError={voiceSyncError}
      isAuthenticated={Boolean(isAuthenticated)}
      membershipTier={membershipTier}
      membershipFeatureKeys={membershipFeatureKeys}
      onRequireAuth={onRequireAuth}
      onCommentCountChange={handleDetailCommentCountChange}
      onVoiceChanged={handleVoiceChanged}
    />
  );

  return (
    <div className="mio-chat-page r20-chat-page relative flex h-full min-h-0 w-full overflow-hidden bg-[#0b0b0f] text-zinc-100 lg:rounded-3xl lg:border lg:border-zinc-800/80 lg:shadow-2xl">
      {recentOpen&&<div className="r12-chat-rail hidden h-full min-h-0 md:block">{renderChatList(()=>setRecentOpen(false))}</div>}
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-cover bg-center transition-opacity duration-700 motion-reduce:transition-none" style={{ backgroundImage: renderedChatBg ? 'url(' + renderedChatBg + ')' : undefined, opacity: bgOpacity, filter: 'contrast(1.05) brightness(1.02)' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0b0f]/25 via-[#0b0b0f]/40 to-[#0b0b0f]/65" />

        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-1.5 border-b border-zinc-800 bg-[#13131b]/90 px-2 backdrop-blur-md sm:gap-2 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">{!isPhoneViewport&&!recentOpen&&<button aria-label={t('chat.recent')} onClick={()=>setRecentOpen(true)} className="r12-open-chats"><PanelLeftOpen size={20}/></button>}
            <button type="button" onClick={isPhoneViewport ? onBackToList : onGoToExplore} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white" aria-label={isPhoneViewport ? t('common.back') : t('chat.backExplore')}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => { setShowBgSelector(false); setShowDetailDrawer(true); }} className="group flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left sm:gap-3" aria-label={t('chat.openDetails')}>
              {renderAvatar('h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-pink-500/40 transition-all group-hover:ring-pink-500 sm:h-10 sm:w-10')}
              <span className="hidden min-w-0 flex-1 min-[390px]:block">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-extrabold text-white transition-colors group-hover:text-pink-300 sm:text-base">{activeCharacter.name}</span>
                  <span className="shrink-0 rounded border border-pink-500/30 bg-pink-950/60 px-1.5 py-0.5 text-[10px] font-bold text-pink-400">{ageLabel}</span>
                </span>
                <span className="block max-w-[140px] truncate text-[11px] font-normal text-zinc-400 sm:max-w-xs md:max-w-sm">{activeCharacter.subtitle || t('chat.session')}</span>
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setShowBgSelector(!showBgSelector)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/80 text-zinc-300 transition-all hover:text-white" aria-label={t('chat.selectBackground')}>
              <Wallpaper className="h-4 w-4 text-pink-400" />
            </button>
            <button type="button" onClick={(event) => onToggleFavorite(activeCharacter.id, event)} className={activeCharacter.isFavorite ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-500/40 bg-pink-500/20 text-pink-400 transition-colors' : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/80 text-zinc-400 transition-colors hover:text-white'} aria-label={activeCharacter.isFavorite ? t('chat.cancelFavorite') : t('chat.favorite')}>
              <Heart className={activeCharacter.isFavorite ? 'h-4 w-4 fill-pink-500' : 'h-4 w-4'} />
            </button>
            <button data-r20-clear-chat="true" type="button" onClick={() => setDeleteConfirmState({ type: 'clear_active_history', characterId: activeCharacter.id, characterName: activeCharacter.name })} disabled={imageLoading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/80 text-zinc-400 transition-colors hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50" aria-label={t('chat.clearHistory')}>
              <Trash2 className="h-4 w-4" />
            </button>
            {!showDetailDrawer && (
              <button type="button" onClick={() => setShowDetailDrawer(true)} className="hidden h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/80 text-zinc-400 transition-all hover:text-white xl:flex" aria-label={t('chat.openDetails')}>
                <PanelRightOpen className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {showBgSelector && (
          <div className="absolute left-3 right-3 top-16 z-40 rounded-2xl border border-zinc-700/80 bg-[#161622] p-3.5 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-80">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white"><Wallpaper className="h-4 w-4 text-pink-400" /><span>{t('chat.backgroundTitle')}</span></div>
              <button type="button" onClick={() => setShowBgSelector(false)} className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label={t('chat.closeBackground')}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">{gallery.map((url, index) => { const selected = activeChatBg === url; return <button type="button" key={url + index} onClick={() => setBackground(url)} aria-pressed={selected} className={`group relative overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${selected ? 'border-pink-500 ring-2 ring-pink-400/70' : 'border-zinc-800 hover:border-zinc-600'}`}><img src={url} alt={t('chat.backgroundOption')} className="aspect-[3/4] w-full object-cover" />{selected && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true"><Check className="h-3 w-3" /></span>}</button>; })}</div>
            <div className="mt-3 flex items-center gap-1.5">{[0.3, 0.55, 0.75, 0.95].map((opacity) => { const selected = bgOpacity === opacity; return <button type="button" key={opacity} onClick={() => setBgOpacity(opacity)} aria-pressed={selected} className={`min-h-11 flex-1 rounded-md border text-[10px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${selected ? 'border-pink-500 bg-pink-500/25 text-white ring-1 ring-pink-400/70' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}>{Math.round(opacity * 100)}%</button>; })}</div>
            <button type="button" onClick={resetBackground} className="mt-3 min-h-11 w-full rounded-xl border border-zinc-700/50 bg-zinc-800 px-3 text-xs font-bold text-zinc-300 hover:bg-zinc-700"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />{t('chat.resetBackground')}</button>
          </div>
        )}

        <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar sm:p-6">
          <div ref={timelineContentRef} className="space-y-4">
          <ChatCharacterIntro key={activeCharacter.id} character={activeCharacter} isAuthenticated={!!isAuthenticated} onRequireAuth={onRequireAuth} onUpgrade={onOpenUpgradeModal} onCreator={onOpenCreatorProfile}/>


          {timeline.map((item, itemIndex) => {
            if (item.type === 'image-pending') return <React.Fragment key="image-pending">{renderImagePending(item.job)}</React.Fragment>;
            if (item.type === 'image-failed') return <React.Fragment key={item.job.id}>{renderImageFailure(item.job)}</React.Fragment>;
            if (item.type === 'image') {
              const output = item.job.outputs[0];
              const isTimelineTail = itemIndex === timeline.length - 1;
              return <button key={item.job.id} type="button" onClick={(event) => { previewTriggerRef.current = event.currentTarget; setPreviewImage({ url: output.url, alt: activeCharacter.name }); }} className="relative ml-10 block aspect-[3/4] w-1/4 overflow-hidden rounded-xl text-left shadow-lg shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 sm:ml-12" title={t('chat.viewImage')} aria-label={t('chat.viewImage')}><RetryingChatImage src={output.url} alt={activeCharacter.name} className="absolute inset-0 block h-full w-full object-contain" framed loading={isTimelineTail ? 'eager' : 'lazy'} fetchPriority={isTimelineTail ? 'high' : 'auto'} onLoad={handleTimelineImageLoad} /></button>;
            }
            const message = item.message;
            const messageIndex = item.order;
            if (shouldShowRegenerationThinking(message.id, regeneratingMessageId, generationPhase)) {
              return <div key={message.id} className="flex max-w-md items-center gap-2 sm:gap-3">{renderAvatar('h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-pink-500/50 animate-pulse sm:h-9 sm:w-9')}<div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-zinc-800 bg-[#181822] px-4 py-3 text-xs text-zinc-300"><Sparkles className="h-4 w-4 animate-spin text-pink-400" /><span>{t('chat.thinking', { name: activeCharacter.name })}</span></div></div>;
            }
            if (!shouldRenderChatMessage(message)) return null;
            const user = message.role === 'user';
            const playing = playingAudioId === message.id;
            const audioLoading = loadingAudioId === message.id;
            const canReadAloud = !DESIGN_PREVIEW && canReadMessageAloud(message);
            const voiceActionLabel = audioLoading
              ? t('chat.voiceGenerating')
              : playing
                ? t('chat.stopReading')
                : t('chat.readAloud');
            const showMessageActions = !user
              && message.id === lastAssistantMessageId
              && message.status === 'complete'
              && messages.slice(0, messageIndex).some((item) => item.role === 'user');
            const messageBubble = (
              <div className={user ? 'r20-chat-bubble user group relative max-w-[calc(100%-2.5rem)] break-words rounded-2xl rounded-tr-none bg-gradient-to-r from-pink-600 to-rose-600 px-3.5 py-3 text-sm leading-relaxed text-white shadow-lg shadow-pink-900/20 sm:max-w-3xl sm:px-4' : 'r20-chat-bubble ai group relative min-w-0 max-w-[calc(100%-5.75rem)] break-words rounded-2xl rounded-tl-none border border-zinc-700/70 bg-[#161622]/95 px-3.5 py-3 text-sm leading-relaxed text-zinc-100 shadow-lg shadow-black/40 backdrop-blur-md sm:max-w-2xl sm:px-4'}>
                {!user && <div className="mb-1 border-b border-zinc-800/60 pb-1"><span className="block min-w-0 truncate text-[11px] font-bold text-pink-400">{activeCharacter.name}</span></div>}
                <div className="whitespace-pre-wrap break-words">{user ? message.text : renderAssistantText(message.text)}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    {showMessageActions && <>
                      <button type="button" onClick={() => void regenerateMessage(message.id)} disabled={isLoading} title={t('chat.regenerate')} aria-label={t('chat.regenerate')} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-pink-300 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => void continueMessage(message.id)} disabled={isLoading} title={t('chat.continue')} aria-label={t('chat.continue')} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-pink-300 disabled:cursor-not-allowed disabled:opacity-40"><SkipForward className="h-3.5 w-3.5" /></button>
                    </>}
                  </div>
                  <span className={user ? 'rounded-md bg-black/25 px-1.5 py-0.5 text-[11px] font-medium leading-none text-white/95' : 'text-zinc-400'}>{message.timestamp}{message.status === 'failed' ? ` · ${t('chat.messageFailed')}` : message.status === 'canceled' ? ` · ${t('chat.messageCanceled')}` : ''}</span>
                </div>
              </div>
            );
            return (
              <div key={message.id} className={user ? 'flex w-full flex-row-reverse items-start gap-2 sm:gap-3' : 'flex w-full items-start gap-2 sm:gap-3'}>
                <div className={user ? 'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-xs font-bold text-white sm:h-9 sm:w-9' : 'mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-700 sm:h-9 sm:w-9'}>{user ? (userAvatar ? <img src={userAvatar} alt="" aria-hidden="true" className="h-full w-full object-cover" /> : null) : (activeCharacter.avatar ? <img src={activeCharacter.avatar} alt={activeCharacter.name} className="h-full w-full object-cover" /> : <MessageSquare className="m-2 h-4 w-4 text-zinc-500" />)}</div>
                {messageBubble}
                {!user && canReadAloud && <button type="button" onClick={() => playVoice(message.id)} disabled={audioLoading} title={voiceActionLabel} aria-label={voiceActionLabel} aria-busy={audioLoading} aria-pressed={playing} className="flex h-11 w-11 shrink-0 self-end items-center justify-center rounded-full border border-zinc-700/80 bg-[#181822]/95 text-zinc-400 shadow-lg shadow-black/30 backdrop-blur-md transition-colors hover:border-pink-500/60 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 disabled:cursor-wait disabled:opacity-70">{audioLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-pink-400" /> : playing ? <VolumeX className="h-4 w-4 animate-pulse text-pink-400" /> : <Volume2 className="h-4 w-4" />}</button>}
              </div>
            );
          })}
          {shouldShowBottomThinking(generationPhase, regeneratingMessageId) && <div className="flex max-w-md items-center gap-2 sm:gap-3">{renderAvatar('h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-pink-500/50 animate-pulse sm:h-9 sm:w-9')}<div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-zinc-800 bg-[#181822] px-4 py-3 text-xs text-zinc-300"><Sparkles className="h-4 w-4 animate-spin text-pink-400" /><span>{t('chat.thinking', { name: activeCharacter.name })}</span></div></div>}
          </div>
        </div>

        <div className="r20-chat-quick mobile-scroll-strip relative z-20 flex shrink-0 items-center gap-2 overflow-x-auto border-t border-zinc-800/80 bg-[#101017] px-3 py-1.5 scrollbar-none sm:px-4 sm:py-2">
          <span className="shrink-0 text-[11px] font-bold text-zinc-400">{t('chat.quickTopics')}</span>
          {prompts.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)} disabled={!activeTimelineReady} className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-zinc-700/50 bg-zinc-800/80 px-3 text-xs text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>)}
        </div>
        <div className="chat-composer-safe relative z-20 shrink-0 border-t border-zinc-800 bg-[#14141d] p-3 sm:p-4">
          <form onSubmit={(event) => { event.preventDefault(); if (isLoading) void stopGeneration(); else if (imageMode) void generateChatImage(); else void sendMessage(); }} className="flex items-center gap-2">
            <button type="button" onClick={() => onOpenCreation?onOpenCreation():setImageMode((value) => !value)} disabled={isLoading || imageBusy || !activeTimelineReady} className={imageMode ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-pink-500/60 bg-pink-500/20 text-pink-300' : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700/60 bg-[#1a1a26] text-zinc-400 hover:text-white'} aria-label={t('chat.imageMode')} title={t('chat.imageMode')}><ImageIcon className="h-5 w-5" /></button>
            <input type="text" value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} placeholder={imageMode ? t('chat.imagePlaceholder') : t('chat.inputPlaceholder', { name: activeCharacter.name })} className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-700/60 bg-[#1a1a26] px-4 text-base text-white placeholder-zinc-500 transition-all hover:bg-[#20202e] focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 sm:text-sm" disabled={isLoading || imageBusy || !activeTimelineReady} />
            <button type="submit" disabled={imageBusy || !activeTimelineReady || (!isLoading && !imageMode && !inputMessage.trim())} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" aria-label={isLoading ? t('chat.stopGeneration') : imageMode ? t('chat.generateImage') : t('chat.sendMessage')}>{isLoading ? <X className="h-5 w-5" /> : imageMode ? <ImageIcon className="h-5 w-5" /> : <Send className="h-5 w-5" />}</button>
          </form>
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        </div>
      </div>

      {showDetailDrawer && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm xl:hidden" onClick={() => setShowDetailDrawer(false)} aria-label={t('chat.characterDetails')} />
          <div className="fixed inset-x-0 bottom-0 z-50 h-[85dvh] overflow-hidden rounded-t-3xl shadow-2xl md:inset-y-0 md:left-auto md:h-full md:w-[390px] md:rounded-none xl:static xl:z-auto xl:h-full xl:w-auto xl:rounded-none xl:shadow-none" role="dialog" aria-modal="true" aria-label={t('chat.characterDetails')}>
            {detailPanel}
          </div>
        </>
      )}

      {deleteConfirmation}
      {previewImage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[12px]" role="dialog" aria-modal="true" aria-label={t('chat.imagePreview')}>
          <button type="button" className="absolute inset-0 cursor-zoom-out" onClick={() => setPreviewImage(null)} aria-label={t('chat.closeImagePreview')} />
          <RetryingChatImage src={previewImage.url} alt={previewImage.alt} className="relative z-10 block h-auto max-h-[80dvh] w-auto max-w-[90vw] object-contain shadow-2xl sm:max-w-[80vw]" />
          <button ref={previewCloseButtonRef} type="button" onClick={() => setPreviewImage(null)} className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400" aria-label={t('chat.closeImagePreview')} title={t('chat.closeImagePreview')}><X className="h-5 w-5" /></button>
        </div>,
        document.body,
      )}
    </div>
  );
};
