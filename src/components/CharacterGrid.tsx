import {DiscordPromoCard} from './DiscordPromoCard';
import React, { useEffect, useRef } from 'react';
import { Character } from '../types';
import { CharacterCard } from './CharacterCard';
import { SearchX, RefreshCw, LoaderCircle, AlertCircle } from 'lucide-react';
import { useLocale } from '../i18n';

interface CharacterGridProps {
  onOpenEvent?:()=>void;
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  onToggleFavorite: (characterId: string, e: React.MouseEvent) => void;
  onResetFilters: () => void;
  onClearSearch?: () => void;
  hasQuery?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMoreError?: string | null;
  onRetryLoadMore?: () => void;
  mobilePresentation?: 'default' | 'explore';
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  onOpenEvent,
  onSelectCharacter,
  onToggleFavorite,
  onResetFilters,
  onClearSearch,
  hasQuery = false,
  loading = false,
  error = null,
  onRetry,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  loadMoreError = null,
  onRetryLoadMore,
  mobilePresentation = 'default',
}) => {
  const { t, locale } = useLocale();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  const paginationArmedRef = useRef(false);
  const paginationAllowedRef = useRef(false);
  loadMoreRef.current = onLoadMore;
  paginationAllowedRef.current = Boolean(hasMore && !loading && !loadingMore && !loadMoreError);

  useEffect(() => {
    const armPagination = () => {
      paginationArmedRef.current = true;
      const sentinel = sentinelRef.current;
      if (paginationAllowedRef.current && sentinel && sentinel.getBoundingClientRect().top <= window.innerHeight + 800) {
        loadMoreRef.current?.();
      }
    };
    window.addEventListener('scroll', armPagination, { passive: true, once: true });
    return () => window.removeEventListener('scroll', armPagination);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore || loadMoreError) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && paginationArmedRef.current) loadMoreRef.current?.();
    }, { rootMargin: '800px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMoreError, characters.length]);

  if (loading && characters.length === 0) {
    return (
      <div
        className={mobilePresentation === 'explore'
          ? 'mobile-explore-grid grid grid-cols-1 gap-3 pb-6 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 lg:pb-12 xl:grid-cols-5'
          : 'grid grid-cols-1 gap-3 pb-12 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}
        aria-label={t('discover.loadingCharacters')}
        aria-busy="true"
      >
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="aspect-[3/4.2] overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#13131a]" aria-hidden="true">
            <div className="h-full animate-pulse bg-zinc-900">
              <div className="h-2/3 bg-zinc-800/70" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-2/3 rounded bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-800/70" />
                <div className="h-3 w-1/2 rounded bg-zinc-800/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && characters.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4 bg-[#111117]/60 rounded-3xl border border-zinc-800/60 my-6 min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700/50">
          <AlertCircle className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('discover.loadFailed')}</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6">{error}</p>
        <button onClick={onRetry} className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all flex items-center gap-2 border border-zinc-700">
          <RefreshCw className="w-4 h-4" />
          <span>{t('discover.reload')}</span>
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center px-4 bg-[#111117]/60 rounded-3xl border border-zinc-800/60 my-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700/50">
          <SearchX className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{locale === 'ja' ? '条件に一致する結果がありません。' : t('discover.noResults')}</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          {t('discover.noResultsHint')}
        </p>
        <div className="demo-empty">
          {hasQuery && <button type="button" onClick={onClearSearch} className="px-5 py-2.5 rounded-full bg-[#B77AF4] font-semibold text-sm text-[#1A1024]">{locale === 'ja' ? '検索をクリア' : locale === 'zh-CN' ? '清空搜索' : 'Clear search'}</button>}
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all flex items-center gap-2 border border-zinc-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{locale === 'ja' ? '絞り込みをリセット' : t('common.reset')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div aria-busy={loading || loadingMore}>
      <div className={mobilePresentation === 'explore'
        ? 'mobile-explore-grid grid grid-cols-1 gap-3 pb-6 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 lg:pb-12 xl:grid-cols-5'
        : 'grid grid-cols-1 gap-3 pb-12 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}>
        {characters.map((char, index) => (
          <React.Fragment key={char.id}>{mobilePresentation==='explore'&&index===3&&<DiscordPromoCard onOpen={onOpenEvent}/>}<CharacterCard
            character={char}
            onSelectCharacter={onSelectCharacter}
            onToggleFavorite={onToggleFavorite}
            mobilePresentation={mobilePresentation}
            priority={index === 0}
          /></React.Fragment>
        ))}
      </div>
      {error && (
        <div className="flex items-center justify-center gap-3 pb-6 text-sm text-rose-300" role="status">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 font-semibold text-pink-300 hover:text-pink-200">
            <RefreshCw className="h-4 w-4" />
            {t('discover.reload')}
          </button>
        </div>
      )}
      {loadMoreError ? (
        <div className="flex items-center justify-center gap-3 pb-10 text-sm text-zinc-300" role="status">
          <span>{loadMoreError}</span>
          <button
            type="button"
            onClick={onRetryLoadMore}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-pink-500/60 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('discover.reload')}</span>
          </button>
        </div>
      ) : hasMore && onLoadMore ? (
        <div ref={sentinelRef} className="flex h-14 items-center justify-center pb-6" aria-hidden={!loadingMore}>
          {loadingMore && <LoaderCircle className="h-5 w-5 animate-spin text-pink-400" />}
        </div>
      ) : null}
    </div>
  );
};
