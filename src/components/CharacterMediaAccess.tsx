import {saveWallet} from '../walletActivity';
import {DESIGN_PREVIEW,previewCharacters} from '../previewApi';
import {readMediaAccess,purchaseMedia,MEDIA_ACCESS_KEY} from '../mediaAccess';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Gem, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import { api, ApiError } from '../api';
import type { Character, MediaPhoto, MediaVideo } from '../types';
import { userErrorMessage } from '../utils/userError';

type Translate = (key: string, params?: Record<string, string | number>) => string;
type PendingMedia = { id: string; type: 'image' | 'video'; title: string; cost: number };

export function useCharacterMediaAccess({
  character,
  isAuthenticated,
  onRequireAuth,
  onOpenUpgradeModal,
  t,
}: {
  character: Character;
  isAuthenticated: boolean;
  onRequireAuth?: () => void;
  onOpenUpgradeModal: (notice?: string) => void;
  t: Translate;
}) {
  const [resolvedCharacter, setResolvedCharacter] = useState(character);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<MediaVideo | null>(null);
  const [pending, setPending] = useState<PendingMedia | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const incomingMediaSignature = `${character.galleryLoaded ? '1' : '0'}:${(character.photos || []).map((item) => `${item.id}:${item.locked ? 1 : 0}:${item.url}`).join('|')}:${(character.videos || []).map((item) => `${item.id}:${item.locked ? 1 : 0}:${item.videoUrl || ''}`).join('|')}`;

  useEffect(() => {
    setResolvedCharacter(character);
    setActivePhotoId(null);
    setActiveVideo(null);
    setPending(null);
    setUnlockError('');
  }, [character.id, character.source]);

  useEffect(() => {
    if (character.galleryLoaded) setResolvedCharacter(character);
  }, [character.id, incomingMediaSignature]);

  const [previewAccess,setPreviewAccess]=useState(()=>readMediaAccess(localStorage));
  const previewPeople=DESIGN_PREVIEW?previewCharacters():[];
  const sampleIndex=Math.max(0,previewPeople.findIndex(p=>p.id===character.id));
  const photos:MediaPhoto[]=DESIGN_PREVIEW?Array.from({length:4},(_,i)=>({id:`${character.id}-photo-${i}`,title:`${character.name} · ${i+1}`,url:previewPeople[(sampleIndex+i)%previewPeople.length]?.cardPreview.image?.url||character.avatar,locked:i>0&&!previewAccess.unlocked.includes(`profile:${character.id}-photo-${i}`),unlockCost:20})):resolvedCharacter.photos||[];
  const videos:MediaVideo[]=DESIGN_PREVIEW?Array.from({length:4},(_,i)=>({id:`${character.id}-video-${i}`,title:`${character.name} · ${i+1}`,coverUrl:previewPeople[(sampleIndex+i)%previewPeople.length]?.cardPreview.image?.url||character.avatar,videoUrl:`/mio/motion/${['ren','mizuki','kai','rin'][(sampleIndex+i)%4]}.mp4`,duration:'0:06',locked:i>0&&!previewAccess.unlocked.includes(`profile:${character.id}-video-${i}`),unlockCost:20})):resolvedCharacter.videos||[];
  const accessiblePhotos = useMemo(() => photos.filter((photo) => !photo.locked && photo.url), [photos]);
  const activePhotoIndex = activePhotoId ? accessiblePhotos.findIndex((photo) => photo.id === activePhotoId) : -1;

  const requestUnlock = (media: MediaPhoto | MediaVideo, type: 'image' | 'video') => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setUnlockError('');
    setPending({ id: media.id, type, title: media.title, cost: media.unlockCost || 10 });
  };

  const openPhoto = (photo: MediaPhoto) => {
    if (photo.locked) requestUnlock(photo, 'image');
    else if (photo.url) setActivePhotoId(photo.id);
  };

  const openVideo = (video: MediaVideo) => {
    if (video.locked) requestUnlock(video, 'video');
    else if (video.videoUrl) setActiveVideo(video);
  };

  const confirmUnlock = async () => {
    if (!pending || unlocking) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      if(DESIGN_PREVIEW){const result=purchaseMedia(readMediaAccess(localStorage),`profile:${pending.id}`,pending.cost);if(result.error)throw new Error(result.error);saveWallet(result.state);setPreviewAccess(result.state);if(pending.type==='image')setActivePhotoId(pending.id);else{const found=videos.find(v=>v.id===pending.id);if(found)setActiveVideo({...found,locked:false})}setPending(null);return;}
      await api.characters.unlockMedia(resolvedCharacter.id, pending.id);
      const detail = await api.characters.get(resolvedCharacter.id);
      setResolvedCharacter(detail);
      if (pending.type === 'image') {
        const photo = detail.photos?.find((item) => item.id === pending.id);
        if (photo && !photo.locked && photo.url) setActivePhotoId(photo.id);
      } else {
        const video = detail.videos?.find((item) => item.id === pending.id);
        if (video && !video.locked && video.videoUrl) setActiveVideo(video);
      }
      setPending(null);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'INSUFFICIENT_DIAMONDS') {
        const required = Number(reason.fields.required ?? pending.cost);
        const current = Number(reason.fields.current ?? 0);
        setPending(null);
        onOpenUpgradeModal(t('mediaUnlock.insufficient', { required, current }));
      } else {
        setUnlockError(userErrorMessage(reason, t, 'mediaUnlock.failed'));
      }
    } finally {
      setUnlocking(false);
    }
  };

  return {
    character: { ...character, photos: resolvedCharacter.photos, videos: resolvedCharacter.videos, galleryLoaded: resolvedCharacter.galleryLoaded },
    photos,
    videos,
    activePhoto: activePhotoIndex >= 0 ? accessiblePhotos[activePhotoIndex] : null,
    activePhotoIndex,
    accessiblePhotos,
    activeVideo,
    pending,
    unlocking,
    unlockError,
    openPhoto,
    openVideo,
    closePhoto: () => setActivePhotoId(null),
    closeVideo: () => setActiveVideo(null),
    previousPhoto: () => {
      if (!accessiblePhotos.length || activePhotoIndex < 0) return;
      setActivePhotoId(accessiblePhotos[(activePhotoIndex - 1 + accessiblePhotos.length) % accessiblePhotos.length].id);
    },
    nextPhoto: () => {
      if (!accessiblePhotos.length || activePhotoIndex < 0) return;
      setActivePhotoId(accessiblePhotos[(activePhotoIndex + 1) % accessiblePhotos.length].id);
    },
    cancelUnlock: () => !unlocking && setPending(null),
    confirmUnlock,
  };
}

export function LockedMediaOverlay({ cost, busy = false, t }: { cost: number; busy?: boolean; t: Translate }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 px-3 text-center backdrop-blur-[2px]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
      </span>
      <span className="mt-3 text-sm font-black text-white">{t('mediaUnlock.view')}</span>
      <span className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-amber-400/20 px-3 text-xs font-black text-amber-200 ring-1 ring-amber-300/25">
        <Gem className="h-3.5 w-3.5" />
        {cost} {t('mediaUnlock.diamonds')}
      </span>
    </div>
  );
}

export function MediaUnlockDialog({ pending, busy, error, onCancel, onConfirm, t }: {
  pending: PendingMedia | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  t: Translate;
}) {
  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="media-unlock-title">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171721] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="media-unlock-title" className="text-base font-black text-white">{t('mediaUnlock.confirmTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{t('mediaUnlock.confirmBody', { cost: pending.cost })}</p>
          </div>
        </div>
        {error && <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 flex-1 rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-zinc-200 hover:bg-white/[0.1] disabled:opacity-50">{t('common.cancel')}</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="min-h-11 flex-1 rounded-xl bg-pink-500 px-4 text-sm font-black text-white shadow-[0_10px_28px_rgba(236,72,153,0.28)] hover:bg-pink-400 disabled:opacity-60">
            {busy ? t('mediaUnlock.unlocking') : t('mediaUnlock.confirm', { cost: pending.cost })}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PhotoLightbox({ photo, index, total, onClose, onPrevious, onNext }: {
  photo: MediaPhoto | null;
  index: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 p-3 sm:p-5" role="dialog" aria-modal="true">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 py-2 text-white">
        <div className="min-w-0"><p className="text-xs text-zinc-400">{index + 1} / {total}</p></div>
        <button type="button" onClick={onClose} className="mobile-touch-target flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center">
        {total > 1 && <button type="button" onClick={onPrevious} className="mobile-touch-target absolute left-1 z-10 flex items-center justify-center rounded-full bg-black/65 text-white hover:bg-pink-500 sm:left-3" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>}
        <img src={photo.url} alt={photo.title} className="max-h-full max-w-full object-contain" />
        {total > 1 && <button type="button" onClick={onNext} className="mobile-touch-target absolute right-1 z-10 flex items-center justify-center rounded-full bg-black/65 text-white hover:bg-pink-500 sm:right-3" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>}
      </div>
    </div>
  );
}

export function VideoLightbox({ video, onClose, t }: { video: MediaVideo | null; onClose: () => void; t: Translate }) {
  if (!video?.videoUrl) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-3 sm:p-5" role="dialog" aria-modal="true">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#141420] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div aria-hidden="true" />
          <button type="button" onClick={onClose} className="mobile-touch-target flex items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white" aria-label={t('common.close')}><X className="h-5 w-5" /></button>
        </div>
        <div className="aspect-video bg-black"><video src={video.videoUrl} poster={video.coverUrl} controls autoPlay playsInline className="h-full w-full object-contain" /></div>
      </div>
    </div>
  );
}
