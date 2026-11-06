import {SwipeMediaViewer} from './SwipeMediaViewer';
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Heart, 
  MessageCircle, 
  User, 
  Image as ImageIcon, 
  Film, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Play, 
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  UserRound
} from 'lucide-react';
import { Character, MediaVideo } from '../types';
import { useLocale } from '../i18n';
import { ExpandableDescription } from './ExpandableDescription';
import { getCharacterFilterTagLabel } from '../filterTags';
import { CharacterComments } from './CharacterComments';
import { getCreateStepFourDisplayTags } from '../data/createCharacterPresets';
import {
  LockedMediaOverlay,
  MediaUnlockDialog,
  PhotoLightbox,
  VideoLightbox,
  useCharacterMediaAccess,
} from './CharacterMediaAccess';

interface CharacterDetailModalProps {
  character: Character;
  followedAuthors: string[];
  onToggleFollowAuthor: (authorName: string, creatorId?: string) => void;
  onClose: () => void;
  onStartChat: (character: Character) => void;
  onOpenCreatorProfile: (authorName: string, creatorId?: string) => void;
  onToggleFavorite: (characterId: string, e: React.MouseEvent) => void;
  onRetryStCard?: (characterId: string) => void;
  isAuthenticated: boolean;
  onRequireAuth?: () => void;
  onOpenUpgradeModal: (notice?: string) => void;
  onCommentCountChange: (characterId: string, count: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface VideoGridCardProps {
  vid: MediaVideo;
  onClick: () => void;
}

interface MediaPreviewImageProps {
  src: string;
  fallbackSrc?: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

const MediaPreviewImage: React.FC<MediaPreviewImageProps> = ({
  src,
  fallbackSrc,
  srcSet,
  sizes,
  alt,
  className,
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  const [source, setSource] = useState(src);

  useEffect(() => {
    setSource(src);
  }, [src]);

  if (!source) {
    return <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-[10px] text-zinc-600">{alt}</div>;
  }

  return (
    <img
      src={source}
      srcSet={source === src ? srcSet : undefined}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => setSource((current) => current === fallbackSrc ? '' : fallbackSrc || '')}
    />
  );
};

const VideoGridCard: React.FC<VideoGridCardProps> = ({ vid, onClick }) => {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => !vid.locked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow cursor-pointer hover:border-pink-500/60 transition-all"
    >
      {/* Cover image */}
      <MediaPreviewImage
        src={vid.coverUrl}
        fallbackSrc={vid.coverFallbackUrl}
        alt={vid.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${vid.locked ? 'blur-lg scale-105' : ''} ${isHovered ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video element */}
      {vid.videoUrl && <video
          ref={videoRef}
          src={isHovered ? vid.videoUrl : undefined}
          poster={vid.coverUrl}
          muted
          loop
          playsInline
          preload="none"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />}

      {/* Duration badge when not hovered */}
      {!isHovered && !vid.locked && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 z-10">
          <Play className="w-2.5 h-2.5 fill-white text-pink-400 ml-0.5" />
          <span>{vid.duration}</span>
        </div>
      )}

      {/* Hovering state indicator */}
      {isHovered && !vid.locked && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg z-10 animate-pulse">
          <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
          <span>{t('common.online')}</span>
        </div>
      )}

      {/* Overlay with view count */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end z-10">
        <p className="text-[10px] text-zinc-400 mt-0.5">
          {vid.views} {t('common.play', {})}
        </p>
      </div>
      {vid.locked && <LockedMediaOverlay cost={vid.unlockCost || 10} t={t} />}
    </div>
  );
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character: initialCharacter,
  followedAuthors,
  onToggleFollowAuthor,
  onClose,
  onStartChat,
  onOpenCreatorProfile,
  onToggleFavorite,
  onRetryStCard,
  isAuthenticated,
  onRequireAuth,
  onOpenUpgradeModal,
  onCommentCountChange,
  error = null,
  onRetry,
}) => {
  const { locale, t, formatNumber } = useLocale();
  const [gallery,setGallery]=useState<{kind:'photo'|'video';index:number}|null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'videos' | 'comments'>('info');
  const mediaAccess = useCharacterMediaAccess({
    character: initialCharacter,
    isAuthenticated,
    onRequireAuth,
    onOpenUpgradeModal,
    t,
  });
  const character = mediaAccess.character;

  useEffect(() => {
    setActiveTab('info');
  }, [character.id, character.source]);

  const photos = mediaAccess.photos;
  const videos = mediaAccess.videos;
  const isFollowed = followedAuthors.includes(character.author);
  const filterTags = character.filterTags || [];
  const displayTags = character.source === 'created'
    ? getCreateStepFourDisplayTags(character.creationSelections, t)
    : filterTags.map((tag) => ({ id: tag.slug, label: getCharacterFilterTagLabel(tag, locale, t) }));

  const formatNum = (num: number) => formatNumber(num);

  if (error) {
    return (
      <div className="r15-character-detail-overlay mobile-touch-modal safe-area-top fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-6">
        <div className="relative flex min-h-[320px] w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#12121c] p-6 text-center shadow-2xl sm:min-h-[360px] sm:rounded-3xl sm:p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10" aria-label={t('detail.close')}><X className="w-5 h-5" /></button>
          <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
          <h2 className="text-xl font-black text-white mb-2">{t('detail.unavailable')}</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6">{error}</p>
          <button onClick={onRetry} className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm border border-zinc-700">{t('discover.reload')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="r15-character-detail-overlay mobile-touch-modal safe-area-top fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-6">
      <div
        className="mio-detail-modal r18-long-profile relative my-auto flex h-[calc(100dvh-16px)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#12121c] shadow-2xl sm:h-[min(90dvh,56rem)] sm:rounded-3xl"
      >
        
        {/* Top Header Background Banner */}
        <div className="relative h-36 shrink-0 overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-[#1c1a2e] to-[#12121c] sm:h-56">
          {(character.source !== 'api' || character.bgImage || character.avatar) && (
            <img
              src={character.bgImage || character.avatarThumbnailLarge || character.avatarThumbnail || character.avatar}
              alt={character.name}
              className="w-full h-full object-cover opacity-40 blur-sm scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-[#12121c]/60 to-transparent" />
          
          {/* Top Close & Favorite Actions */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/10 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>{t('detail.profile')}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => onToggleFavorite(character.id, e)}
                className={`r17-profile-action p-2 rounded-full backdrop-blur-md border transition-all ${
                  character.isFavorite
                    ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/30'
                    : 'bg-black/50 hover:bg-black/80 text-zinc-300 border-white/10 hover:text-pink-400'
                }`}
                title={character.isFavorite ? t('card.removeFavorite') : t('detail.favorite')}
              >
                <Heart className={`w-4 h-4 ${character.isFavorite ? 'fill-white' : ''}`} />
              </button>

              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="r17-profile-action p-2 rounded-full bg-black/50 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Character Main Header Card inside Banner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4 z-10">
            <div className="relative group shrink-0">
              {character.avatar ? (
                <img
                  src={character.avatarThumbnail || character.avatarThumbnailLarge || character.avatar}
                  alt={character.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-pink-500/50 shadow-2xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900 ring-2 ring-pink-500/50 shadow-2xl flex items-center justify-center text-zinc-600">
                  <UserRound className="w-9 h-9" />
                </div>
              )}
              {character.isHot && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                  HOT
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {character.name}
                </h2>
                <span className="text-xs text-pink-400 bg-pink-500/15 px-2.5 py-0.5 rounded-full font-bold border border-pink-500/30">
                  {character.ageStatus === 'secret' ? 'Secret' : (character.age == null ? '—' : character.age)}
                </span>
              </div>

              <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 pt-0.5 ${character.likes + character.chatCount + character.commentCount === 0 ? 'hidden' : ''}`}>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  {formatNum(character.likes)} {t('detail.likes')}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                  {formatNum(character.chatCount)} {t('detail.chats')}
                </span>
                {character.source === 'api' && (
                  <span className="flex items-center gap-1 text-pink-300">
                    <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                    {formatNum(character.commentCount)} {t('comments.tab')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Creator Info Banner */}
        <div className="bg-[#181826] px-5 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
          <div 
            onClick={() => {
              onClose();
              onOpenCreatorProfile(character.author, character.creatorId);
            }}
            className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 ring-1 ring-pink-500/30 group-hover:scale-105 transition-transform overflow-hidden">
              {character.creatorAvatar ? (
                <img src={character.creatorAvatar} alt={character.author} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                  {t('detail.creator', { name: character.author })}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-pink-400 transition-colors" />
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                {t('detail.openCreator')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onToggleFollowAuthor(character.author, character.creatorId)}
            disabled={!character.creatorId}
            className={`r17-profile-follow px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              isFollowed
                ? 'bg-zinc-800 hover:bg-rose-900/50 text-zinc-300 hover:text-rose-300 border border-zinc-700/80'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white shadow-md shadow-pink-500/20'
            }`}
          >
            {isFollowed ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('common.following')}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('common.follow')}</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="mobile-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 custom-scrollbar">
          {error && (
            <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-500/30 flex items-start gap-2 text-xs text-rose-200" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <h3 className="r18-detail-heading">{t('detail.photos')}</h3>
          {(
            <div className={`r19-profile-media-strip r19-photos ${photos.length === 0 ? 'min-h-full place-content-center' : ''}`}>
              {photos.map((p, index) => (
                <button type="button" onClick={() => setGallery({kind:'photo',index})} key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left shadow hover:border-pink-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400">
                  <MediaPreviewImage
                    src={p.locked ? p.previewUrl || p.url : p.thumbnailUrl || p.thumbnailLargeUrl || p.url}
                    fallbackSrc={p.locked ? undefined : p.url}
                    srcSet={!p.locked && p.thumbnailUrl && p.thumbnailLargeUrl ? `${p.thumbnailUrl} 320w, ${p.thumbnailLargeUrl} 640w` : undefined}
                    sizes="(min-width: 640px) 30vw, 45vw"
                    alt={p.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${p.locked ? 'scale-105 blur-lg' : 'group-hover:scale-105'}`}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                  />
                  {p.locked && <LockedMediaOverlay cost={p.unlockCost || 10} t={t} />}
                </button>
              ))}
              {photos.length === 0 && <div className="col-span-full py-12 text-center text-zinc-500 text-xs">{t('detail.noPhotos')}</div>}
            </div>
          )}

          <h3 className="r18-detail-heading">{t('detail.videos')}</h3>
          {(
            <div className={`r19-profile-media-strip r19-videos ${videos.length === 0 ? 'min-h-full place-content-center' : ''}`}>
              {videos.map((vid,index) => (
                <VideoGridCard
                  key={vid.id}
                  vid={vid}
                  onClick={() => setGallery({kind:'video',index})}
                />
              ))}
              {videos.length === 0 && <div className="col-span-full py-12 text-center text-zinc-500 text-xs">{t('detail.noVideos')}</div>}
            </div>
          )}

          {(
            <div className="space-y-4 text-xs animate-in fade-in duration-200">
              {character.source === 'created' && character.stCard?.status === 'failed' && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-rose-200" role="alert">
                  <div className="min-w-0">
                    <span className="font-bold">{t('detail.stCardFailed')}</span>
                  </div>
                  {onRetryStCard && <button type="button" onClick={() => onRetryStCard(character.id)} className="shrink-0 rounded-lg border border-rose-400/40 px-3 py-1.5 font-bold hover:bg-rose-500/20">{t('common.retry')}</button>}
                </div>
              )}
              {/* Frontend display description */}
              <div className="bg-[#181826] p-4 rounded-2xl border border-zinc-800/80 space-y-1.5">
                <ExpandableDescription
                  description={character.displayDescription || character.description}
                  emptyLabel={t('detail.noDetails')}
                  viewMoreLabel={t('detail.viewMore')}
                  collapseLabel={t('detail.collapse')}
                  textClassName="text-zinc-200 leading-relaxed text-xs font-normal"
                  surfaceClassName="bg-gradient-to-l from-[#181826] via-[#181826] to-transparent"
                />
                {displayTags.length > 0 && (
                  <div className="flex min-w-0 flex-wrap gap-x-2.5 gap-y-1 pt-1 text-[11px] leading-relaxed text-zinc-400">
                    {displayTags.map((tag) => (
                      <span key={tag.id} className="max-w-full break-words">
                        #{tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {character.greeting && (
                <div className="bg-[#181826] p-4 rounded-2xl border border-zinc-800/80 space-y-1.5">
                  <span className="text-cyan-400 font-extrabold text-[11px] block">{t('detail.greeting')}</span>
                  <p className="text-zinc-200 leading-relaxed text-xs font-normal">{character.greeting}</p>
                </div>
              )}

              {/* System Instruction */}
              <div className="bg-[#181826] p-4 rounded-2xl border border-zinc-800/80 space-y-1.5">
                <span className="text-zinc-400 font-bold block text-[11px]">
                  {t('detail.prompt')}:
                </span>
                <p className="font-mono text-[11px] text-zinc-400 bg-[#0e0e17] p-3 rounded-xl border border-zinc-800 leading-relaxed">
                  {character.systemInstruction || t('detail.noPrompt')}
                </p>
              </div>
            </div>
          )}

          {character.source === 'api' && (
            <CharacterComments
              key={character.id}
              characterId={character.id}
              characterName={character.name}
              commentCount={character.commentCount}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
              onCommentCountChange={onCommentCountChange}
            />
          )}
        </div>

        {/* Modal Footer: public characters can start chat; private created characters remain detail-only. */}
        {<div className="p-4 bg-[#161622] border-t border-zinc-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="hidden sm:block text-xs text-zinc-400">
            {t('detail.privateChat', { name: character.name })}
          </div>

          <button
            onClick={() => {
              onClose();
              onStartChat(character);
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>{t('detail.startChat')}</span>
          </button>
        </div>}

      </div>

      {gallery&&<SwipeMediaViewer initialIndex={gallery.index} video={gallery.kind==='video'} items={gallery.kind==='photo'?photos.map(p=>({id:p.id,url:p.url,cover:p.previewUrl||p.url,title:p.title,locked:p.locked,cost:p.unlockCost})):videos.map(v=>({id:v.id,url:v.videoUrl||'',cover:v.coverUrl,title:v.title,locked:v.locked,cost:v.unlockCost}))} onClose={()=>setGallery(null)} onUnlock={i=>gallery.kind==='photo'?mediaAccess.openPhoto(photos[i]):mediaAccess.openVideo(videos[i])}/>}
      <MediaUnlockDialog
        pending={mediaAccess.pending}
        busy={mediaAccess.unlocking}
        error={mediaAccess.unlockError}
        onCancel={mediaAccess.cancelUnlock}
        onConfirm={mediaAccess.confirmUnlock}
        t={t}
      />
    </div>
  );
};
