import React, { useEffect, useRef, useState } from 'react';
import { Heart, Flame, MessageSquare, Trash2, UserRound } from 'lucide-react';
import {hubCopy,formatHeat} from '../discoveryCatalog';
import { Character } from '../types';
import { useLocale } from '../i18n';
import { getCharacterFilterTagLabel } from '../filterTags';
import { isMaturePreviewCharacter } from '../matureCatalog';

interface CharacterCardProps {
  character: Character;
  onSelectCharacter: (character: Character) => void;
  onToggleFavorite: (characterId: string, e: React.MouseEvent) => void;
  onDelete?: (characterId: string, e: React.MouseEvent) => void;
  deleteTitle?: string;
  mobilePresentation?: 'default' | 'explore';
  priority?: boolean;
}

function FittedTags({ labels }: { labels: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(() => Math.min(3, labels.length));
  const signature = labels.join('\u0001');
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const measure = () => {
      const width = host.clientWidth || host.parentElement?.clientWidth || 0;
      if (!width || labels.length === 0) {
        setCount(labels.length);
        return;
      }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      const style = getComputedStyle(host);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const chipWidth = (text: string) => context.measureText(text).width + 22;
      let used = 0;
      let next = 0;
      const max = Math.min(3, labels.length);
      for (let index = 0; index < max; index += 1) {
        const rest = labels.length - (index + 1);
        const needed = chipWidth(labels[index]) + (rest > 0 ? chipWidth(`+${rest}`) : 0);
        if (used + needed > width && next > 0) break;
        used += chipWidth(labels[index]) + 4;
        next = index + 1;
      }
      setCount(Math.max(labels.length ? 1 : 0, Math.min(next, max)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [signature, labels]);
  const shown = labels.slice(0, count);
  const rest = labels.length - shown.length;
  return <div ref={ref} className="mio-card-tags">{shown.map((label) => <span key={label}>{label}</span>)}{rest > 0 && <span>+{rest}</span>}</div>;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onSelectCharacter,
  onToggleFavorite,
  onDelete,
  deleteTitle,
  mobilePresentation = 'default',
  priority = false,
}) => {
  const { t, locale, formatNumber: formatLocaleNumber } = useLocale();
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [useOriginalImage, setUseOriginalImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const playRequestRef = useRef(0);
  const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Video source for hover motion preview
  const videoPreviewUrl = character.videos?.[0]?.videoUrl;

  useEffect(() => {
    setImageFailed(false);
    setUseOriginalImage(false);
  }, [character.avatar, character.avatarThumbnail, character.avatarThumbnailLarge]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !videoPreviewUrl || !supportsHover) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsCardVisible(entry.isIntersecting);
    }, { rootMargin: '300px 0px' });
    observer.observe(card);
    return () => observer.disconnect();
  }, [videoPreviewUrl, supportsHover]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoPreviewUrl) return;
    const requestId = ++playRequestRef.current;
    void video.play().catch(() => {
      if (playRequestRef.current === requestId) setIsVideoReady(false);
    });
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (playRequestRef.current === requestId) setIsVideoReady(false);
    };
  }, [videoPreviewUrl, isCardVisible, isHovered]);

  // Format numbers (e.g., 2100 -> 2.1k, 1500000 -> 1.5M)
  const formatNumber = (num: number) => formatLocaleNumber(num);

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => {
        if (supportsHover) {
          setIsVideoReady(false);
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsVideoReady(false);
      }}
      className={`mio-character-card ${mobilePresentation === 'explore' ? 'mobile-explore-card' : ''} group relative bg-[#13131a] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-lg transition-all duration-300 cursor-pointer flex min-h-fit flex-col aspect-[3/4.2]`}
    >
      <button
        type="button"
        onClick={() => onSelectCharacter(character)}
        aria-label={`${t('detail.profile')}: ${character.name}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#13131a]"
      />

      {/* Character Image & Dynamic Video Background */}
      <div className="mio-card-art pointer-events-none absolute inset-0 overflow-hidden bg-zinc-900">
        {character.avatar && !imageFailed ? (
          <img
            src={useOriginalImage ? character.avatar : (character.avatarThumbnail || character.avatar)}
            srcSet={!useOriginalImage && character.avatarThumbnailLarge && character.avatarThumbnailLarge !== character.avatarThumbnail
              ? `${character.avatarThumbnail || character.avatar} 320w, ${character.avatarThumbnailLarge} 640w`
              : undefined}
            sizes="(min-width: 1024px) 14vw, 46vw"
            alt={character.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out brightness-105 contrast-[1.05] saturate-[1.05]"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'low'}
            onError={() => {
              if (!useOriginalImage && character.avatar) setUseOriginalImage(true);
              else setImageFailed(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
            <UserRound className="w-16 h-16" />
          </div>
        )}
        {isHovered && isCardVisible && videoPreviewUrl && (
          <video
            ref={videoRef}
            src={videoPreviewUrl}
            poster={character.videos?.[0]?.coverUrl || character.avatarThumbnailLarge || character.avatarThumbnail || character.avatar || undefined}
            loop
            muted
            playsInline
            preload="auto"
            onPlaying={() => setIsVideoReady(true)}
            onError={() => setIsVideoReady(false)}
            className={`absolute inset-0 h-full w-full object-cover object-center scale-105 transition-opacity duration-200 ${isHovered && isVideoReady ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden="true"
          />
        )}
        <span className="mio-card-chatcount" title={`${hubCopy(locale).heat}: ${character.chatCount}`} aria-label={`${hubCopy(locale).heat}: ${formatHeat(character.chatCount,locale)}`}><Flame size={12}/>{formatHeat(character.chatCount,locale)}</span>
        {(isMaturePreviewCharacter(character.id) || character.tags.includes('demo_adult') || character.filterTags?.some((tag) => tag.slug === 'demo_adult')) && <span className="demo-18">18+</span>}
        {/* Softened Dark Gradient Overlay for clearer, brighter character visuals */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 via-60% to-transparent opacity-80 transition-opacity" />
      </div>

      {/* Top Right Action Buttons: Favorite + Delete (if available) */}
      <div className="pointer-events-none relative z-20 flex items-start justify-end p-2 sm:p-3">
        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(character.id, e);
              }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 backdrop-blur-md transition-all hover:bg-rose-600/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#13131a] sm:h-9 sm:w-9"
              title={deleteTitle || t('card.removeCharacter')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(character.id, e);
            }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all sm:h-9 sm:w-9 ${
              character.isFavorite
                ? 'bg-pink-500/90 text-white border-pink-400 shadow-md shadow-pink-500/30'
              : 'bg-black/40 hover:bg-black/70 text-zinc-300 border-white/10 hover:text-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#13131a]'
            }`}
            title={character.isFavorite ? t('card.removeFavorite') : t('card.addFavorite')}
          >
            <Heart className={`w-4 h-4 ${character.isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom Content Area - Shifted down with compact padding */}
      <div className="mio-card-copy pointer-events-none relative z-20 mt-auto p-3 sm:p-3.5 space-y-1.5 text-left">
        {/* Character Title & Age */}
        <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
          <h3 className="min-w-0 flex-1 line-clamp-2 text-sm font-black text-white drop-shadow-md transition-colors group-hover:text-pink-200 sm:text-lg">
            {character.name}
          </h3>
          <span className={`shrink-0 rounded-md border border-pink-500/30 bg-pink-950/80 px-1.5 py-0.5 text-[10px] font-bold text-pink-300 sm:text-[11px] ${character.age == null ? 'mobile-explore-card-age-empty' : ''}`}>
            {character.ageStatus === 'secret' ? 'Secret' : (character.age ?? '—')}
          </span>
        </div>

        {/* Truncated Subtitle / Excerpt */}
        <p className={`mobile-explore-card-description text-[11px] sm:text-xs text-zinc-300 leading-snug font-normal drop-shadow-sm ${mobilePresentation === 'explore' ? 'truncate' : 'line-clamp-2'}`}>
          {character.subtitle}
        </p>

        <span className="demo-placeholder">{locale === 'ja' ? '既存素材（仮）' : locale === 'zh-CN' ? '现有素材（占位）' : 'Existing asset (placeholder)'}</span>
        <FittedTags labels={(character.filterTags?.length ? character.filterTags.map((tag) => getCharacterFilterTagLabel(tag, locale, t)) : character.tags.map((tag) => getCharacterFilterTagLabel({ slug: tag, label: tag }, locale, t))).filter(Boolean)} />
        {/* Stats Row & Creator Handle */}
        <div className="mobile-explore-card-stats flex flex-col items-start gap-1 border-t border-white/10 pt-1 text-[10px] font-medium text-zinc-400 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:text-[11px]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1 text-zinc-300 hover:text-pink-400">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              {character.likes > 0 ? formatNumber(character.likes) : null}
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              {character.chatCount > 0 ? formatNumber(character.chatCount) : null}
            </span>
          </div>
          <span className="mobile-explore-card-author max-w-full truncate font-mono text-[9px] text-zinc-400 sm:max-w-[90px] sm:text-[10px]">
            {character.author}
          </span>
        </div>
      </div>
    </article>
  );
};
