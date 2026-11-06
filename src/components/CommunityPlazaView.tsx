import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Heart, 
  Film, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  User, 
  Wand2,
  Play,
} from 'lucide-react';
import { api, ApiError, type ApiFeedPost } from '../api';
import { useLocale } from '../i18n';
import { userErrorMessage } from '../utils/userError';
import { pageDataCacheKey, readPageDataSnapshot, writePageDataSnapshot } from '../pageDataCache';

interface CommunityPlazaViewProps {
  onOpenGenerateModal: () => void;
  generationEnabled?: boolean;
  followedAuthors?: string[];
  onToggleFollowAuthor?: (authorName: string, creatorId?: string) => void;
  onOpenCreatorProfile?: (authorName: string, creatorId?: string) => void;
  onRequireAuth?: () => void;
  reloadKey?: number;
}

export const CommunityPlazaView: React.FC<CommunityPlazaViewProps> = ({
  onOpenGenerateModal,
  generationEnabled = true,
  followedAuthors = [],
  onToggleFollowAuthor,
  onOpenCreatorProfile,
  onRequireAuth,
  reloadKey = 0,
}) => {
  const { locale, t, formatDateTime } = useLocale();
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'video' | 'image'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sharedItems, setSharedItems] = useState<ApiFeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [localReloadKey, setLocalReloadKey] = useState(0);
  const [imageOriginalFallbacks, setImageOriginalFallbacks] = useState<Set<string>>(() => new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const likeBusy = React.useRef(new Set<string>());
  const loadMoreRef = useRef<() => void>(() => undefined);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const cacheKey = pageDataCacheKey('community', locale, activeTab);

  useEffect(() => {
    const controller = new AbortController();
    const cached = readPageDataSnapshot<{ items: ApiFeedPost[]; nextCursor: string | null; hasMore: boolean }>(cacheKey);
    setSharedItems(cached?.items || []);
    setNextCursor(cached?.nextCursor || null);
    setHasMore(cached?.hasMore || false);
    setFeedLoading(!cached);
    setFeedError(null);
    setImageOriginalFallbacks(new Set());
    setExpandedVideoId(null);
    void (async () => {
      try {
        const page = await api.feed.list({
          limit: 20,
          channel: 'community',
          sort: activeTab === 'all' ? 'trending' : 'newest',
          following: activeTab === 'following' ? true : undefined,
          mediaType: activeTab === 'image' || activeTab === 'video' ? activeTab : undefined,
        }, controller.signal);
        if (controller.signal.aborted) return;
        const snapshot = { items: page.items, nextCursor: page.nextCursor || null, hasMore: page.hasMore };
        setSharedItems(snapshot.items);
        setNextCursor(snapshot.nextCursor);
        setHasMore(snapshot.hasMore);
        writePageDataSnapshot(cacheKey, snapshot, ['feed', 'creators']);
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
        setFeedError(userErrorMessage(reason, t, 'community.feedLoadFailed'));
        setSharedItems([]);
      } finally {
        if (!controller.signal.aborted) setFeedLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, cacheKey, localReloadKey, reloadKey]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.feed.list({
        cursor: nextCursor,
        limit: 20,
        channel: 'community',
        sort: activeTab === 'all' ? 'trending' : 'newest',
        following: activeTab === 'following' ? true : undefined,
        mediaType: activeTab === 'image' || activeTab === 'video' ? activeTab : undefined,
      });
      setSharedItems((current) => {
        const items = [...current, ...page.items.filter((item) => !current.some((existing) => existing.id === item.id))];
        writePageDataSnapshot(cacheKey, { items, nextCursor: page.nextCursor || null, hasMore: page.hasMore }, ['feed', 'creators']);
        return items;
      });
      setNextCursor(page.nextCursor || null);
      setHasMore(page.hasMore);
    } catch (reason) {
      setFeedError(userErrorMessage(reason, t, 'community.feedLoadFailed'));
    } finally {
      setLoadingMore(false);
    }
  };

  loadMoreRef.current = () => { void loadMore(); };
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreRef.current();
    }, { rootMargin: '800px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, sharedItems.length]);

  const handleToggleLike = async (post: ApiFeedPost) => {
    if (likeBusy.current.has(post.id)) return;
    likeBusy.current.add(post.id);
    try {
      const result = post.likedByMe ? await api.feed.unlike(post.id) : await api.feed.like(post.id);
      setSharedItems((items) => items.map((item) => item.id === post.id ? {
        ...item,
        likedByMe: result.liked,
        likeCount: result.likeCount,
      } : item));
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setFeedError(userErrorMessage(reason, t, 'community.likeFailed'));
    } finally {
      likeBusy.current.delete(post.id);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedMediaItems = sharedItems;

  return (
    <div className="mobile-secondary-view space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-pink-950/60 via-[#161622] to-purple-950/60 border border-pink-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('community.eyebrow')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('nav.community')}
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {t('community.description')}
          </p>
        </div>

        {generationEnabled && (
          <button
            onClick={onOpenGenerateModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 active:scale-95 text-white font-black text-sm shadow-xl shadow-pink-500/30 flex items-center gap-2 shrink-0 transition-all z-10"
          >
            <Wand2 className="w-4 h-4" />
            <span>{t('community.shareWork')}</span>
          </button>
        )}

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Tab Filter Switcher Bar */}
      <div className="p-2 bg-[#12121a] rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: t('community.tabAll') },
            { id: 'following', label: t('community.tabFollowing', { count: followedAuthors.length }) },
            { id: 'video', label: t('community.tabVideo') },
            { id: 'image', label: t('community.tabImage') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State for Following Tab */}
      {activeTab === 'following' && displayedMediaItems.length === 0 && (
        <div className="py-16 text-center bg-[#111118] rounded-3xl border border-zinc-800 p-6 max-w-lg mx-auto my-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('community.noFollowing')}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('community.noFollowingHint')}
          </p>
          <button
            onClick={() => setActiveTab('all')}
            className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-md"
          >
            {t('community.exploreWorks')}
          </button>
        </div>
      )}

      {/* Media Works Showcase Grid */}
      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
          {(feedLoading || feedError || (!feedLoading && displayedMediaItems.length === 0)) && (
            <div className="col-span-full py-16 text-center bg-[#111118] rounded-3xl border border-zinc-800 p-6 text-xs text-zinc-400 space-y-3">
              <p>{feedLoading ? t('community.loading') : feedError || t('community.empty')}</p>
              {feedError && (
                <button onClick={() => setLocalReloadKey((value) => value + 1)} className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-md">
                  {t('community.reload')}
                </button>
              )}
            </div>
          )}
          {displayedMediaItems.map((item) => {
            const isLiked = item.likedByMe;
            const authorName = item.author.handle || item.author.displayName;
            const isAuthorFollowed = followedAuthors.includes(authorName);
            const title = item.caption || item.character?.name || t('community.generatedWork');
            const useOriginalImage = imageOriginalFallbacks.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-[#12121a] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-all duration-200"
              >
                {/* Media Frame */}
                <div className="relative aspect-[4/5] bg-black overflow-hidden">
                  {item.media.mediaType === 'video' ? expandedVideoId === item.id ? (
                    <video
                      src={item.media.url}
                      poster={item.media.thumbnailLargeUrl || item.media.thumbnailUrl || undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <button type="button" onClick={() => setExpandedVideoId(item.id)} className="group/play relative h-full w-full" aria-label={title}>
                      <img
                        src={item.media.thumbnailLargeUrl || item.media.thumbnailUrl || ''}
                        srcSet={item.media.thumbnailUrl && item.media.thumbnailLargeUrl
                          ? `${item.media.thumbnailUrl} 320w, ${item.media.thumbnailLargeUrl} 640w`
                          : undefined}
                        sizes="(min-width: 1024px) 320px, 90vw"
                        loading="lazy"
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"><Play className="h-10 w-10 fill-current drop-shadow" /></span>
                    </button>
                  ) : (
                    <img
                      src={useOriginalImage ? item.media.url : (item.media.thumbnailLargeUrl || item.media.thumbnailUrl || item.media.url)}
                      srcSet={!useOriginalImage && item.media.thumbnailUrl && item.media.thumbnailLargeUrl
                        ? `${item.media.thumbnailUrl} 320w, ${item.media.thumbnailLargeUrl} 640w`
                        : undefined}
                      sizes="(min-width: 1024px) 320px, 90vw"
                      onError={() => {
                        if (!useOriginalImage && item.media.url) {
                          setImageOriginalFallbacks((items) => new Set(items).add(item.id));
                        }
                      }}
                      loading="lazy"
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-1">
                    {item.media.mediaType === 'video' ? <Film className="w-3 h-3 text-pink-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                     <span>{item.media.mediaType === 'video' ? t('community.aiVideo') : t('community.aiImage')}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-zinc-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {formatDateTime(item.publishedAt || item.createdAt, { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Info Card Body */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span 
                        onClick={() => {
                          if (onOpenCreatorProfile) onOpenCreatorProfile(authorName, item.author.id);
                        }}
                        className="font-bold text-zinc-300 hover:text-pink-400 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-pink-400" />
                        <span>{authorName}</span>
                      </span>

                      {onToggleFollowAuthor && (
                        <button
                          type="button"
                          onClick={() => onToggleFollowAuthor(authorName, item.author.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                            isAuthorFollowed
                              ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                              : 'bg-pink-500/20 text-pink-400 border-pink-500/40 hover:bg-pink-500 hover:text-white'
                          }`}
                        >
                          {isAuthorFollowed ? t('community.followed') : t('community.follow')}
                        </button>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm text-white line-clamp-1">
                      {title}
                    </h3>

                    {/* Prompt Box */}
                    <div className="p-2 rounded-xl bg-[#181826] border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-pink-400 font-bold">{t('community.workNote')}:</span>
                        <button
                          onClick={() => handleCopyPrompt(item.id, item.caption)}
                          disabled={!item.caption}
                          className="text-zinc-400 hover:text-white flex items-center gap-1"
                          title={t('community.copyPrompt')}
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === item.id ? t('community.copied') : t('community.copyPrompt')}</span>
                        </button>
                      </div>
                      <p className="line-clamp-2 text-zinc-300 font-mono">
                        {item.caption || t('community.noCaption')}
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => { void handleToggleLike(item); }}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        isLiked
                          ? 'bg-pink-500/20 text-pink-400 border-pink-500/50'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                      <span>{item.likeCount}</span>
                    </button>

                    {generationEnabled && (
                      <button
                        onClick={onOpenGenerateModal}
                        className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-pink-500/20"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{t('community.remix')}</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
      </div>
      {hasMore && <div ref={loadMoreSentinelRef} className="flex h-14 items-center justify-center" aria-busy={loadingMore}>{loadingMore && <span className="text-xs text-zinc-400">{t('common.loading')}</span>}</div>}

    </div>
  );
};
