import React, { useState } from 'react';
import { AlertCircle, BookOpen, Heart, LoaderCircle, ShieldCheck, User, UserCheck, UserPlus, Video, X } from 'lucide-react';
import { Character } from '../types';
import { CharacterCard } from './CharacterCard';
import type { ApiFeedPost, CreatorProfile } from '../api';
import { useLocale } from '../i18n';

interface CreatorProfileModalProps {
  authorName: string;
  characters: Character[];
  characterTotal: number;
  charactersLoading: boolean;
  charactersError: string | null;
  onLoadMoreCharacters: () => void;
  onRetryCharacters: () => void;
  dynamics: ApiFeedPost[];
  dynamicsTotal: number;
  dynamicsLoading: boolean;
  dynamicsError: string | null;
  onLoadMoreDynamics: () => void;
  onRetryDynamics: () => void;
  followedAuthors: string[];
  onToggleFollowAuthor: (authorName: string, creatorId?: string) => void;
  onToggleDynamicLike: (post: ApiFeedPost) => void;
  onClose: () => void;
  onSelectCharacter: (char: Character) => void;
  onToggleFavorite: (characterId: string, event: React.MouseEvent) => void;
  creatorProfile?: CreatorProfile | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function SectionError({ message, onRetry, label }: { message: string; onRetry: () => void; label: string }) {
  return <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 px-4 py-8 text-center text-xs text-rose-100" role="alert"><AlertCircle className="h-6 w-6 text-rose-400" /><span>{message}</span><button type="button" onClick={onRetry} className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 font-semibold text-white hover:bg-zinc-700">{label}</button></div>;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  authorName, characters, characterTotal, charactersLoading, charactersError, onLoadMoreCharacters, onRetryCharacters,
  dynamics, dynamicsTotal, dynamicsLoading, dynamicsError, onLoadMoreDynamics, onRetryDynamics, followedAuthors,
  onToggleFollowAuthor, onToggleDynamicLike, onClose, onSelectCharacter, onToggleFavorite, creatorProfile = null, loading = false, error = null, onRetry,
}) => {
  const { t, formatNumber, formatDateTime } = useLocale();
  const [activeSection, setActiveSection] = useState<'characters' | 'videos'>('characters');
  const isFollowed = Boolean(creatorProfile?.followedByMe || followedAuthors.includes(authorName));
  const info = {
    name: creatorProfile?.displayName || authorName,
    avatar: creatorProfile?.avatar?.url || '',
    bio: creatorProfile?.bio || t('creator.bioEmpty'),
    followers: creatorProfile?.followerCount || 0,
    likes: creatorProfile?.likeCount || 0,
    verified: creatorProfile?.verified || false,
  };
  const hasMoreCharacters = characters.length < characterTotal;
  const hasMoreDynamics = dynamics.length < dynamicsTotal;

  return <div className="r20-creator-overlay mobile-touch-modal safe-area-top safe-area-bottom fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md animate-in fade-in duration-200 sm:p-6">
    <div className="r20-creator-profile relative my-auto flex max-h-[calc(100dvh-16px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#12121b] shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
      <div className="relative flex h-36 shrink-0 items-start justify-end border-b border-zinc-800/80 bg-gradient-to-r from-pink-950 via-purple-950 to-zinc-900 p-4 sm:h-44 sm:p-6">
        {info.avatar && <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${info.avatar})` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121b] via-[#12121b]/60 to-transparent" />
        <button type="button" onClick={onClose} className="r20-round relative z-10 rounded-full border border-white/10 bg-black/50 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white" title={t('creator.close')}><X className="h-5 w-5" /></button>
      </div>
      <div className="relative z-10 -mt-16 shrink-0 space-y-4 border-b border-zinc-800/60 px-6 pb-4 sm:-mt-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex items-end gap-4">
            {info.avatar ? <img src={info.avatar} alt={info.name} className="h-24 w-24 shrink-0 rounded-2xl bg-zinc-800 object-cover shadow-2xl ring-4 ring-[#12121b] sm:h-28 sm:w-28" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 via-purple-500/20 to-zinc-900 text-pink-300 shadow-2xl ring-4 ring-[#12121b] sm:h-28 sm:w-28"><User className="h-10 w-10" /></div>}
            <div className="space-y-1 pb-1"><div className="flex items-center gap-2"><h2 className="text-xl font-black text-white sm:text-2xl">{info.name}</h2>{info.verified && <span className="rounded-full border border-pink-500/30 bg-pink-500/20 p-1 text-pink-400" title={t('creator.verified')}><ShieldCheck className="h-4 w-4" /></span>}</div><p className="text-xs font-semibold text-pink-400">{authorName}</p></div>
          </div>
          <button type="button" onClick={() => creatorProfile && onToggleFollowAuthor(authorName, creatorProfile.id)} disabled={!creatorProfile} className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${isFollowed ? 'border border-zinc-700/80 bg-zinc-800 text-zinc-200 hover:border-rose-500/50 hover:bg-rose-900/60 hover:text-rose-300' : 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 hover:bg-pink-400'}`}>{isFollowed ? <><UserCheck className="h-4 w-4 text-emerald-400" /><span>{t('creator.followed')}</span></> : <><UserPlus className="h-4 w-4" /><span>{t('creator.follow')}</span></>}</button>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-zinc-300 sm:text-sm">{info.bio}</p>
        <div className="flex items-center gap-5 pb-1 text-xs text-zinc-300"><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-pink-400" />{t('creator.followers')} <strong className="text-white">{formatNumber(info.followers)}</strong></span><span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-pink-400" />{t('detail.likes')} <strong className="text-white">{formatNumber(info.likes)}</strong></span></div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-1" role="tablist" aria-label={t('creator.contentSections')}>
          <button id="creator-characters-tab" type="button" role="tab" aria-selected={activeSection === 'characters'} onClick={() => setActiveSection('characters')} className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeSection === 'characters' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">{t('creator.charactersTab')} ({formatNumber(characterTotal)})</span></button>
          <button id="creator-videos-tab" type="button" role="tab" aria-selected={activeSection === 'videos'} onClick={() => setActiveSection('videos')} className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeSection === 'videos' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Video className="h-4 w-4 shrink-0" /><span className="truncate">{t('creator.videosTab')} ({formatNumber(dynamicsTotal)})</span></button>
        </div>
      </div>
      <div className="mobile-modal-scroll flex-1 space-y-8 overflow-y-auto overscroll-contain p-6 custom-scrollbar">
        {loading && <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin text-pink-400" /><span>{t('creator.loading')}</span></div>}
        {error && <SectionError message={error} onRetry={onRetry || onClose} label={t('creator.reload')} />}
        {!loading && !error && <>
          {activeSection === 'characters' && <section className="space-y-4" role="tabpanel" aria-labelledby="creator-characters-tab"><h3 id="creator-characters-title" className="sr-only">{t('creator.characters', { name: authorName })}</h3>{charactersError ? <SectionError message={charactersError} onRetry={onRetryCharacters} label={t('creator.reload')} /> : characters.length === 0 && !charactersLoading ? <div className="py-10 text-center text-xs text-zinc-400">{t('creator.noCharacters')}</div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{characters.map((character) => <CharacterCard key={character.id} character={character} onSelectCharacter={(value) => { onClose(); onSelectCharacter(value); }} onToggleFavorite={onToggleFavorite} />)}</div>}{charactersLoading && <div className="flex justify-center py-3"><LoaderCircle className="h-4 w-4 animate-spin text-pink-400" /></div>}{!charactersLoading && !charactersError && hasMoreCharacters && <div className="flex justify-center"><button type="button" onClick={onLoadMoreCharacters} className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2 text-xs font-semibold text-zinc-200 hover:border-pink-500/50 hover:text-white">{t('creator.loadMore')}</button></div>}</section>}
          {activeSection === 'videos' && <section className="space-y-4" role="tabpanel" aria-labelledby="creator-videos-tab"><h3 id="creator-dynamics-title" className="sr-only">{t('creator.videos', { name: authorName })}</h3>{dynamicsError ? <SectionError message={dynamicsError} onRetry={onRetryDynamics} label={t('creator.reload')} /> : dynamics.length === 0 && !dynamicsLoading ? <div className="py-10 text-center text-xs text-zinc-400">{t('creator.noVideos')}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{dynamics.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><video src={post.media.url} controls preload="metadata" className="aspect-[9/16] w-full bg-black object-cover" /><div className="space-y-2 p-3">{post.caption && <p className="line-clamp-2 text-xs leading-relaxed text-zinc-200">{post.caption}</p>}<div className="flex items-center justify-between"><time className="text-[11px] text-zinc-500" dateTime={post.publishedAt || post.createdAt}>{formatDateTime(post.publishedAt || post.createdAt, { month: 'short', day: 'numeric' })}</time><button type="button" onClick={() => onToggleDynamicLike(post)} className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${post.likedByMe ? 'text-pink-400' : 'text-zinc-400 hover:text-pink-300'}`} title={post.likedByMe ? t('comments.unlike') : t('comments.like')}><Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} /><span>{formatNumber(post.likeCount)}</span></button></div></div></article>)}</div>}{dynamicsLoading && <div className="flex justify-center py-3"><LoaderCircle className="h-4 w-4 animate-spin text-pink-400" /></div>}{!dynamicsLoading && !dynamicsError && hasMoreDynamics && <div className="flex justify-center"><button type="button" onClick={onLoadMoreDynamics} className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2 text-xs font-semibold text-zinc-200 hover:border-pink-500/50 hover:text-white">{t('creator.loadMore')}</button></div>}</section>}
        </>}
      </div>
    </div>
  </div>;
};
