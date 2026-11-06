import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Play, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Film, 
  Flame, 
  UserRound,
  Check
} from 'lucide-react';
import { api, ApiError, type ApiFeedPost } from '../api';
import { useLocale } from '../i18n';
import { userErrorMessage } from '../utils/userError';
import { pageDataCacheKey, readPageDataSnapshot, writePageDataSnapshot } from '../pageDataCache';

interface CharacterFeedViewProps {
  followedAuthors: string[];
  isAuthenticated: boolean;
  onToggleFollowAuthor: (authorName: string, creatorId?: string) => void;
  onOpenCreatorProfile: (authorName: string, creatorId?: string) => void;
  onRequireAuth?: () => void;
}

interface FeedItem {
  post: ApiFeedPost;
}

type FeedSnapshot = { items: FeedItem[]; nextCursor: string | null; hasMore: boolean };
const FEED_PAGE_SIZE = 10;

export const CharacterFeedView: React.FC<CharacterFeedViewProps> = ({
  followedAuthors,
  isAuthenticated,
  onToggleFollowAuthor,
  onOpenCreatorProfile,
  onRequireAuth,
}) => {
  const { t, formatNumber, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'hot' | 'following' | 'new'>('hot');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const likeBusyRef = useRef(new Set<string>());
  const lastSwipeAtRef = useRef(0);
  const lastWheelAtRef = useRef(0);

  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const followingRefreshKey = activeTab === 'following'
    ? `${isAuthenticated}:${followedAuthors.join('\u0001')}`
    : '';
  const feedCacheKey = pageDataCacheKey('feed', locale, `${activeTab}:${followingRefreshKey}`);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readPageDataSnapshot<FeedSnapshot>(feedCacheKey);
    setFeedItems(cached?.items || []);
    setNextCursor(cached?.nextCursor || null);
    setHasMore(cached?.hasMore || false);
    setFeedLoading(!cached);
    setFeedError(null);
    if (activeTab === 'following' && !isAuthenticated) {
      setFeedLoading(false);
      return () => controller.abort();
    }
    void (async () => {
      try {
        const page = await api.feed.list({
          limit: FEED_PAGE_SIZE,
          channel: 'dynamic',
          sort: activeTab === 'hot' ? 'trending' : 'newest',
          following: activeTab === 'following' ? true : undefined,
          mediaType: 'video',
        }, controller.signal);
        if (controller.signal.aborted) return;
        const items = page.items
          .filter((post) => post.media.mediaType === 'video')
          .map((post) => ({ post }));
        const snapshot = { items, nextCursor: page.nextCursor || null, hasMore: page.hasMore };
        setFeedItems(items);
        setNextCursor(snapshot.nextCursor);
        setHasMore(snapshot.hasMore);
        writePageDataSnapshot(feedCacheKey, snapshot, ['feed', 'creators']);
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
        setFeedError(userErrorMessage(reason, t, 'community.feedLoadFailed'));
        setFeedItems([]);
      } finally {
        if (!controller.signal.aborted) setFeedLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, feedCacheKey, followingRefreshKey, isAuthenticated, reloadKey]);

  // Pagination must not jump the viewer back to the first video.
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
  }, [activeTab]);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(feedItems.length - 1, 0)));
  }, [feedItems.length]);

  const currentFeedItem = feedItems[currentIndex] || feedItems[0];

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.feed.list({
        cursor: nextCursor,
        limit: FEED_PAGE_SIZE,
        channel: 'dynamic',
        sort: activeTab === 'hot' ? 'trending' : 'newest',
        following: activeTab === 'following' ? true : undefined,
        mediaType: 'video',
      });
      const items = page.items.filter((post) => post.media.mediaType === 'video').map((post) => ({ post }));
      setFeedItems((current) => {
        const merged = [...current, ...items.filter((item) => !current.some((existing) => existing.post.id === item.post.id))];
        writePageDataSnapshot(feedCacheKey, { items: merged, nextCursor: page.nextCursor || null, hasMore: page.hasMore }, ['feed', 'creators']);
        return merged;
      });
      setNextCursor(page.nextCursor || null);
      setHasMore(page.hasMore);
    } catch (reason) {
      setFeedError(userErrorMessage(reason, t, 'community.feedLoadFailed'));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (currentIndex >= feedItems.length - 2 && hasMore) void loadMore();
  }, [currentIndex, feedItems.length, hasMore, nextCursor]);

  // Video autoplay management
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPlaying, activeTab]);

  const handleNext = () => {
    if (currentIndex < feedItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else if (hasMore) {
      void loadMore();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  // Keyboard vertical navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < feedItems.length - 1) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, feedItems.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndY(null);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStartY == null || touchEndY == null) return;
    const distance = touchStartY - touchEndY;
    if (distance > 50 && currentIndex < feedItems.length - 1) {
      lastSwipeAtRef.current = Date.now();
      handleNext();
    } else if (distance < -50 && currentIndex > 0) {
      lastSwipeAtRef.current = Date.now();
      handlePrev();
    }
    setTouchStartY(null);
    setTouchEndY(null);
  };

  const handleWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) < 30 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const now = Date.now();
    if (now - lastWheelAtRef.current < 450) return;
    if (e.deltaY > 0 && currentIndex < feedItems.length - 1) {
      e.preventDefault();
      lastWheelAtRef.current = now;
      handleNext();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      e.preventDefault();
      lastWheelAtRef.current = now;
      handlePrev();
    }
  };

  useEffect(() => {
    const frame = videoFrameRef.current;
    if (!frame) return;
    frame.addEventListener('wheel', handleWheel, { passive: false });
    return () => frame.removeEventListener('wheel', handleWheel);
  }, [currentIndex, feedItems.length]);

  const togglePlay = () => {
    if (Date.now() - lastSwipeAtRef.current < 300) return;
    setIsPlaying(!isPlaying);
  };

  const handleTabChange = (tab: 'hot' | 'following' | 'new') => {
    setActiveTab(tab);
    if (tab === 'following' && !isAuthenticated) onRequireAuth?.();
  };

  const formatNum = (num: number) => formatNumber(num);

  const handleToggleLike = async (post: ApiFeedPost) => {
    if (likeBusyRef.current.has(post.id)) return;
    likeBusyRef.current.add(post.id);
    try {
      const result = post.likedByMe ? await api.feed.unlike(post.id) : await api.feed.like(post.id);
      setFeedItems((items) => items.map((item) => item.post.id === post.id ? {
        ...item,
        post: { ...item.post, likedByMe: result.liked, likeCount: result.likeCount },
      } : item));
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setFeedError(userErrorMessage(reason, t, 'community.likeFailed'));
    } finally {
      likeBusyRef.current.delete(post.id);
    }
  };

  const authorName = currentFeedItem
    ? currentFeedItem.post.author.handle || currentFeedItem.post.author.displayName
    : '';
  const authorAvatar = currentFeedItem?.post.author.avatar?.url || '';
  const creatorId = currentFeedItem?.post.author.id || '';
  const isFollowed = followedAuthors.includes(authorName);

  return (
    <div className="mobile-secondary-view w-full max-w-5xl mx-auto flex flex-col items-center space-y-4 pb-6">
      <header className="w-full px-2 pt-2">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t('nav.feed')}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t('feed.generatedVideo')}</p>
      </header>
      
      {/* Top Filter Category Navigation Bar */}
      <div className="w-full overflow-x-auto px-2 pb-1 custom-scrollbar">
        <div
          className="flex min-w-max items-center gap-2 rounded-2xl border border-zinc-800/80 bg-[#12121c] p-1.5 shadow-md"
          role="tablist"
          aria-label={t('nav.feed')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hot'}
            aria-controls="feed-video-panel"
            onClick={() => handleTabChange('hot')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'hot'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{t('feed.hot')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'following'}
            aria-controls="feed-video-panel"
            onClick={() => handleTabChange('following')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'following'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>{t('feed.following', { count: followedAuthors.length })}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'new'}
            aria-controls="feed-video-panel"
            onClick={() => handleTabChange('new')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('feed.new')}</span>
          </button>
        </div>
      </div>

      {!currentFeedItem ? (
        <div
          id="feed-video-panel"
          role="tabpanel"
          aria-live="polite"
          aria-busy={feedLoading}
          className="mx-auto my-8 flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center space-y-4 rounded-3xl border border-zinc-800 bg-[#111118] p-6 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400">
            <Film className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {feedLoading ? t('feed.loading') : feedError ? t('feed.loadFailed') : t('feed.empty')}
          </h3>
          <p className="text-xs leading-relaxed text-zinc-400">
            {feedError || (activeTab === 'following'
              ? t('feed.followingEmpty')
              : t('feed.genericEmpty'))}
          </p>
          <button
            type="button"
            onClick={() => feedError ? setReloadKey((value) => value + 1) : handleTabChange('hot')}
            disabled={feedLoading}
            className="rounded-full bg-pink-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {feedError ? t('feed.reload') : t('community.exploreWorks')}
          </button>
        </div>
      ) : (
        <div
          id="feed-video-panel"
          role="tabpanel"
          className="relative flex w-full items-center justify-center py-2"
        >
          <div
            ref={videoFrameRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
              setTouchStartY(null);
              setTouchEndY(null);
            }}
            style={{ touchAction: 'pan-x' }}
            className="group relative flex aspect-[9/16] w-full max-w-[420px] select-none flex-col overflow-hidden rounded-3xl border border-zinc-800/90 bg-black shadow-2xl transition-all duration-300 sm:max-w-[450px]"
          >
            <video
              ref={videoRef}
              src={currentFeedItem.post.media.url}
              poster={currentFeedItem.post.media.thumbnailLargeUrl || currentFeedItem.post.media.thumbnailUrl || currentFeedItem.post.character?.imageThumbnailLargeUrl || currentFeedItem.post.character?.imageThumbnailUrl || authorAvatar || undefined}
              loop
              muted
              playsInline
              preload="metadata"
              onClick={togglePlay}
              className="h-full w-full cursor-pointer object-cover"
            />

            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/40 transition-all"
              >
                <div className="flex h-16 w-16 scale-110 items-center justify-center rounded-full border border-white/30 bg-pink-500/90 text-white shadow-2xl backdrop-blur-md">
                  <Play className="ml-1 h-8 w-8 fill-white" />
                </div>
              </div>
            )}

            <div className="absolute bottom-8 right-3 z-20 flex flex-col items-center gap-5 sm:bottom-10 sm:right-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onOpenCreatorProfile(authorName, creatorId)}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-zinc-400 ring-2 ring-pink-500 shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-300"
                  aria-label={`${t('community.viewProfile')}: ${authorName}`}
                >
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFollowAuthor(authorName, creatorId)}
                  className={`absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow-md transition-all ${
                    isFollowed
                      ? 'bg-emerald-500 hover:bg-rose-500'
                      : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-110'
                  }`}
                  title={isFollowed ? t('feed.followedCreator') : t('feed.followCreator')}
                >
                  {isFollowed ? <Check className="h-3 w-3 text-white" /> : <UserPlus className="h-3 w-3 text-white" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { void handleToggleLike(currentFeedItem.post); }}
                className="group flex flex-col items-center transition-all"
                aria-label={currentFeedItem.post.likedByMe ? t('feed.liked') : t('feed.like')}
              >
                <div className={`rounded-full border p-3 backdrop-blur-md transition-all ${
                  currentFeedItem.post.likedByMe
                    ? 'border-pink-400 bg-pink-500 text-white shadow-lg shadow-pink-500/40'
                    : 'border-white/15 bg-black/50 text-white group-hover:bg-black/80'
                }`}>
                  <Heart className={`h-5 w-5 ${currentFeedItem.post.likedByMe ? 'fill-white' : ''}`} />
                </div>
                <span className="mt-1 text-[10px] font-bold text-white drop-shadow">
                  {formatNum(currentFeedItem.post.likeCount)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
