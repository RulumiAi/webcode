import React, { memo, useEffect, useState } from 'react';
import { 
  X, 
  Sparkles, 
  Heart, 
  Eye, 
  Play, 
  MessageCircle, 
  User, 
  Image as ImageIcon, 
  Film, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  Tag,
  Volume2,
  VolumeX,
  LoaderCircle,
  Share2,
  Check,
  Wallpaper,
  Crown
} from 'lucide-react';
import { Character } from '../types';
import { api, ApiError, ApiChatThread, ApiChatVoice } from '../api';
import { useLocale } from '../i18n';
import { getCreateCharacterVoices } from '../data/createCharacterVoices';
import { ExpandableDescription } from './ExpandableDescription';
import { CharacterComments } from './CharacterComments';
import { LockedMediaOverlay, MediaUnlockDialog, useCharacterMediaAccess } from './CharacterMediaAccess';
import { userErrorMessage } from '../utils/userError';
import type { MembershipPlanId } from '../data/membershipProducts';

const voiceSamplePreloads = new Map<string, HTMLAudioElement>();

interface CharacterDetailPanelProps {
  character: Character;
  onClose: () => void;
  onOpenUpgradeModal: (notice?: string) => void;
  onOpenQuickUpgradeModal?: (notice?: string, featureLabel?: string) => void;
  onSetChatBg?: (bgUrl: string) => void;
  activeChatBg?: string;
  onOpenScenarioTheater?: () => void;
  threadId?: string;
  currentVoiceId?: string;
  onVoiceChanged?: (thread: ApiChatThread) => void;
  onVoicePreview?: (voiceId: string, previewUrl: string) => void;
  previewVoiceId?: string | null;
  previewLoadingVoiceId?: string | null;
  previewError?: string | null;
  voiceSyncing?: boolean;
  voiceSyncError?: string | null;
  isAuthenticated: boolean;
  membershipTier?: MembershipPlanId | null;
  membershipFeatureKeys?: string[];
  onRequireAuth?: () => void;
  onCommentCountChange: (characterId: string, count: number) => void;
}

export const CharacterDetailPanel = memo(({
  character: initialCharacter,
  onClose,
  onOpenUpgradeModal,
  onOpenQuickUpgradeModal,
  onSetChatBg,
  activeChatBg,
  onOpenScenarioTheater,
  threadId,
  currentVoiceId,
  onVoiceChanged,
  onVoicePreview,
  previewVoiceId = null,
  previewLoadingVoiceId = null,
  previewError = null,
  voiceSyncing = false,
  voiceSyncError = null,
  isAuthenticated,
  membershipTier = null,
  membershipFeatureKeys = [],
  onRequireAuth,
  onCommentCountChange,
}: CharacterDetailPanelProps) => {
  const { locale, t, formatNumber } = useLocale();
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'videos' | 'comments'>('info');
  const mediaAccess = useCharacterMediaAccess({
    character: initialCharacter,
    isAuthenticated,
    onRequireAuth,
    onOpenUpgradeModal,
    t,
  });
  const character = mediaAccess.character;
  const activePhoto = mediaAccess.activePhoto;
  const activeVideo = mediaAccess.activeVideo;

  useEffect(() => {
    setActiveTab('info');
  }, [character.id, character.source]);

  // Selected AI voice style per character
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(currentVoiceId || '');
  const [backendVoices, setBackendVoices] = useState<Array<{
    id: string;
    name: string;
    isFree: boolean;
    previewUrl: string | null;
    requiredMembershipFeature: string | null;
  }>>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isApiChat = character.source === 'api' && Boolean(threadId);

  const [switchingVoiceId, setSwitchingVoiceId] = useState<string | null>(null);

  const photos = mediaAccess.photos;
  const videos = mediaAccess.videos;

  const staticVoiceOptions = [
    {
      id: 'default',
      name: t('panel.voice'),
      isFree: true,
      previewUrl: null,
      requiredMembershipFeature: null,
    },
    {
      id: 'sweet',
      name: t('panel.voice'),
      isFree: false,
      previewUrl: null,
      requiredMembershipFeature: 'chatVoiceStyles',
    },
    {
      id: 'mature',
      name: t('panel.voice'),
      isFree: false,
      previewUrl: null,
      requiredMembershipFeature: 'chatVoiceStyles',
    },
    {
      id: 'whisper',
      name: t('panel.voice'),
      isFree: false,
      previewUrl: null,
      requiredMembershipFeature: 'chatVoiceStyles',
    },
    {
      id: 'tsundere',
      name: t('panel.voice'),
      isFree: false,
      previewUrl: null,
      requiredMembershipFeature: 'chatVoiceStyles',
    },
    {
      id: 'anime',
      name: t('panel.voice'),
      isFree: false,
      previewUrl: null,
      requiredMembershipFeature: 'chatVoiceStyles',
    },
  ];
  const voiceOptions = isApiChat
    ? backendVoices
    : staticVoiceOptions.filter((voice) => voice.id === 'default');

  React.useEffect(() => {
    if (!threadId) return;
    let active = true;
    void api.chat.voices(threadId, locale).then((catalog) => {
      if (!active) return;
      const localizedNames = new Map(
        getCreateCharacterVoices(character.gender || 'all', catalog.voices)
          .map((voice) => [voice.voiceId, t(voice.displayNameKey)]),
      );
      const voices = catalog.voices.map((voice, index) => ({
        id: voice.voiceId,
        name: localizedNames.get(voice.voiceId) || voice.name,
        isFree: voice.isFree ?? index === 0,
        previewUrl: voice.previewUrl,
        requiredMembershipFeature: voice.requiredMembershipFeature ?? (index === 0 ? null : 'chatVoiceStyles'),
      }));
      setBackendVoices(voices);
      catalog.voices.forEach((voice: ApiChatVoice) => {
        if (!voice.previewUrl || voiceSamplePreloads.has(voice.previewUrl)) return;
        const sample = new Audio(voice.previewUrl);
        sample.preload = 'auto';
        sample.load();
        voiceSamplePreloads.set(voice.previewUrl, sample);
      });
      const defaultVoiceId = voices[0]?.id || catalog.defaultVoiceId;
      setVoiceError(null);
      setSelectedVoiceId(currentVoiceId || defaultVoiceId);
    }).catch((reason) => {
      if (active) setVoiceError(userErrorMessage(reason, t, 'panel.voiceUnavailable'));
    });
    return () => { active = false; };
  }, [threadId, locale, character.gender]);

  React.useEffect(() => {
    if (currentVoiceId) setSelectedVoiceId(currentVoiceId);
  }, [currentVoiceId, threadId]);

  const hasVoiceAccess = (voice: { isFree: boolean; requiredMembershipFeature: string | null }) => (
    voice.isFree
    || Boolean(
      membershipTier
      && voice.requiredMembershipFeature
      && membershipFeatureKeys.includes(voice.requiredMembershipFeature),
    )
  );

  const openVoiceMembership = (voiceName: string) => {
    const notice = t('panel.voiceMembershipRequired');
    const featureLabel = `${t('panel.premiumVoice')}: ${voiceName}`;
    if (onOpenQuickUpgradeModal) onOpenQuickUpgradeModal(notice, featureLabel);
    else onOpenUpgradeModal(notice);
  };

  const handleSelectVoice = (voice: (typeof voiceOptions)[number]) => {
    if (!isApiChat) return;
    if (!hasVoiceAccess(voice)) {
      openVoiceMembership(voice.name);
      return;
    }
    if (!threadId) return;
    setSwitchingVoiceId(voice.id);
    void api.chat.threads.setVoice(threadId, voice.id).then((thread) => {
      setSelectedVoiceId(thread.voice.voiceId);
      onVoiceChanged?.(thread);
      setVoiceError(null);
    }).catch((reason) => {
      if (reason instanceof ApiError && reason.code === 'MEMBERSHIP_REQUIRED') openVoiceMembership(voice.name);
      else setVoiceError(userErrorMessage(reason, t, 'panel.voiceUnavailable'));
    })
      .finally(() => setSwitchingVoiceId(null));
  };

  return (
    <aside className="w-full sm:w-[360px] md:w-[390px] bg-[#12121c] border-l border-zinc-800/80 flex flex-col h-full overflow-hidden shadow-2xl relative z-30 shrink-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#171724] border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-white text-sm">{t('panel.title')}</h3>
        </div>
        <button
          onClick={onClose}
          className="mobile-touch-target flex items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
          title={t('panel.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Header Area */}
      <div className="relative shrink-0 bg-gradient-to-b from-[#1a1a2e] to-[#12121c] p-4 border-b border-zinc-800/60">
        <div className="flex items-start gap-3">
          <div className="relative group shrink-0">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-pink-500/50 shadow-xl group-hover:scale-105 transition-all duration-300"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center ring-2 ring-zinc-700 shadow-xl">
                <User className="w-7 h-7 text-zinc-500" />
              </div>
            )}
            {character.isHot && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                HOT
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-black text-white text-lg tracking-tight truncate">
                {character.name}
              </h2>
              <span className="text-xs text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full font-bold border border-pink-500/20">
                {character.ageStatus === 'secret' ? 'Secret' : (character.age == null ? '—' : character.age)}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1 line-clamp-1 font-medium">
              {t('panel.author')}: <span className="text-pink-400 hover:underline">{character.author}</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                <span>{(character.likes / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatNumber(character.chatCount)} {t('panel.chats')}</span>
              </div>
              {character.source === 'api' && (
                <div className="flex items-center gap-1 text-pink-300">
                  <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                  <span>{formatNumber(character.commentCount)} {t('comments.tab')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {character.warningBadge && (
          <div className="mt-3">
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm ${character.badgeColor || 'bg-amber-500/80 text-black'}`}>
              {character.warningBadge}
            </span>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex shrink-0 overflow-x-auto border-b border-zinc-800 bg-[#161622] px-2 pt-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('info')}
          className={`mobile-touch-target min-w-[4.75rem] flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'info'
              ? 'text-pink-400 border-pink-500 bg-[#12121c]'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t('detail.info')}</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`mobile-touch-target min-w-[4.75rem] flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'photos'
              ? 'text-pink-400 border-pink-500 bg-[#12121c]'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t('detail.photos')}</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`mobile-touch-target min-w-[4.75rem] flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'videos'
              ? 'text-pink-400 border-pink-500 bg-[#12121c]'
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }`}
        >
          <Film className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t('detail.videos')}</span>
        </button>

        {character.source === 'api' && (
          <button
            onClick={() => setActiveTab('comments')}
            className={`mobile-touch-target min-w-[4.75rem] flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all border-b-2 ${
              activeTab === 'comments'
                ? 'text-pink-400 border-pink-500 bg-[#12121c]'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t('comments.tab')}</span>
            <span className="shrink-0 rounded-full border border-pink-500/30 bg-pink-500/10 px-1 text-[9px]">{formatNumber(character.commentCount)}</span>
          </button>
        )}
      </div>

      {/* Main Tab Content - Scrollable */}
        <div className="mobile-modal-scroll flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 custom-scrollbar">
        {/* Tab 1: Info & Lore */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-xs animate-in fade-in duration-200">
            {/* Interactive Scenarios Banner */}
            {onOpenScenarioTheater && (
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-[#181824] p-3.5 rounded-2xl border border-pink-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>{t('panel.scenes')}</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/40 font-bold">
                          {t('panel.sceneCount', { count: character.scenarios?.length || 2 })}
                        </span>
                      </h4>
                      <p className="text-[10px] text-pink-300/80">
                        {t('panel.sceneHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenScenarioTheater}
                  className="mobile-touch-target w-full rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 px-3 text-xs font-extrabold text-white shadow-md shadow-pink-600/20 transition-all hover:brightness-110 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('panel.unlockStory', { name: character.name })}</span>
                </button>
              </div>
            )}

            {/* Frontend display description */}
            <div className="bg-[#181824] p-3.5 rounded-xl border border-zinc-800/80 space-y-1.5">
              <ExpandableDescription
                description={character.displayDescription || character.description}
                emptyLabel={t('detail.noDetails')}
                viewMoreLabel={t('detail.viewMore')}
                collapseLabel={t('detail.collapse')}
                textClassName="text-zinc-300 leading-relaxed text-xs"
                surfaceClassName="bg-gradient-to-l from-[#181824] via-[#181824] to-transparent"
              />
            </div>

            {/* Tags */}
            <div className="bg-[#181824] p-3.5 rounded-xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Tag className="w-4 h-4 text-pink-400" />
                <span>{t('detail.tags')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {character.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Voice Selector Section */}
            <div className="bg-[#181824] p-3.5 rounded-2xl border border-zinc-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <span>{t('panel.voice')}</span>
                      {isApiChat ? (
                        <span className="text-[9px] bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black px-1.5 py-0.2 rounded-full">
                          {t('panel.voiceApi')}
                        </span>
                      ) : (
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-full border border-zinc-700">
                          {t('panel.voiceCatalog')}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {isApiChat ? t('panel.voiceHint') : t('panel.voiceUnavailable')}
                    </p>
                  </div>
                </div>

                {isApiChat && (voiceError || voiceSyncError || previewError) && (
                  <span className="text-[10px] text-rose-300 max-w-[11rem] text-right">{voiceError || voiceSyncError || previewError}</span>
                )}
              </div>

              {/* Voice list */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {voiceOptions.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  const isLocked = isApiChat && !voice.isFree && !hasVoiceAccess(voice);
                  const isPreviewPlaying = previewVoiceId === voice.id;
                  const isPreviewLoading = previewLoadingVoiceId === voice.id;
                  const isSwitching = switchingVoiceId === voice.id || (voiceSyncing && voice.id === voiceOptions[0]?.id);
                  const previewLabel = !voice.previewUrl
                    ? t('panel.previewUnavailable')
                    : isPreviewLoading
                    ? t('panel.previewLoading')
                    : isPreviewPlaying ? t('panel.stopPreview') : t('panel.previewVoice', { voice: voice.name });
                  const voiceLabel = (
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isLocked
                          ? 'bg-zinc-800/80 text-zinc-500'
                          : isSelected
                          ? 'border border-pink-500/40 bg-pink-500/20 text-pink-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isPreviewLoading ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : isPreviewPlaying ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`min-w-0 break-words text-left text-xs font-bold ${
                        isLocked ? 'text-zinc-300' : isSelected ? 'text-white' : 'text-zinc-200'
                      }`}>
                        {voice.name}
                      </span>
                    </div>
                  );

                  if (isLocked) {
                    return (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() => openVoiceMembership(voice.name)}
                        className="group flex min-h-14 w-full items-center justify-between gap-2 rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-2.5 text-left transition-colors hover:border-amber-500/35 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181824]"
                        aria-label={`${t('panel.unlockPremiumVoice')}: ${voice.name}`}
                        title={t('panel.unlockPremiumVoice')}
                      >
                        {voiceLabel}
                        <span className="flex min-h-11 w-[6.5rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] font-bold text-amber-300 transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-500/15 group-hover:text-amber-200">
                          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('panel.unlockVoiceShort')}</span>
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={voice.id}
                      className={`relative flex min-h-14 items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-transparent border-pink-500/60 shadow-lg shadow-pink-950/20 ring-1 ring-pink-500/30'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-pink-500/40'
                      }`}
                    >
                      {voiceLabel}

                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        {isApiChat && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (voice.previewUrl) onVoicePreview?.(voice.id, voice.previewUrl);
                            }}
                            disabled={!threadId || voiceSyncing || Boolean(switchingVoiceId) || isPreviewLoading || !voice.previewUrl}
                            className="mobile-touch-target flex items-center justify-center rounded-lg bg-zinc-800 px-2 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={previewLabel}
                            title={previewLabel}
                          >
                            {isPreviewLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : isPreviewPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectVoice(voice);
                          }}
                          disabled={isSelected || voiceSyncing || Boolean(switchingVoiceId)}
                          className={`mobile-touch-target whitespace-nowrap rounded-lg px-2.5 text-[10px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? 'bg-pink-500 text-white shadow'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          {isSwitching ? t('panel.switching') : isSelected ? t('panel.used') : t('panel.switch')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Instruction / Prompt preview */}
            <div className="bg-[#181824] p-3.5 rounded-xl border border-zinc-800/80 space-y-1.5">
              <span className="text-zinc-400 font-bold block text-[11px]">
                {t('detail.prompt')}:
              </span>
              <p className="font-mono text-[11px] text-zinc-400 bg-[#0e0e17] p-2.5 rounded-lg border border-zinc-800 leading-relaxed line-clamp-3">
                {character.source === 'api' ? t('panel.hiddenPrompt') : character.systemInstruction}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Photos Gallery */}
        {activeTab === 'photos' && (
          <div className="animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{t('panel.photosCount')}</span>
              <span className="text-[10px] text-pink-400">{t('panel.photoHint')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((photo) => {
                const isCurrentBg = !photo.locked && activeChatBg === photo.url;
                return (
                  <div
                    key={photo.id}
                    onClick={() => mediaAccess.openPhoto(photo)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer shadow-md hover:border-pink-500/50 transition-all duration-300"
                  >
                    <img
                      src={photo.locked ? photo.previewUrl || photo.url : photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />

                    {isCurrentBg && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold text-[9px] shadow backdrop-blur-sm flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t('panel.currentBackground')}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                        <div className="flex items-center gap-1 text-[10px] text-rose-300">
                          <Heart className="w-3 h-3 fill-rose-300" />
                          <span>{photo.likes || 0}</span>
                        </div>

                        {onSetChatBg && !photo.locked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetChatBg(photo.url);
                            }}
                            className={`mobile-touch-target rounded px-2 text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isCurrentBg
                                ? 'bg-emerald-500 text-white'
                                : 'bg-pink-500 hover:bg-pink-600 text-white'
                            }`}
                          >
                            <Wallpaper className="w-3 h-3" />
                            <span>{isCurrentBg ? t('panel.currentBackground') : t('panel.setBackground')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    {photo.locked && <LockedMediaOverlay cost={photo.unlockCost || 10} t={t} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Videos Gallery */}
        {activeTab === 'videos' && (
          <div className="animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{t('panel.videosCount')}</span>
              <span className="text-[10px] text-pink-400">{t('panel.videoHint')}</span>
            </div>

            <div className="space-y-3">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => mediaAccess.openVideo(vid)}
                  className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer hover:border-pink-500/60 transition-all shadow-lg"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={vid.coverUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {vid.duration}
                    </span>
                    {vid.locked && <LockedMediaOverlay cost={vid.unlockCost || 10} t={t} />}
                  </div>

                  <div className="p-3 bg-[#181824] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {vid.views || '10k+'} {t('panel.views')} • {vid.likes || 500} {t('panel.likes')}
                      </p>
                    </div>

                    <span className="text-[10px] text-pink-400 font-bold bg-pink-500/10 px-2 py-1 rounded-lg border border-pink-500/20">
                      {t('panel.play')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comments' && character.source === 'api' && (
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

      {/* Footer Unlock Story Action */}
      <div className="p-4 bg-[#161622] border-t border-zinc-800 shrink-0">
        <button
          onClick={() => onOpenUpgradeModal()}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{t('panel.unlockVideo', { name: character.name })}</span>
        </button>
      </div>

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div className="safe-area-top fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 p-3 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4">
          <div className="w-full max-w-2xl flex items-center justify-between text-white py-2">
            <div>
              <p className="text-xs text-zinc-400">
                {mediaAccess.activePhotoIndex + 1} / {mediaAccess.accessiblePhotos.length}
              </p>
            </div>
            <button
              onClick={mediaAccess.closePhoto}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full max-w-2xl my-2">
            <button
              onClick={mediaAccess.previousPhoto}
              className="absolute left-2 z-10 p-2 rounded-full bg-black/60 hover:bg-pink-600 text-white transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-zinc-800"
            />

            <button
              onClick={mediaAccess.nextPhoto}
              className="absolute right-2 z-10 p-2 rounded-full bg-black/60 hover:bg-pink-600 text-white transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-zinc-300 text-xs pb-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-rose-600 hover:text-white transition-all">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>{activePhoto.likes || 0} {t('panel.likes')}</span>
            </button>

            {onSetChatBg && (
              <button
                onClick={() => {
                  onSetChatBg(activePhoto.url);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold transition-all shadow-lg ${
                  activeChatBg === activePhoto.url
                    ? 'bg-emerald-500 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                <Wallpaper className="w-4 h-4" />
                <span>
                  {activeChatBg === activePhoto.url
                    ? t('panel.chatBackgroundSet')
                    : t('panel.setChatBackground')}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="safe-area-top fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4">
          <div className="flex max-h-[calc(100dvh-16px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#141420] shadow-2xl">
            <div className="p-3 bg-[#181826] flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
              </div>
              <button
                onClick={mediaAccess.closeVideo}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideo.videoUrl}
                poster={activeVideo.coverUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                {t('panel.videoUnsupported')}
              </video>
            </div>

            <div className="p-4 bg-[#141420] flex items-center justify-between text-xs text-zinc-300">
              <div>
                <p className="font-bold text-white">{t('panel.videoClip', { name: character.name })}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {t('panel.duration')}: {activeVideo.duration} • {t('panel.views')}: {activeVideo.views}
                </p>
              </div>

              <button
                onClick={() => onOpenUpgradeModal()}
                className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow transition-all"
              >
                {t('panel.download')}
              </button>
            </div>
          </div>
        </div>
      )}
      <MediaUnlockDialog
        pending={mediaAccess.pending}
        busy={mediaAccess.unlocking}
        error={mediaAccess.unlockError}
        onCancel={mediaAccess.cancelUnlock}
        onConfirm={mediaAccess.confirmUnlock}
        t={t}
      />
    </aside>
  );
});
