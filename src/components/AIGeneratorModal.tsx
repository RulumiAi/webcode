import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Wand2, 
  Download, 
  Copy, 
  Check, 
  Upload, 
  Sliders, 
  Volume2, 
  Film, 
  Layers, 
  UserCheck, 
  Sparkle,
  Share2,
  Heart,
  Play,
  Wallpaper,
  Tag,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  Crown,
  Gem,
} from 'lucide-react';
import {
  GENERATOR_DEFAULT_IMAGE,
  outfitPresets,
  posePresets,
  scenePresets,
} from '../data/generatorPresets';
import { buildGeneratorPrompts, buildGeneratorApiPrompt, DEFAULT_CUSTOM_PROMPT } from '../utils/generatorPrompt';
import { api, ApiError, type ApiChatVoice, type ApiGenerationCreateRequest, type ApiGenerationJob, type ApiGenerationOptions, type ApiGenerationTarget, type ApiMedia, type GeneratedImageDraft } from '../api';
import type { Character } from '../types';
import { useLocale } from '../i18n';
import {
  createPresetScrollPositions,
  getPresetScrollPosition,
  updatePresetScrollPosition,
  type PresetTab,
} from '../utils/presetCarouselScroll';
import { localizedPresetName } from '../utils/generatorPresetLocalization';
import { getVoiceDisplayNameKey } from '../data/createCharacterVoices';
import { CreateCharacterModal } from './CreateCharacterModal';
import { getDefaultCreateCharacterPresetSelections, serializeCreateCharacterPresetSelections } from '../data/createCharacterPresets';
import type { PaymentAccount } from '../data/membershipProducts';
import {waitForGenerationJob} from '../utils/generationPolling';
import {userErrorCodeMessage, userErrorMessage} from '../utils/userError';

interface AIGeneratorModalProps {
  isOpen: boolean;
  presentation?: 'dialog' | 'page' | 'workspace';
  isAuthenticated?: boolean;
  onClose: () => void;
  onRequireAuth?: () => void;
  onOpenUpgradeModal?: (notice?: string) => void;
  onOpenRechargeModal?: () => void;
  onOpenQuickUpgradeModal?: (notice?: string, featureLabel?: string) => void;
  membershipFeatureKeys?: string[];
  publicCharacters?: Character[];
  onCharacterCreated?: (character: Character) => void;
  onOpenCharacterDetail?: (character: Character) => void;
  onSetChatBg?: (url: string) => void;
  onCommunityPublished?: () => void;
  onMobileSecondaryViewChange?: (isSecondaryView: boolean) => void;
}

type MobileGeneratorStepId = 'mode' | 'source' | 'prompt' | 'dialogue' | 'settings';
type MobileGeneratorView = 'home' | 'wizard' | 'result';
type MobileHistoryFilter = 'all' | 'image' | 'video';
type GeneratorSubMode = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'extend';

const CHARACTER_DRAFT_ERROR_KEYS: Record<string, string> = {
  UPSTREAM_TIMEOUT: 'create.fromImageDraftTimeout',
  RATE_LIMITED: 'create.fromImageDraftRateLimited',
  UPSTREAM_UNAVAILABLE: 'create.fromImageDraftUnavailable',
  UPSTREAM_INVALID_RESPONSE: 'create.fromImageDraftInvalid',
  UPSTREAM_REJECTED: 'create.fromImageDraftRejected',
};

function characterDraftErrorMessage(reason: unknown, translate: (key: string) => string) {
  if (!(reason instanceof ApiError)) return translate('create.fromImageDraftError');
  return translate(CHARACTER_DRAFT_ERROR_KEYS[reason.code] || 'create.fromImageDraftError');
}

const getMobileGeneratorStepIds = (mainMode: 'image' | 'video', subMode: GeneratorSubMode): MobileGeneratorStepId[] => {
  const needsSource = ['image-to-image', 'image-to-video'].includes(subMode)
    || (mainMode === 'video' && subMode === 'extend');
  const needsDialogue = mainMode === 'video' && subMode === 'image-to-video';
  return [
    'mode',
    ...(needsSource ? ['source' as const] : []),
    'prompt',
    ...(needsDialogue ? ['dialogue' as const] : []),
    'settings',
  ];
};

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  presentation = 'dialog',
  isAuthenticated = false,
  onClose,
  onRequireAuth,
  onOpenUpgradeModal,
  onOpenRechargeModal,
  onOpenQuickUpgradeModal,
  membershipFeatureKeys = [],
  publicCharacters = [],
  onCharacterCreated,
  onOpenCharacterDetail,
  onSetChatBg,
  onCommunityPublished,
  onMobileSecondaryViewChange,
}) => {
  const { locale, t, formatNumber } = useLocale();
  const isMobilePage = presentation === 'page';
  const isWorkspace = presentation === 'workspace';
  const GeneratorHeading = isMobilePage || isWorkspace ? 'h1' : 'h2';
  // Main mode: 'image' | 'video'
  const [mainMode, setMainMode] = useState<'image' | 'video'>('image');
  const [mobileGeneratorStep, setMobileGeneratorStep] = useState(0);
  const [mobileGeneratorView, setMobileGeneratorView] = useState<MobileGeneratorView>(isMobilePage ? 'home' : 'wizard');
  const [mobileHistoryFilter, setMobileHistoryFilter] = useState<MobileHistoryFilter>('all');

  useEffect(() => {
    if (!isMobilePage) return;
    onMobileSecondaryViewChange?.(mobileGeneratorView !== 'home');
  }, [isMobilePage, mobileGeneratorView, onMobileSecondaryViewChange]);

  // Sub-modes:
  // For image: 'text-to-image' | 'image-to-image'
  // For video: 'text-to-video' | 'image-to-video' | 'extend'
  const [subMode, setSubMode] = useState<GeneratorSubMode>('text-to-image');

  // Main image style selector ('anime' | 'realistic')
  const [imageStyle, setImageStyle] = useState<'anime' | 'realistic'>('anime');

  // Selected Style Presets
  const [selectedPose, setSelectedPose] = useState<string | null>(posePresets[0]?.id ?? null);
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(outfitPresets[0]?.id ?? null);
  const [selectedScene, setSelectedScene] = useState<string | null>(scenePresets[0]?.id ?? null);

  // Active Category tab for Presets: 'pose' | 'outfit' | 'scene'
  const [activePresetTab, setActivePresetTab] = useState<'pose' | 'outfit' | 'scene'>('pose');

  // Ref for 2-row horizontal scroll preset carousel
  const presetScrollRef = useRef<HTMLDivElement>(null);
  const presetScrollPositionsRef = useRef(createPresetScrollPositions());

  const rememberPresetScrollPosition = () => {
    const scrollTarget = presetScrollRef.current;
    if (!scrollTarget) return;

    presetScrollPositionsRef.current = updatePresetScrollPosition(
      presetScrollPositionsRef.current,
      activePresetTab,
      scrollTarget.scrollLeft,
    );
  };

  const handlePresetTabChange = (nextTab: PresetTab) => {
    rememberPresetScrollPosition();
    setActivePresetTab(nextTab);
  };

  const scrollPresetsLeft = () => {
    if (presetScrollRef.current) {
      presetScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollPresetsRight = () => {
    if (presetScrollRef.current) {
      presetScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  useLayoutEffect(() => {
    const scrollTarget = presetScrollRef.current;
    if (!scrollTarget) return;

    scrollTarget.scrollLeft = getPresetScrollPosition(
      presetScrollPositionsRef.current,
      activePresetTab,
    );
  }, [activePresetTab, isOpen]);

  // Custom Prompt Input
  const [customPrompt, setCustomPrompt] = useState('');

  // Audio / Speech Dialogue Input (For Video mode)
  const [dialogueText, setDialogueText] = useState('');
  const [voices, setVoices] = useState<ApiChatVoice[]>([]);
  const [defaultVoiceId, setDefaultVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Advanced Settings State
  const [quality, setQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [duration, setDuration] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<string>('3:4');
  
  const [useSeed, setUseSeed] = useState<boolean>(false);
  const [seedValue, setSeedValue] = useState<number>(7832941);

  // Generation status state
  const [generating, setGenerating] = useState<boolean>(false);
  const [genProgress, setGenProgress] = useState<number>(0);
  const [genStepText, setGenStepText] = useState<string>('');
  const [generationJob, setGenerationJob] = useState<ApiGenerationJob | null>(null);
  const [generationOptions, setGenerationOptions] = useState<ApiGenerationOptions | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [sourceMediaId, setSourceMediaId] = useState<string | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [sourceTarget, setSourceTarget] = useState<ApiGenerationTarget | null>(null);
  const [sourceUploadPending, setSourceUploadPending] = useState(false);
  const [extendVideoFile, setExtendVideoFile] = useState<File | null>(null);
  const [extendVideoUrl, setExtendVideoUrl] = useState<string | null>(null);
  const [extendVideoError, setExtendVideoError] = useState<string | null>(null);
  const [extendVideoMediaId, setExtendVideoMediaId] = useState<string | null>(null);
  const [extendVideoUploadPending, setExtendVideoUploadPending] = useState(false);
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [targetItems, setTargetItems] = useState<ApiGenerationTarget[]>([]);
  const [targetPage, setTargetPage] = useState(0);
  const [targetTotal, setTargetTotal] = useState(0);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targetQuery, setTargetQuery] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'created' | 'liked'>('all');
  const [targetGender, setTargetGender] = useState<'all' | 'female' | 'male' | 'nonbinary'>('all');
  const [targetStyle, setTargetStyle] = useState<'all' | 'realistic' | 'anime'>('all');
  const [targetAgeGroup, setTargetAgeGroup] = useState<'all' | 'teen' | 'young' | 'adult' | 'mature'>('all');
  const targetPickerScrollRef = useRef<HTMLDivElement>(null);
  const targetSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRequestAbortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extendVideoInputRef = useRef<HTMLInputElement>(null);
  const extendVideoUrlRef = useRef<string | null>(null);
  const extendVideoUploadIdRef = useRef(0);
  const generationAbortRef = useRef<AbortController | null>(null);
  const visiblePromptRef = useRef('');

  // Toast notice
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [sharingOutputId, setSharingOutputId] = useState<string | null>(null);

  // Active Output State
  type GeneratedOutput = {
    id: string;
    type: 'image' | 'video';
    url: string;
    promptUsed: string;
    generationPrompt?: string;
    isShared?: boolean;
    mediaId: string;
    jobId: string;
  };
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedOutput | null>(null);
  const [characterPrototypeSource, setCharacterPrototypeSource] = useState<GeneratedOutput | null>(null);
  const [characterPrototypeDraft, setCharacterPrototypeDraft] = useState<GeneratedImageDraft | null>(null);
  const [characterPrototypeDraftLoading, setCharacterPrototypeDraftLoading] = useState(false);
  const [characterPrototypeDraftError, setCharacterPrototypeDraftError] = useState<string | null>(null);
  const characterPrototypeDraftAbortRef = useRef<AbortController | null>(null);
  const characterPrototypeDraftRequestRef = useRef(0);

  // Recent creations gallery list
  const [historyWorks, setHistoryWorks] = useState<Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    prompt: string;
    time: string;
    mediaId: string;
    jobId: string;
  }>>([]);

  const [copied, setCopied] = useState(false);

  const requestCharacterPrototypeDraft = useCallback(async (source: GeneratedOutput) => {
    characterPrototypeDraftAbortRef.current?.abort();
    const controller = new AbortController();
    const requestId = characterPrototypeDraftRequestRef.current + 1;
    characterPrototypeDraftRequestRef.current = requestId;
    characterPrototypeDraftAbortRef.current = controller;
    setCharacterPrototypeDraft(null);
    setCharacterPrototypeDraftError(null);
    setCharacterPrototypeDraftLoading(true);
    const defaults = getDefaultCreateCharacterPresetSelections('female');
    try {
      const draft = await api.createdCharacters.generatedImageDraft({
        generationJobId: source.jobId,
        mediaId: source.mediaId,
        gender: 'female',
        contentLocale: locale,
        selections: serializeCreateCharacterPresetSelections('female', defaults),
      }, controller.signal);
      if (controller.signal.aborted || characterPrototypeDraftRequestRef.current !== requestId) return;
      setCharacterPrototypeDraft(draft);
    } catch (reason) {
      if (controller.signal.aborted || characterPrototypeDraftRequestRef.current !== requestId) return;
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      setCharacterPrototypeDraftError(characterDraftErrorMessage(reason, t));
    } finally {
      if (characterPrototypeDraftRequestRef.current === requestId) {
        setCharacterPrototypeDraftLoading(false);
        characterPrototypeDraftAbortRef.current = null;
      }
    }
  }, [locale, onRequireAuth, t]);

  const closeCharacterPrototype = useCallback(() => {
    characterPrototypeDraftRequestRef.current += 1;
    characterPrototypeDraftAbortRef.current?.abort();
    characterPrototypeDraftAbortRef.current = null;
    setCharacterPrototypeDraft(null);
    setCharacterPrototypeDraftLoading(false);
    setCharacterPrototypeDraftError(null);
    setCharacterPrototypeSource(null);
  }, []);

  const loadVoices = useCallback(async () => {
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const voiceCatalog = await api.chat.voices();
      const availableVoiceIds = new Set(voiceCatalog.voices.map((voice) => voice.voiceId));
      const fallbackVoiceId = [voiceCatalog.defaultVoiceId, voiceCatalog.voices[0]?.voiceId]
        .find((voiceId) => Boolean(voiceId && availableVoiceIds.has(voiceId))) || '';
      setVoices(voiceCatalog.voices.map((voice) => {
        const displayNameKey = getVoiceDisplayNameKey(voice.voiceId);
        return displayNameKey ? { ...voice, name: t(displayNameKey) } : voice;
      }));
      setDefaultVoiceId(fallbackVoiceId);
      setSelectedVoiceId((current) => current && availableVoiceIds.has(current) ? current : fallbackVoiceId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
      setVoices([]);
      setSelectedVoiceId('');
      setVoiceError(userErrorMessage(error, t, 'generator.errorVoices'));
    } finally {
      setVoiceLoading(false);
    }
  }, [onRequireAuth, t]);

  useEffect(() => {
    if (!isOpen) {
      generationAbortRef.current?.abort();
      generationAbortRef.current = null;
      return;
    }
    if (!isAuthenticated) {
      setGenerationOptions(null);
      setHistoryWorks([]);
      setPaymentAccount(null);
      return;
    }

    let cancelled = false;
    // Keep the voice catalog independent from generation history/options. A
    // transient failure in one of those requests must not make dialogue
    // generation appear usable without a voice list (or hide the retry state).
    void loadVoices();
    const loadGenerationData = async () => {
      try {
        const [options, firstPage] = await Promise.all([
          api.generation.options(),
          api.generation.jobs.list({ page: 1, pageSize: 100 }),
        ]);
        const jobs = [...firstPage.items];
        let page = 2;
        while (jobs.length < firstPage.total) {
          const nextPage = await api.generation.jobs.list({ page, pageSize: 100 });
          jobs.push(...nextPage.items);
          if (!nextPage.items.length) break;
          page += 1;
        }
        if (cancelled) return;
        setGenerationOptions(options);
        setHistoryWorks(jobs.flatMap((job) => (job.outputs || []).map((media) => ({
          id: `${job.id}-${media.id}`,
          type: media.mediaType === 'video' ? 'video' as const : 'image' as const,
          url: media.url,
          prompt: job.prompt || '',
          time: job.createdAt,
          mediaId: media.id,
          jobId: job.id,
        }))));
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 401) onRequireAuth?.();
        if (!cancelled) setGenerationError(userErrorMessage(error, t, 'generator.errorRequest'));
      }
    };
    void loadGenerationData();
    void api.payments.account()
      .then((account) => {
        if (!cancelled) setPaymentAccount(account);
      })
      .catch((error) => {
        if (!cancelled && error instanceof ApiError && error.status === 401) onRequireAuth?.();
        if (!cancelled) setPaymentAccount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAuthenticated, loadVoices]);

  useEffect(() => {
    if (isOpen) return;
    closeCharacterPrototype();
    if (extendVideoUrlRef.current) {
      URL.revokeObjectURL(extendVideoUrlRef.current);
      extendVideoUrlRef.current = null;
    }
    setExtendVideoFile(null);
    setExtendVideoUrl(null);
    setExtendVideoError(null);
    setExtendVideoMediaId(null);
    setExtendVideoUploadPending(false);
    extendVideoUploadIdRef.current += 1;
  }, [closeCharacterPrototype, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMobileGeneratorStep(0);
    setMobileGeneratorView(isMobilePage ? 'home' : 'wizard');
  }, [isOpen, isMobilePage]);

  useEffect(() => {
    if (isMobilePage) setMobileGeneratorStep(0);
  }, [isMobilePage, mainMode, subMode]);

  useEffect(() => () => {
    characterPrototypeDraftRequestRef.current += 1;
    characterPrototypeDraftAbortRef.current?.abort();
    extendVideoUploadIdRef.current += 1;
    if (extendVideoUrlRef.current) URL.revokeObjectURL(extendVideoUrlRef.current);
  }, []);

  useEffect(() => {
    const modeOptions = generationOptions?.modes.find((mode) => mode.value === mainMode);
    if (!modeOptions) return;
    const availableQualities = modeOptions.qualities || [];
    if (availableQualities.length) {
      setQuality((current) => availableQualities.includes(current) ? current : availableQualities[0]);
    }
    if (modeOptions.aspectRatios.length) {
      setAspectRatio((current) => modeOptions.aspectRatios.includes(current) ? current : modeOptions.aspectRatios[0]);
    }
    if (mainMode === 'video') {
      const availableDurations = modeOptions.durations || [];
      if (availableDurations.length) {
        setDuration((current) => availableDurations.includes(current) ? current : availableDurations[0]);
      }
    }
  }, [generationOptions, mainMode]);

  useEffect(() => {
    if (!isOpen || !targetPickerOpen || !isAuthenticated) return;
    if (targetSearchTimerRef.current) clearTimeout(targetSearchTimerRef.current);
    targetRequestAbortRef.current?.abort();
    const controller = new AbortController();
    targetRequestAbortRef.current = controller;
    const page = targetPage || 1;
    targetSearchTimerRef.current = setTimeout(() => {
      setTargetLoading(true);
      setTargetError(null);
      void api.generation.targets.list({
        query: targetQuery.trim() || undefined,
        scope: targetScope,
        gender: targetGender === 'all' ? undefined : targetGender,
        style: targetStyle === 'all' ? undefined : targetStyle,
        ageGroup: targetAgeGroup === 'all' ? undefined : targetAgeGroup,
        page,
        pageSize: 10,
      }, controller.signal).then((result) => {
        if (controller.signal.aborted) return;
        setTargetTotal(result.total);
        setTargetItems((previous) => {
          const combined = page === 1 ? result.items : [...previous, ...result.items];
          const seen = new Set<string>();
          return combined.filter((item) => !seen.has(item.id) && seen.add(item.id));
        });
      }).catch((error) => {
        if (!controller.signal.aborted) {
          if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
          setTargetError(userErrorMessage(error, t, 'generator.errorTargetLoad'));
        }
      }).finally(() => {
        if (!controller.signal.aborted) setTargetLoading(false);
      });
    }, 220);
    return () => {
      if (targetSearchTimerRef.current) clearTimeout(targetSearchTimerRef.current);
      controller.abort();
      if (targetRequestAbortRef.current === controller) targetRequestAbortRef.current = null;
    };
  }, [isOpen, targetPickerOpen, isAuthenticated, targetPage, targetQuery, targetScope, targetGender, targetStyle, targetAgeGroup]);

  if (!isOpen) return null;

  const resetTargetSearch = () => {
    setTargetPage(1);
    setTargetItems([]);
    setTargetTotal(0);
    setTargetError(null);
  };

  const openTargetPicker = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setTargetPickerOpen(true);
    resetTargetSearch();
  };

  const clearImageSource = () => {
    setSourceMediaId(null);
    setSourcePreviewUrl(null);
    setSourceTarget(null);
  };

  const clearExtendVideo = () => {
    extendVideoUploadIdRef.current += 1;
    if (extendVideoUrlRef.current) {
      URL.revokeObjectURL(extendVideoUrlRef.current);
      extendVideoUrlRef.current = null;
    }
    setExtendVideoFile(null);
    setExtendVideoUrl(null);
    setExtendVideoError(null);
    setExtendVideoMediaId(null);
    setExtendVideoUploadPending(false);
  };

  const handleExtendVideoSelect = async (file: File | undefined) => {
    if (!file) return;
    const hasMp4Extension = file.name.toLowerCase().endsWith('.mp4');
    const isMp4 = hasMp4Extension && (!file.type || file.type === 'video/mp4');
    if (!isMp4) {
      clearExtendVideo();
      setExtendVideoError(t('generator.extendInvalidVideo'));
      return;
    }
    if (extendVideoUrlRef.current) URL.revokeObjectURL(extendVideoUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    extendVideoUrlRef.current = previewUrl;
    setExtendVideoFile(file);
    setExtendVideoUrl(previewUrl);
    setExtendVideoError(null);
    setExtendVideoMediaId(null);
    setGenerationError(null);
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    const uploadId = ++extendVideoUploadIdRef.current;
    setExtendVideoUploadPending(true);
    try {
      const media = await api.media.upload(file, 'generationInput');
      if (uploadId !== extendVideoUploadIdRef.current) return;
      setExtendVideoMediaId(media.id);
    } catch (error) {
      if (uploadId !== extendVideoUploadIdRef.current) return;
      clearExtendVideo();
      setExtendVideoError(userErrorMessage(error, t, 'generator.errorUpload'));
      if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
    } finally {
      if (uploadId === extendVideoUploadIdRef.current) setExtendVideoUploadPending(false);
    }
  };

  const handleSourceUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setSourceUploadPending(true);
    setGenerationError(null);
    try {
      const media = await api.media.upload(file, 'generationInput');
      setSourceMediaId(media.id);
      setSourcePreviewUrl(media.url);
      setSourceTarget(null);
      setSelectedVoiceId((current) => current || defaultVoiceId || voices[0]?.voiceId || '');
      setVoiceError(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
      setGenerationError(userErrorMessage(error, t, 'generator.errorUpload'));
    } finally {
      setSourceUploadPending(false);
    }
  };

  const handleTargetSelect = (target: ApiGenerationTarget) => {
    const preview = subMode === 'image-to-video'
      ? target.cardPreview?.image
      : target.cardPreview?.image || target.image;
    if (!preview) {
      setGenerationError(t('generator.errorTargetImage'));
      return;
    }
    setSourceMediaId(null);
    setSourcePreviewUrl(preview.url);
    setSourceTarget(target);
    const targetVoiceIsAvailable = Boolean(
      target.voiceId && (!voices.length || voices.some((voice) => voice.voiceId === target.voiceId)),
    );
    setSelectedVoiceId(targetVoiceIsAvailable ? target.voiceId! : defaultVoiceId || voices[0]?.voiceId || '');
    setVoiceError(null);
    setTargetPickerOpen(false);
    setGenerationError(null);
  };

  const handleTargetPickerScroll = () => {
    const node = targetPickerScrollRef.current;
    if (!node || targetLoading || targetItems.length >= targetTotal) return;
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 80) {
      setTargetPage((page) => page + 1);
    }
  };

  // Handle Switching Main Mode
  const handleMainModeChange = (mode: 'image' | 'video') => {
    setMainMode(mode);
    setTargetPickerOpen(false);
    setGenerationError(null);
    clearImageSource();
    clearExtendVideo();
    if (mode === 'image') {
      setSubMode('text-to-image');
      setAspectRatio('3:4');
      setDuration(8);
    } else {
      setSubMode('text-to-video');
      const videoMode = generationOptions?.modes.find((option) => option.value === 'video');
      setAspectRatio(videoMode?.aspectRatios[0] ?? '9:16');
      setDuration(videoMode?.durations?.[0] ?? 5);
      setQuality((current) => videoMode?.qualities?.includes(current) ? current : videoMode?.qualities?.[0] ?? current);
      setSelectedVoiceId((current) => current || defaultVoiceId || voices[0]?.voiceId || '');
    }
  };

  // Keep the visible prompt concise while retaining the source details for generation.
  const getPromptParts = () => {
    if (mainMode === 'video' && subMode === 'extend') {
      const custom = customPrompt.trim();
      return { visiblePrompt: custom, generationPrompt: custom };
    }
    const poseObj = posePresets.find((p) => p.id === selectedPose);
    const outfitObj = outfitPresets.find((o) => o.id === selectedOutfit);
    const sceneObj = scenePresets.find((s) => s.id === selectedScene);

    return buildGeneratorPrompts({
      imageStyle,
      pose: poseObj,
      outfit: outfitObj,
      scene: sceneObj,
      locale,
      dialogueText: mainMode === 'video' && subMode === 'image-to-video' ? dialogueText : '',
      customPrompt,
    });
  };

  const getVisiblePrompt = () => getPromptParts().visiblePrompt;
  const getGenerationPrompt = () => getPromptParts().generationPrompt;

  const presetLabel = (item: (typeof posePresets)[number]) => localizedPresetName(item.name, locale);
  const imageOptions = generationOptions?.modes.find((mode) => mode.value === 'image');
  const videoOptions = generationOptions?.modes.find((mode) => mode.value === 'video');
  const imageAspectRatios = imageOptions?.aspectRatios ?? ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', '9:21'];
  const videoAspectRatios = videoOptions?.aspectRatios ?? ['16:9', '9:16'];
  const aspectRatios = mainMode === 'video' ? videoAspectRatios : imageAspectRatios;
  const videoDurations = videoOptions?.durations?.length ? videoOptions.durations : [5, 10];
  const videoQualities = videoOptions?.qualities?.length ? videoOptions.qualities : ['720p', '1080p', '4k'] as const;
  const videoDiamondCost = duration === 10
    ? 200
    : duration === 5
      ? 100
      : Math.round((videoOptions?.baseCreditCost ?? 100) * (duration / 5));
  const generationDiamondCost = mainMode === 'video'
    ? videoDiamondCost
    : imageOptions?.baseCreditCost ?? 10;
  const walletBalance = paymentAccount?.wallet.balance;
  const insufficientDiamonds = walletBalance !== undefined && walletBalance < generationDiamondCost;
  const requiredMembershipFeature = generationOptions?.requiredMembershipFeature || 'advancedModels';
  const hasRequiredMembership = Boolean(
    paymentAccount?.membership?.featureKeys?.includes(requiredMembershipFeature),
  );
  const operationForSubMode = (mode: GeneratorSubMode) => (
    mode === 'image-to-image' ? 'imageToImage'
      : mode === 'image-to-video' ? 'imageToVideo'
        : mode === 'extend' ? 'extendVideo'
          : mode === 'text-to-image' ? 'textToImage' : 'textToVideo'
  );
  const premiumForSelection = (nextQuality: string, nextSubMode = subMode) => {
    const options = mainMode === 'video' ? videoOptions : imageOptions;
    const premiumQualities = options?.premiumQualities ?? ['4k'];
    const premiumOperations = options?.premiumOperations ?? (
      mainMode === 'video' ? ['imageToVideo', 'extendVideo'] : ['imageToImage']
    );
    return Boolean(
      premiumQualities.includes(nextQuality as '4k')
      || premiumOperations.includes(operationForSubMode(nextSubMode)),
    );
  };
  const premiumQuality = (nextQuality: string) => (
    (mainMode === 'video' ? videoOptions : imageOptions)?.premiumQualities?.includes(nextQuality as '4k')
    ?? nextQuality === '4k'
  );
  const openMembershipUpgrade = (nextQuality = quality, nextSubMode = subMode) => {
    const notice = t('generator.membershipRequired');
    const featureKey = nextQuality === '4k'
      ? 'generator.vipFeature4k'
      : nextSubMode === 'image-to-image'
        ? 'generator.vipFeatureImageToImage'
        : nextSubMode === 'image-to-video'
          ? 'generator.vipFeatureImageToVideo'
          : nextSubMode === 'extend'
            ? 'generator.vipFeatureExtend'
            : 'generator.vipRequiredTitle';
    if (onOpenQuickUpgradeModal) onOpenQuickUpgradeModal(notice, t(featureKey));
    else onOpenUpgradeModal?.(notice);
  };
  const blockPremiumSelection = (nextQuality: string, nextSubMode = subMode) => {
    if (!premiumForSelection(nextQuality, nextSubMode) || hasRequiredMembership) return false;
    openMembershipUpgrade(nextQuality, nextSubMode);
    return true;
  };
  const seedToggleClassName = useSeed
    ? 'bg-pink-500/20 text-pink-400 border-pink-500'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700';

  const resetGeneratorDefaults = () => {
    setMainMode('video');
    setSubMode('text-to-video');
    setSelectedPose(posePresets[0]?.id ?? null);
    setSelectedOutfit(outfitPresets[0]?.id ?? null);
    setSelectedScene(scenePresets[0]?.id ?? null);
    setActivePresetTab('pose');
    setImageStyle('anime');
    setCustomPrompt('');
    setDialogueText('');
    setSelectedVoiceId(defaultVoiceId || voices[0]?.voiceId || '');
    clearImageSource();
    clearExtendVideo();
    setQuality(videoOptions?.qualities?.[0] ?? '1080p');
    setAspectRatio(videoOptions?.aspectRatios?.[0] ?? '9:16');
    setDuration(videoOptions?.durations?.[0] ?? 5);
    setUseSeed(false);
    setSeedValue(7832941);
    setTargetPickerOpen(false);
  };

  const showReferencePanel = ['image-to-image', 'image-to-video'].includes(subMode);
  const mobileGeneratorStepIds = getMobileGeneratorStepIds(mainMode, subMode);
  const activeMobileGeneratorStep = mobileGeneratorStepIds[mobileGeneratorStep] || mobileGeneratorStepIds[0];
  const showMobileGeneratorStep = (step: MobileGeneratorStepId) => !isMobilePage || activeMobileGeneratorStep === step;
  const mobileGeneratorStepTitle = activeMobileGeneratorStep === 'mode'
    ? mainMode === 'video' ? t('generator.videoMode') : t('generator.imageMode')
    : activeMobileGeneratorStep === 'source'
      ? t('generator.uploadReference')
      : activeMobileGeneratorStep === 'prompt'
        ? t('generator.customDetails')
        : activeMobileGeneratorStep === 'dialogue'
          ? t('generator.dialogue')
          : t('generator.renderSettings');
  const mobileGeneratorHeaderTitle = mobileGeneratorView === 'result'
      ? t('generator.stageTitle')
      : mobileGeneratorStepTitle;
  const imageHistoryCount = historyWorks.filter((work) => work.type === 'image').length;
  const videoHistoryCount = historyWorks.filter((work) => work.type === 'video').length;
  const filteredHistoryWorks = mobileHistoryFilter === 'all'
    ? historyWorks
    : historyWorks.filter((work) => work.type === mobileHistoryFilter);
  const generationDisabled = generating || (
    mainMode === 'video'
    && subMode === 'extend'
    && (extendVideoUploadPending || !extendVideoMediaId || !customPrompt.trim())
  ) || insufficientDiamonds;
  const handlePreviousMobileGeneratorStep = () => {
    setMobileGeneratorStep((current) => Math.max(0, current - 1));
  };
  const handleNextMobileGeneratorStep = () => {
    setMobileGeneratorStep((current) => Math.min(mobileGeneratorStepIds.length - 1, current + 1));
  };
  const handleMobileGeneratorBack = () => {
    if (mobileGeneratorView === 'home') {
      onClose();
      return;
    }
    if (mobileGeneratorView === 'result') {
      setMobileGeneratorView('home');
      return;
    }
    if (mobileGeneratorStep > 0) {
      handlePreviousMobileGeneratorStep();
      return;
    }
    setMobileGeneratorView('home');
  };
  const openMobileGeneratorHome = () => {
    if (isMobilePage) setMobileGeneratorView('home');
  };
  const startMobileGenerator = (mode: 'image' | 'video') => {
    handleMainModeChange(mode);
    setMobileGeneratorStep(0);
    setMobileGeneratorView('wizard');
  };
  const selectHistoryWork = (work: (typeof historyWorks)[number]) => {
    setGenerationError(null);
    const selectedHistoryOutput: GeneratedOutput = {
      id: work.id,
      type: work.type,
      url: work.url,
      promptUsed: work.prompt,
      generationPrompt: work.prompt,
      mediaId: work.mediaId,
      jobId: work.jobId,
    };
    setGeneratedOutput(selectedHistoryOutput);
    setGeneratedOutputs([selectedHistoryOutput]);
    if (isMobilePage) setMobileGeneratorView('result');
  };

  const clearGenerationPolling = () => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
  };

  const outputItemsForJob = (job: ApiGenerationJob, prompt: string): GeneratedOutput[] =>
    (job.outputs || []).map((media: ApiMedia, index) => ({
      id: `${job.id}-${media.id || index}`,
      type: media.mediaType === 'video' ? 'video' : 'image',
      url: media.url,
      promptUsed: prompt,
      generationPrompt: job.prompt,
      mediaId: media.id,
      jobId: job.id,
    }));

  const applyGenerationJob = (job: ApiGenerationJob, prompt: string) => {
    setGenerationJob(job);
    setGenProgress(Math.max(0, Math.min(100, job.progress || 0)));
    const outputs = outputItemsForJob(job, prompt);
    if (outputs.length) {
      setGeneratedOutputs(outputs);
      setGeneratedOutput(outputs[0]);
      setHistoryWorks((previous) => {
        const next = outputs.map((output) => ({
          id: output.id,
          type: output.type,
          url: output.url,
          prompt: output.promptUsed,
          mediaId: output.mediaId,
          jobId: output.jobId,
          time: t('generator.justNow'),
        }));
        const known = new Set(next.map((item) => item.id));
        return [...next, ...previous.filter((item) => !known.has(item.id))];
      });
    }
  };

  const pollGenerationJob = async (jobId: string, prompt: string, controller: AbortController) => {
    const update = (current: ApiGenerationJob) => {
      applyGenerationJob(current, prompt);
      if (current.status === 'complete' || current.status === 'failed' || current.status === 'canceled') return;
      setGenStepText(
        current.status === 'queued'
          ? t('generator.queued')
          : current.audioStatus === 'queued' || current.audioStatus === 'processing'
            ? t('generator.audioRendering')
            : mainMode === 'video' ? t('generator.videoRendering') : t('generator.rendering'),
      );
    };
    const current = await waitForGenerationJob(jobId, update, controller.signal);
    if (controller.signal.aborted) return;
    setGenerating(false);
    setGenStepText(current.status === 'complete' ? t('generator.complete') : current.status === 'canceled' ? t('generator.cancelled') : t('generator.failed'));
    if (current.status === 'failed') {
      setGenerationError(userErrorCodeMessage(current.failureCode, t, 'generator.errorFailed'));
    } else if (current.status === 'complete') {
      resetGeneratorDefaults();
    }
    generationAbortRef.current = null;
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (walletBalance !== undefined && walletBalance < generationDiamondCost) {
      onOpenRechargeModal?.();
      setGenerationError(t('generator.insufficientDiamonds', {
        required: formatNumber(generationDiamondCost),
        available: formatNumber(walletBalance),
      }));
      return;
    }
    const isVideo = mainMode === 'video';
    const isExtendVideo = isVideo && subMode === 'extend';
    const isImageToVideo = isVideo && subMode === 'image-to-video';
    const isTextToVideo = isVideo && subMode === 'text-to-video';
    const isImageToImage = !isVideo && subMode === 'image-to-image';
    if (isVideo && videoOptions && !videoOptions.enabled) {
      setGenerationError(t('generator.modeUnavailable'));
      return;
    }
    if (!isVideo && !['text-to-image', 'image-to-image'].includes(subMode)) {
      setGenerationError(t('generator.modeUnavailable'));
      return;
    }
    if (isExtendVideo && !extendVideoFile) {
      setGenerationError(t('generator.extendVideoRequired'));
      return;
    }
    if (isExtendVideo && (extendVideoUploadPending || !extendVideoMediaId)) {
      setGenerationError(t('generator.extendVideoRequired'));
      return;
    }
    if (isExtendVideo && !customPrompt.trim()) {
      setGenerationError(t('generator.extendPromptRequired'));
      return;
    }
    if (isVideo && !isTextToVideo && !isImageToVideo && !isExtendVideo) {
      setGenerationError(t('generator.modeUnavailable'));
      return;
    }
    if ((isImageToImage || isImageToVideo) && !sourceMediaId && !sourceTarget) {
      setGenerationError(t('generator.referenceRequired'));
      return;
    }
    if (isImageToVideo && sourceTarget && !sourceTarget.cardPreview?.image) {
      setGenerationError(t('generator.errorTargetImage'));
      return;
    }
    if (isImageToVideo && dialogueText.trim() && (voiceLoading || !selectedVoiceId || !voices.length)) {
      setGenerationError(voiceError || t('generator.voiceRequired'));
      return;
    }
    if (isMobilePage) setMobileGeneratorView('result');
    clearGenerationPolling();
    setGenerationError(null);
    setGeneratedOutputs([]);
    setGeneratedOutput(null);
    setGenerationJob(null);
    setGenerating(true);
    setGenProgress(0);
    setGenStepText(t('generator.submit'));

    const poseObj = posePresets.find((preset) => preset.id === selectedPose);
    const outfitObj = outfitPresets.find((preset) => preset.id === selectedOutfit);
    const sceneObj = scenePresets.find((preset) => preset.id === selectedScene);
    const promptInput = {
      imageStyle,
      pose: poseObj,
      outfit: outfitObj,
      scene: sceneObj,
      locale,
      dialogueText: isImageToVideo ? dialogueText : '',
      customPrompt,
    };
    const apiPrompt = buildGeneratorApiPrompt(promptInput);
    const visiblePrompt = getVisiblePrompt();
    visiblePromptRef.current = visiblePrompt;
    const controller = new AbortController();
    generationAbortRef.current = controller;

    try {
      const job = await api.generation.jobs.create({
        mode: isVideo ? 'video' : 'image',
        imageOperation: !isVideo ? (isImageToImage ? 'imageToImage' : 'textToImage') : undefined,
        videoOperation: isVideo ? (isExtendVideo ? 'extendVideo' : isImageToVideo ? 'imageToVideo' : 'textToVideo') : undefined,
        characterId: (isImageToImage || isImageToVideo) && sourceTarget?.target === 'character' ? sourceTarget.id : undefined,
        createdCharacterId: (isImageToImage || isImageToVideo) && sourceTarget?.target === 'createdCharacter' ? sourceTarget.id : undefined,
        sourceMediaId: isExtendVideo ? extendVideoMediaId! : (isImageToVideo || isImageToImage) && sourceMediaId ? sourceMediaId : undefined,
        style: isExtendVideo ? undefined : apiPrompt.style,
        quality,
        ...(isExtendVideo || !apiPrompt.pose ? {} : { pose: apiPrompt.pose }),
        ...(isExtendVideo || !apiPrompt.outfit ? {} : { outfit: apiPrompt.outfit }),
        ...(isExtendVideo || !apiPrompt.scene ? {} : { scene: apiPrompt.scene }),
        prompt: isExtendVideo ? customPrompt.trim() : apiPrompt.prompt,
        aspectRatio,
        count: 1,
        durationSeconds: isVideo ? duration : undefined,
        dialogue: isImageToVideo && dialogueText.trim() ? dialogueText.trim() : undefined,
        voiceId: isImageToVideo && dialogueText.trim() ? selectedVoiceId : undefined,
      });
      applyGenerationJob(job, visiblePrompt);
      await pollGenerationJob(job.id, visiblePrompt, controller);
    } catch (error) {
      if (controller.signal.aborted) return;
      setGenerating(false);
      if (error instanceof ApiError && error.status === 401) {
        onRequireAuth?.();
      }
      if (error instanceof ApiError && error.code === 'MEMBERSHIP_REQUIRED') {
        openMembershipUpgrade();
        generationAbortRef.current = null;
        return;
      }
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_DIAMONDS') {
        onOpenRechargeModal?.();
        setGenerationError(t('generator.insufficientDiamonds', {
          required: formatNumber(Number((error.fields?.required as string[] | undefined)?.[0] || generationDiamondCost)),
          available: formatNumber(Number((error.fields?.available as string[] | undefined)?.[0] || walletBalance || 0)),
        }));
        generationAbortRef.current = null;
        return;
      }
      setGenerationError(userErrorMessage(error, t, 'generator.errorRequest'));
      generationAbortRef.current = null;
    }
  };

  const handleCancelGeneration = async () => {
    const job = generationJob;
    clearGenerationPolling();
    setGenerating(false);
    if (!job || !['queued', 'processing'].includes(job.status)) return;
    try {
      const canceled = await api.generation.jobs.cancel(job.id);
      applyGenerationJob(canceled, visiblePromptRef.current || getVisiblePrompt());
      setGenerationJob(canceled);
      setGenStepText(t('generator.cancelled'));
    } catch (error) {
      setGenerationError(userErrorMessage(error, t, 'generator.errorCancel'));
    }
  };

  const handleRetryGeneration = async () => {
    if (!generationJob) return;
    if (isMobilePage) setMobileGeneratorView('result');
    clearGenerationPolling();
    setGenerationError(null);
    setGeneratedOutputs([]);
    setGeneratedOutput(null);
    setGenerating(true);
    setGenStepText(t('generator.retrying'));
    const controller = new AbortController();
    generationAbortRef.current = controller;
    try {
      const job = await api.generation.jobs.retry(generationJob.id);
      const visiblePrompt = visiblePromptRef.current || getVisiblePrompt();
      applyGenerationJob(job, visiblePrompt);
      await pollGenerationJob(job.id, visiblePrompt, controller);
    } catch (error) {
      if (controller.signal.aborted) return;
      setGenerating(false);
      if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
      if (error instanceof ApiError && error.code === 'MEMBERSHIP_REQUIRED') {
        openMembershipUpgrade();
        generationAbortRef.current = null;
        return;
      }
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_DIAMONDS') {
        onOpenRechargeModal?.();
        setGenerationError(t('generator.insufficientDiamonds', {
          required: formatNumber(Number((error.fields?.required as string[] | undefined)?.[0] || generationDiamondCost)),
          available: formatNumber(Number((error.fields?.available as string[] | undefined)?.[0] || walletBalance || 0)),
        }));
        generationAbortRef.current = null;
        return;
      }
      setGenerationError(userErrorMessage(error, t, 'generator.errorRetry'));
      generationAbortRef.current = null;
    }
  };

  const handleRegenerateVideo = async () => {
    const output = generatedOutput;
    if (!output || output.type !== 'video' || generating) return;
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    const previousOutputs = generatedOutputs;
    const previousJob = generationJob;
    const previousOutput = output;
    clearGenerationPolling();
    setGenerationError(null);
    setGeneratedOutputs([]);
    setGeneratedOutput(null);
    setGenerating(true);
    setGenProgress(0);
    setGenStepText(t('generator.regenerating'));
    if (isMobilePage) setMobileGeneratorView('result');

    const controller = new AbortController();
    generationAbortRef.current = controller;
    try {
      const sourceJob = generationJob?.id === output.jobId
        ? generationJob
        : await api.generation.jobs.get(output.jobId, controller.signal);
      if (controller.signal.aborted) return;

      const videoOperation: NonNullable<ApiGenerationCreateRequest['videoOperation']> =
        sourceJob.videoOperation === 'imageToVideo' || sourceJob.videoOperation === 'extendVideo' || sourceJob.videoOperation === 'textToVideo'
          ? sourceJob.videoOperation
          : 'textToVideo';
      if (videoOperation === 'extendVideo' && !sourceJob.sourceMediaId) {
        throw new Error('Missing source video for regeneration');
      }

      const request: ApiGenerationCreateRequest = {
        mode: 'video',
        videoOperation,
        prompt: sourceJob.prompt || output.generationPrompt || output.promptUsed,
        pose: sourceJob.pose,
        outfit: sourceJob.outfit,
        scene: sourceJob.scene,
        style: sourceJob.style,
        quality: sourceJob.quality,
        aspectRatio: sourceJob.aspectRatio,
        durationSeconds: sourceJob.durationSeconds,
        count: 1,
        ...(sourceJob.createdCharacterId
          ? { createdCharacterId: sourceJob.createdCharacterId }
          : sourceJob.characterId
            ? { characterId: sourceJob.characterId }
            : {}),
        ...(videoOperation === 'extendVideo'
          ? { sourceMediaId: sourceJob.sourceMediaId! }
          : videoOperation === 'imageToVideo' && !sourceJob.createdCharacterId && !sourceJob.characterId && sourceJob.sourceMediaId
            ? { sourceMediaId: sourceJob.sourceMediaId }
            : {}),
        ...(videoOperation === 'imageToVideo' && sourceJob.dialogue?.trim()
          ? {
              dialogue: sourceJob.dialogue,
              ...(sourceJob.voiceId ? { voiceId: sourceJob.voiceId } : {}),
            }
          : {}),
      };
      const visiblePrompt = output.promptUsed || request.prompt || '';
      const job = await api.generation.jobs.create(request);
      if (controller.signal.aborted) return;
      applyGenerationJob(job, visiblePrompt);
      await pollGenerationJob(job.id, visiblePrompt, controller);
    } catch (error) {
      if (controller.signal.aborted) return;
      setGenerating(false);
      setGenerationJob(previousJob);
      setGeneratedOutputs(previousOutputs);
      setGeneratedOutput(previousOutput);
      if (error instanceof ApiError && error.status === 401) onRequireAuth?.();
      if (error instanceof ApiError && error.code === 'MEMBERSHIP_REQUIRED') {
        openMembershipUpgrade();
        generationAbortRef.current = null;
        return;
      }
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_DIAMONDS') {
        onOpenRechargeModal?.();
        setGenerationError(t('generator.insufficientDiamonds', {
          required: formatNumber(Number((error.fields?.required as string[] | undefined)?.[0] || generationDiamondCost)),
          available: formatNumber(Number((error.fields?.available as string[] | undefined)?.[0] || walletBalance || 0)),
        }));
        generationAbortRef.current = null;
        return;
      }
      setGenerationError(userErrorMessage(error, t, 'generator.errorRegenerate'));
      generationAbortRef.current = null;
    }
  };

  const handleShareToCommunity = async () => {
    if (!generatedOutput) return;
    if (generatedOutput.isShared || sharingOutputId === generatedOutput.id) return;
    setSharingOutputId(generatedOutput.id);
    const characterId = generationJob?.id === generatedOutput.jobId
      && generationJob.characterId
      && publicCharacters.some((character) => character.id === generationJob.characterId)
      ? generationJob.characterId
      : undefined;
    try {
      const body: { generationJobId: string; mediaId: string; characterId?: string; caption: string; contentLocale: string } = {
        generationJobId: generatedOutput.jobId,
        mediaId: generatedOutput.mediaId,
        caption: generatedOutput.promptUsed.slice(0, 1000),
        contentLocale: locale,
      };
      if (characterId) body.characterId = characterId;
      await api.feed.create(body);
      setGeneratedOutput((prev) => (prev ? { ...prev, isShared: true } : prev));
      setGeneratedOutputs((prev) => prev.map((item) => item.id === generatedOutput.id ? { ...item, isShared: true } : item));
      setShareToast(t('generator.shareSubmitted'));
      onCommunityPublished?.();
    } catch (reason) {
      setGenerationError(userErrorMessage(reason, t, 'generator.errorShare'));
    } finally {
      setSharingOutputId(null);
    }
  };

  const handleCreateCharacterFromOutput = () => {
    if (!generatedOutput || generatedOutput.type !== 'image') return;
    setGenerationError(null);
    setCharacterPrototypeSource(generatedOutput);
    void requestCharacterPrototypeDraft(generatedOutput);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getVisiblePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGeneratedPrompt = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput.promptUsed || getVisiblePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <div
      className={isMobilePage
        ? 'mobile-generator-page flex h-full min-h-0 w-full flex-col'
        : isWorkspace
          ? 'generate-workspace-page mx-auto flex h-full min-h-0 w-full max-w-[1700px] flex-col'
          : 'safe-area-top fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4'}
      role={isMobilePage || isWorkspace ? undefined : 'dialog'}
      aria-modal={isMobilePage || isWorkspace ? undefined : true}
      aria-labelledby="ai-generator-title"
      data-presentation={presentation}
    >
      <div className={isMobilePage
        ? 'mobile-generator-panel relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#101017] text-zinc-100'
        : isWorkspace
          ? 'generate-workspace-panel relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#101017] text-zinc-100'
          : 'mobile-generator-panel relative my-auto flex max-h-[calc(100dvh-16px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#101017] text-zinc-100 shadow-2xl sm:max-h-[94vh] sm:rounded-3xl'}>
        
        {/* Top Header Bar */}
        {isMobilePage ? (mobileGeneratorView === 'home' ? null : (
          <div className="mobile-generator-header grid min-h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center border-b border-zinc-800/80 bg-[#161622] px-3">
            <button
              type="button"
              onClick={handleMobileGeneratorBack}
              className="mobile-touch-target flex min-w-0 items-center gap-1.5 justify-self-start rounded-xl px-1.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {mobileGeneratorView === 'wizard' && mobileGeneratorStep === 0 ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{mobileGeneratorView === 'wizard' && mobileGeneratorStep === 0 ? t('common.cancel') : t('common.back')}</span>
            </button>
            <div className="min-w-0 px-2 text-center">
              {mobileGeneratorView === 'wizard' && (
                <span className="block text-[10px] font-black text-pink-400">
                  {mobileGeneratorStep + 1} / {mobileGeneratorStepIds.length}
                </span>
              )}
              <h1 id="ai-generator-title" className="block max-w-44 truncate text-sm font-black text-white">{mobileGeneratorHeaderTitle}</h1>
            </div>
            <div className="flex min-w-0 shrink-0 items-center justify-self-end gap-1.5">
              <div className="flex min-w-0 items-stretch overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/40 text-amber-300">
                <button
                  type="button"
                  onClick={onOpenRechargeModal || onOpenUpgradeModal}
                  className="mobile-touch-target flex min-w-0 items-center gap-1.5 px-2 text-[10px] font-black transition-colors hover:bg-amber-900/40"
                  aria-label={paymentAccount ? t('generator.diamondBalance', { count: formatNumber(paymentAccount.wallet.balance) }) : t('common.loading')}
                  title={paymentAccount ? t('generator.diamondBalance', { count: formatNumber(paymentAccount.wallet.balance) }) : t('common.loading')}
                >
                  <Gem className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                  <span className="hidden min-[400px]:inline">{t('generator.diamonds')}</span>
                  <span className="tabular-nums">{paymentAccount ? formatNumber(paymentAccount.wallet.balance) : '...'}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRechargeModal || onOpenUpgradeModal}
                  className="mobile-touch-target flex w-9 shrink-0 items-center justify-center border-l border-amber-500/30 text-base font-bold transition-colors hover:bg-amber-900/40"
                  aria-label={t('generator.rechargeDiamonds')}
                  title={t('generator.rechargeDiamonds')}
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>
              {mobileGeneratorView === 'wizard' && (
                <button
                  type="button"
                  onClick={openMobileGeneratorHome}
                  aria-label={t('generator.history', { count: historyWorks.length })}
                  className="mobile-touch-target flex items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <History className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )) : (
        <div className="px-5 py-3.5 bg-[#161622] border-b border-zinc-800/80 flex items-center justify-between shrink-0 gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20 font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <GeneratorHeading id="ai-generator-title" className="flex min-w-0 items-center gap-2 text-base font-black text-white sm:text-lg">
                <span className="min-w-0 truncate">{t('generator.title')}</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold hidden sm:inline-block">
                  {t('generator.pro')}
                </span>
              </GeneratorHeading>
              <p className="hidden truncate text-xs text-zinc-400 sm:block">
                {t('generator.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex min-w-0 max-w-[min(42vw,22rem)] items-stretch overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/40 text-amber-300 shadow-md">
              <button
                type="button"
                onClick={onOpenRechargeModal || onOpenUpgradeModal}
                className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-xs font-black transition-colors hover:bg-amber-900/40"
                aria-label={paymentAccount ? t('generator.diamondBalance', { count: formatNumber(paymentAccount.wallet.balance) }) : t('common.loading')}
                title={paymentAccount ? t('generator.diamondBalance', { count: formatNumber(paymentAccount.wallet.balance) }) : t('common.loading')}
              >
                <Gem className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                <span className="hidden min-w-0 break-words text-left leading-tight sm:inline">{t('generator.diamondBalanceLabel')}</span>
                <span className="shrink-0 tabular-nums">{paymentAccount ? formatNumber(paymentAccount.wallet.balance) : '...'}</span>
                <span className="hidden shrink-0 text-[10px] font-semibold sm:inline">{t('generator.diamonds')}</span>
              </button>
              <button
                type="button"
                onClick={onOpenRechargeModal || onOpenUpgradeModal}
                className="flex w-11 shrink-0 items-center justify-center border-l border-amber-500/30 text-xl font-bold transition-colors hover:bg-amber-900/40"
                aria-label={t('generator.rechargeDiamonds')}
                title={t('generator.rechargeDiamonds')}
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>

            {!isWorkspace && (
              <button
                onClick={onClose}
                aria-label={t('generator.close')}
                className="mobile-touch-target flex items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        )}

        {/* Modal Main Body Grid: LEFT (Inputs + Presets + Settings) | RIGHT (Main Showcase Canvas + Community Share) */}
          <div
            tabIndex={0}
            aria-label={t('generator.title')}
            className="mobile-generator-body mobile-modal-scroll grid min-h-0 flex-1 grid-cols-1 divide-y overflow-y-auto overscroll-contain custom-scrollbar divide-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
          >
          
          {/* ================= LEFT PANEL (Cols 7): Mode + Filterable Presets + Custom Prompt + RENDER SETTINGS ================= */}
          <div className={`mobile-generator-wizard ${isMobilePage && mobileGeneratorView !== 'wizard' ? 'hidden ' : ''}${isMobilePage ? 'p-3 pb-5 flex flex-col gap-4' : 'lg:col-span-7 p-4 sm:p-5 space-y-4'} bg-[#101017] lg:col-span-7`}>
            
            {/* 1. Mode Switcher Bar */}
            <div className={`${showMobileGeneratorStep('mode') ? '' : 'hidden'} flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#181826] rounded-2xl border border-zinc-800`}>
              <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => handleMainModeChange('image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    mainMode === 'image'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{t('generator.imageMode')}</span>
                </button>
                <button
                  onClick={() => handleMainModeChange('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                    mainMode === 'video'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{t('generator.videoMode')}</span>
                </button>
              </div>

              {/* Sub Mode Pills */}
              <div className={mainMode === 'video'
                ? 'grid w-full grid-cols-1 gap-1 py-0.5 min-[400px]:grid-cols-3 sm:w-[390px]'
                : 'flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5'}>
                {mainMode === 'image' ? (
                  <>
                    <button
                      onClick={() => setSubMode('text-to-image')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        subMode === 'text-to-image'
                          ? 'bg-zinc-800 text-pink-400 border border-pink-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      ✍️ {t('generator.textToImage')}
                    </button>
                    <button
                      onClick={() => {
                        if (blockPremiumSelection(quality, 'image-to-image')) return;
                        setSubMode('image-to-image');
                      }}
                      className={`flex min-w-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        subMode === 'image-to-image'
                          ? 'bg-zinc-800 text-pink-400 border border-pink-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="shrink-0" aria-hidden="true">🖼️</span>
                      <span className="min-w-0 truncate">{t('generator.imageToImage')}</span>
                      <span className="shrink-0" role="img" aria-label={t('generator.vipModeBadge')} title={t('generator.vipModeBadge')}>
                        <Crown className="h-3 w-3 text-amber-300" aria-hidden="true" />
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { clearImageSource(); clearExtendVideo(); setSubMode('text-to-video'); }}
                      className={`flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-lg border px-2 py-1 text-center text-xs font-bold leading-tight transition-all ${
                        subMode === 'text-to-video'
                          ? 'border-pink-500/40 bg-zinc-800 text-pink-400'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>🎥 {t('generator.textToVideo')}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (blockPremiumSelection(quality, 'image-to-video')) return;
                        clearImageSource();
                        clearExtendVideo();
                        setSubMode('image-to-video');
                      }}
                      className={`flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-lg border px-2 py-1 text-center text-xs font-bold leading-tight transition-all ${
                        subMode === 'image-to-video'
                          ? 'border-pink-500/40 bg-zinc-800 text-pink-400'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="shrink-0" aria-hidden="true">🖼️</span>
                      <span className="min-w-0 break-words leading-tight">{t('generator.imageToVideo')}</span>
                      <span className="shrink-0" role="img" aria-label={t('generator.vipModeBadge')} title={t('generator.vipModeBadge')}>
                        <Crown className="h-3 w-3 text-amber-300" aria-hidden="true" />
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (blockPremiumSelection(quality, 'extend')) return;
                        clearImageSource();
                        setSubMode('extend');
                      }}
                      className={`flex min-h-10 min-w-0 w-full items-center justify-center gap-1 rounded-lg border px-2 py-1 text-center text-xs font-bold leading-tight transition-all ${
                        subMode === 'extend'
                          ? 'border-pink-500/40 bg-zinc-800 text-pink-400'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="shrink-0" aria-hidden="true">⏩</span>
                      <span className="min-w-0 break-words leading-tight">{t('generator.extendVideo')}</span>
                      <span className="shrink-0" role="img" aria-label={t('generator.vipModeBadge')} title={t('generator.vipModeBadge')}>
                        <Crown className="h-3 w-3 text-amber-300" aria-hidden="true" />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Local MP4 source for video extension */}
            {mainMode === 'video' && subMode === 'extend' && (
              <div className={`${showMobileGeneratorStep('source') ? '' : 'hidden'} space-y-3 p-3.5 bg-[#181826] rounded-2xl border border-pink-500/40 animate-in fade-in duration-200`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>{t('generator.extendChooseVideo')}</span>
                    </label>
                    <p className="text-[10px] text-zinc-400 mt-1">{t('generator.extendMp4Only')}</p>
                  </div>
                  {extendVideoFile && (
                    <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-300">{extendVideoUploadPending ? t('common.loading') : t('generator.extendSelectedVideo')}</span>
                      <button
                        type="button"
                        onClick={clearExtendVideo}
                        className="px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500"
                      >
                        {t('generator.extendClearVideo')}
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={extendVideoInputRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  className="hidden"
                  onChange={(event) => {
                    handleExtendVideoSelect(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />

                {extendVideoUrl && extendVideoFile ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-700">
                      <video
                        src={extendVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <span className="min-w-0 text-zinc-200 truncate" title={extendVideoFile.name}>{t('generator.extendFileName')}: {extendVideoFile.name}</span>
                      <span className="text-zinc-400 shrink-0">{t('generator.extendFileSize')}: {(extendVideoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => extendVideoInputRef.current?.click()}
                      className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-pink-400" />
                      <span>{t('generator.extendReplaceVideo')}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => extendVideoInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 hover:border-pink-500/60 hover:bg-zinc-900 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Upload className="w-6 h-6 text-pink-400" />
                    <span className="text-xs font-bold">{t('generator.extendSelectVideo')}</span>
                    <span className="text-[10px] text-zinc-400">{t('generator.extendNoVideo')}</span>
                  </button>
                )}

                {extendVideoError && <p className="text-[10px] text-rose-300">{extendVideoError}</p>}
              </div>
            )}

            {/* Reference Image Upload Area (If Image-to-Image or Image-to-Video) */}
            {showReferencePanel && (
              <div className={`${showMobileGeneratorStep('source') ? '' : 'hidden'} p-3 bg-[#181826] rounded-2xl border border-zinc-800 space-y-2 animate-in fade-in duration-200`}>
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-pink-400" />
                    <span>{t('generator.uploadReference')}</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">{t('generator.supportedFormats')}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-pink-500/50 shadow-md shrink-0 group">
                    {sourcePreviewUrl ? (
                      <img src={sourcePreviewUrl} alt={t('generator.uploadReference')} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Upload className="w-4 h-4 text-zinc-600" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          void handleSourceUpload(event.target.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sourceUploadPending}
                        className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-pink-400" />
                        <span>{sourceUploadPending ? t('common.loading') : t('generator.uploadLocal')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={openTargetPicker}
                        className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700"
                      >
                        {t('generator.selectCharacter')}
                      </button>
                      {(sourceMediaId || sourceTarget) && (
                        <button type="button" onClick={clearImageSource} className="px-2 py-1 rounded-xl text-[10px] text-zinc-400 hover:text-white">
                          {t('generator.clear')}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {sourceTarget
                        ? t('generator.referenceCharacter', { name: sourceTarget.name })
                        : sourceMediaId
                          ? t('generator.localImage')
                          : t('generator.referenceRequired')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Presets Gallery (姿势、服装、场景与左右切换) */}
            {subMode !== 'extend' && <div className={`${showMobileGeneratorStep('mode') ? '' : 'hidden'} space-y-2.5 p-3.5 bg-[#181826] rounded-2xl border border-zinc-800`}>
              
              {/* Category Tab Switcher + Left/Right Toggle Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-pink-400" />
                  <span className="font-extrabold text-xs text-white">{t('generator.presetLibrary')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handlePresetTabChange('pose')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePresetTab === 'pose'
                          ? 'bg-pink-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      💃 {t('generator.pose')} ({selectedPose ? t('generator.selected') : t('generator.unselected')})
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetTabChange('outfit')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePresetTab === 'outfit'
                          ? 'bg-pink-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      👗 {t('generator.outfit')} ({selectedOutfit ? t('generator.selected') : t('generator.unselected')})
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetTabChange('scene')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activePresetTab === 'scene'
                          ? 'bg-pink-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      🌄 {t('generator.scene')} ({selectedScene ? t('generator.selected') : t('generator.unselected')})
                    </button>
                  </div>

                  {/* Left / Right Carousel Toggle Controls */}
                  <div className="flex items-center gap-1 bg-[#12121a] p-0.5 rounded-xl border border-zinc-800 shrink-0">
                    <button
                      type="button"
                      onClick={scrollPresetsLeft}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-pink-400 transition-colors"
                      title={t('generator.switchLeft')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-zinc-400 font-mono px-0.5 font-bold">{t('generator.switchLeft')} / {t('generator.switchRight')}</span>
                    <button
                      type="button"
                      onClick={scrollPresetsRight}
                      className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-pink-400 transition-colors"
                      title={t('generator.switchRight')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset Grid (2-Row Horizontal Scrollable Grid with Left/Right Navigation) */}
              <div className="relative group/preset-gallery">
                {/* Left Floating Arrow Button */}
                <button
                  type="button"
                  onClick={scrollPresetsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-14 bg-black/80 hover:bg-pink-600 text-white rounded-r-xl flex items-center justify-center opacity-70 hover:opacity-100 transition-all shadow-xl border border-l-0 border-zinc-700/80 backdrop-blur-sm"
                  title={t('generator.left')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* 2-Row Flow Grid Container */}
                <div
                  ref={presetScrollRef}
                  onScroll={rememberPresetScrollPosition}
                  className="grid grid-rows-2 grid-flow-col auto-cols-[105px] sm:auto-cols-[115px] gap-2.5 overflow-x-auto scroll-smooth custom-scrollbar pb-2 pt-1 px-1"
                >
                  {(activePresetTab === 'pose' ? posePresets : activePresetTab === 'outfit' ? outfitPresets : scenePresets).map((item) => {
                    const isSelected = activePresetTab === 'pose' 
                      ? selectedPose === item.id 
                      : activePresetTab === 'outfit' 
                      ? selectedOutfit === item.id 
                      : selectedScene === item.id;

                    const handleSelect = () => {
                      if (activePresetTab === 'pose') setSelectedPose((current) => current === item.id ? null : item.id);
                      if (activePresetTab === 'outfit') setSelectedOutfit((current) => current === item.id ? null : item.id);
                      if (activePresetTab === 'scene') setSelectedScene((current) => current === item.id ? null : item.id);
                    };

                    return (
                      <div
                        key={item.id}
                        onClick={handleSelect}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border cursor-pointer group transition-all duration-200 select-none ${
                          isSelected 
                            ? 'ring-2 ring-pink-500 border-pink-500 scale-[1.02] shadow-lg shadow-pink-950/50' 
                            : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <img
                          src={item.imageUrl}
                          srcSet={item.imageSrcSet}
                          sizes="(max-width: 640px) 50vw, 320px"
                          alt={presetLabel(item)}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            if (!event.currentTarget.src.endsWith(GENERATOR_DEFAULT_IMAGE)) {
                              event.currentTarget.src = GENERATOR_DEFAULT_IMAGE;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                          <span className="text-white text-[10px] font-extrabold truncate drop-shadow">{presetLabel(item)}</span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Floating Arrow Button */}
                <button
                  type="button"
                  onClick={scrollPresetsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-14 bg-black/80 hover:bg-pink-600 text-white rounded-l-xl flex items-center justify-center opacity-70 hover:opacity-100 transition-all shadow-xl border border-r-0 border-zinc-700/80 backdrop-blur-sm"
                  title={t('generator.right')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>}

            {/* 2.5 Image Art Style Selector (二次元 / 写实) */}
            {subMode !== 'extend' && <div className="space-y-1.5 p-3 bg-[#181826] rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>{t('generator.style')}</span>
                </label>
                <span className="text-[10px] text-pink-400 font-mono font-bold">
                  {imageStyle === 'anime' ? `🎨 ${t('generator.anime')}` : `📸 ${t('generator.realistic')}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImageStyle('anime')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    imageStyle === 'anime'
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500 text-pink-300 shadow-md ring-1 ring-pink-500/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">🎨</span>
                  <div className="text-left">
                    <div className="font-black text-xs">{t('generator.anime')}</div>
                    <div className="text-[9px] text-zinc-400 font-normal">{t('generator.animeDesc')}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImageStyle('realistic')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                    imageStyle === 'realistic'
                      ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 border-rose-500 text-rose-300 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">📸</span>
                  <div className="text-left">
                    <div className="font-black text-xs">{t('generator.realistic')}</div>
                    <div className="text-[9px] text-zinc-400 font-normal">{t('generator.realisticDesc')}</div>
                  </div>
                </button>
              </div>
            </div>}

            {/* 3. Custom Prompt Input */}
            <div className={`${showMobileGeneratorStep('prompt') ? '' : 'hidden'} space-y-1.5 p-3 bg-[#181826] rounded-2xl border border-zinc-800`}>
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-pink-400" />
                  <span>{t('generator.customDetails')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCustomPrompt(DEFAULT_CUSTOM_PROMPT)}
                  className="text-[10px] text-pink-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t('generator.randomInspiration')}</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={customPrompt}
                maxLength={generationOptions?.maxPromptLength ?? 4000}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t('generator.customDetails')}
                className="w-full bg-[#101017] text-white placeholder-zinc-500 px-3 py-1.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-pink-500 text-xs leading-relaxed"
              />

              <div className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-2">
                <span className="text-pink-400 font-bold shrink-0">{t('generator.prompt')}</span>
                <p className="truncate text-zinc-300 font-mono flex-1">
                  {getVisiblePrompt()}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="p-0.5 text-zinc-400 hover:text-white shrink-0"
                  aria-label={t('generator.prompt')}
                  title={t('generator.prompt')}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 4. Audio Dialogue for Video */}
            {mainMode === 'video' && subMode === 'image-to-video' && (
              <div className={`${showMobileGeneratorStep('dialogue') ? '' : 'hidden'} space-y-1.5 p-3 bg-[#181826] rounded-2xl border border-zinc-800`}>
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>{t('generator.dialogue')}</span>
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">{t('generator.costPerSecond')}</span>
                </div>

                <input
                  type="text"
                  value={dialogueText}
                  onChange={(e) => setDialogueText(e.target.value)}
                  placeholder={t('generator.dialoguePlaceholder')}
                  className="w-full bg-[#101017] text-white placeholder-zinc-500 px-3 py-1.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-cyan-500 text-xs"
                />
                {dialogueText.trim() && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-zinc-400" htmlFor="generator-voice">
                      {t('generator.voice')}
                    </label>
                    <select
                      id="generator-voice"
                      value={selectedVoiceId}
                      disabled={voiceLoading || !voices.length}
                      onChange={(event) => setSelectedVoiceId(event.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-[#101017] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      {!voices.length && <option value="">{voiceLoading ? t('generator.loadingVoices') : t('generator.errorVoices')}</option>}
                      {voices.map((voice) => (
                        <option key={voice.voiceId} value={voice.voiceId}>
                          {voice.name} · {voice.language}
                        </option>
                      ))}
                    </select>
                    {voiceError && (
                      <div className="flex items-center justify-between gap-2 text-[10px] text-rose-300">
                        <p>{voiceError}</p>
                        <button
                          type="button"
                          onClick={() => { void loadVoices(); }}
                          disabled={voiceLoading}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-500/40 px-2 py-1 font-bold text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${voiceLoading ? 'animate-spin' : ''}`} />
                          <span>{t('common.retry')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. Highlighted RENDER & PARAMETERS SETTINGS BLOCK (渲染与参数设置 - Prominently Placed on Left) */}
            <div className={`${showMobileGeneratorStep('settings') ? '' : 'hidden'} p-4 bg-gradient-to-b from-[#18182a] via-[#141422] to-[#18182a] rounded-2xl border-2 border-pink-500/40 shadow-xl shadow-pink-950/30 space-y-3 relative overflow-hidden`}>
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">⚙️ {t('generator.renderSettings')}</h3>
                    <p className="text-[10px] text-zinc-400">{t('generator.renderHint')}</p>
                  </div>
                </div>

                <span className="text-[10px] bg-pink-600 text-white font-bold px-2 py-0.5 rounded-full shadow">
                  {t('generator.priority')}
                </span>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 gap-3 text-xs min-[360px]:grid-cols-2">
                
                {/* Resolution */}
                <div className="space-y-1">
                  <div className="flex min-h-5 items-center justify-between">
                    <label className="text-zinc-400 font-bold block text-[11px]">{t('generator.quality')}</label>
                    <span className="text-[10px] text-amber-400 font-bold">{t('generator.lite')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(mainMode === 'video' ? videoQualities : ['720p', '1080p', '4k'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (blockPremiumSelection(item)) return;
                          setQuality(item as '720p' | '1080p' | '4k');
                        }}
                        className={`h-9 flex-1 rounded-lg border px-2 font-extrabold text-[11px] transition-all relative flex items-center justify-center gap-1 ${
                          quality === item
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                        }`}
                      >
                        <span>{item.toUpperCase()}</span>
                        {premiumQuality(item) && (
                          <Crown
                            className="h-3 w-3 shrink-0 text-amber-300"
                            aria-label={t('generator.vipModeBadge')}
                            title={t('generator.vipModeBadge')}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Slider (5s - 15s) */}
                {mainMode === 'video' ? (
                  <div className="space-y-1">
                    <div className="flex min-h-5 items-center justify-between">
                      <label className="text-zinc-400 font-bold block text-[11px]">{t('generator.duration')}</label>
                    </div>
                    <div className="flex items-center gap-1">
                      {videoDurations.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setDuration(value)}
                          className={`h-9 flex-1 rounded-lg border px-2 text-[11px] font-extrabold transition-all ${
                            duration === value
                              ? 'bg-pink-600 text-white border-pink-400 shadow'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                          }`}
                        >
                          {t('generator.secondsShort', { count: value })}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-bold block text-[11px]">{t('generator.resolution')}</label>
                    <div className="py-1 px-2.5 rounded-lg bg-zinc-800 text-pink-400 font-bold border border-zinc-700 text-[11px] text-center">
                      4K Ultra HDR
                    </div>
                  </div>
                )}

                {/* Aspect Ratio */}
                <div className="col-span-2 space-y-1">
                  <label className="text-zinc-400 font-bold block text-[11px]">{t('generator.aspectRatio')}</label>
                  <div className="grid grid-cols-2 gap-1 min-[480px]:grid-cols-5">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-1 text-[10px] font-extrabold rounded-lg border text-center transition-all ${
                          aspectRatio === ratio
                            ? 'bg-pink-600 text-white border-pink-400 shadow'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video quantity remains fixed; image mode uses this slot for Seed. */}
                {mainMode === 'video' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-400 font-bold block text-[11px]">{t('generator.countVideo')}</label>
                    </div>
                    <div className="py-1 px-2.5 rounded-lg bg-zinc-800/80 text-zinc-300 font-bold border border-zinc-700/60 text-[11px] flex items-center justify-between">
                      <span className="text-pink-400 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 inline" /> {t('generator.videoSingle')}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">{t('generator.singleOnly')}</span>
                    </div>
                  </div>
                )}

                {/* Seed toggle */}
                <div className="space-y-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setUseSeed(!useSeed)}
                    className={`py-1 px-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all ${seedToggleClassName}`}
                  >
                    <span>{t('generator.fixedSeed')}</span>
                    <span>{useSeed ? t('generator.locked') : t('generator.random')}</span>
                  </button>
                </div>

              </div>

              {/* ACTION GENERATE BUTTON */}
              <div className={`${isMobilePage ? 'hidden' : ''} sticky bottom-0 z-10 -mx-4 space-y-1.5 bg-[#101017]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm sm:-mx-5 sm:px-5 lg:static lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generationDisabled}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 active:scale-98 text-white font-extrabold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-pink-500/30"
                >
                  <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                  <span>
                      {generating
                      ? t('generator.generating')
                      : `🚀 ${mainMode === 'video' ? t('generator.generateVideo') : t('generator.generateImage')}`}
                  </span>
                  {!generating && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-amber-100">
                      <Gem className="h-4 w-4" aria-hidden="true" />
                      <span>{formatNumber(generationDiamondCost)} {t('generator.diamonds')}</span>
                    </span>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* ================= RIGHT PANEL (Cols 5): WHOLE RIGHT SIDE FOR GENERATION RESULT SHOWCASE & SHARE ================= */}
          <div className={`mobile-generator-result ${isMobilePage && mobileGeneratorView !== 'result' ? 'hidden ' : ''}lg:col-span-5 min-h-0 p-4 sm:p-5 space-y-4 bg-[#14141e] flex flex-col`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="font-extrabold text-sm text-white">{t('generator.stageTitle')}</span>
              </div>
              <span className="text-[10px] text-zinc-400">{t('generator.liveResult')}</span>
            </div>

            {/* Toast notice */}
            {shareToast && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{shareToast}</span>
              </div>
            )}

            {/* Active Output Display Canvas */}
            <div className="relative space-y-3">
              {generating ? (
                <div className="aspect-[4/5] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden shadow-2xl">
                  <img
                    src="/assets/lurova-entry-poster-v1.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover animate-pulse"
                    style={{ opacity: 0.18 + (genProgress / 100) * 0.35 }}
                  />
                  <div className="absolute inset-0 bg-zinc-950/60" />
                  <div className="relative z-10 w-14 h-14 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-7 h-7 animate-spin" />
                  </div>
                  <div className="space-y-1 z-10">
                    <p className="text-xs font-black text-white">{genStepText}</p>
                    <p className="text-[10px] text-zinc-400">{t('generator.engine')}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="relative z-10 w-52 h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
                      style={{ width: `${genProgress}%` }}
                    />
                  </div>
                  <button type="button" onClick={handleCancelGeneration} className="relative z-10 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700">
                    {t('generator.cancel')}
                  </button>
                </div>
              ) : generationError ? (
                <div className="aspect-[4/5] rounded-2xl bg-zinc-900 border border-rose-500/40 p-6 text-center space-y-3 flex flex-col items-center justify-center">
                  <p className="text-xs font-bold text-rose-300">{generationError}</p>
                  {generationJob?.status === 'failed' && (
                    <button type="button" onClick={handleRetryGeneration} className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold border border-zinc-700">
                      {t('common.retry')}
                    </button>
                  )}
                </div>
              ) : generatedOutputs.length > 0 ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className={`grid gap-3 ${generatedOutputs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {generatedOutputs.map((output) => (
                      <button
                        type="button"
                        key={output.id}
                        onClick={() => setGeneratedOutput(output)}
                        className={`relative aspect-[4/5] rounded-2xl overflow-hidden border-2 shadow-2xl bg-black group text-left ${
                          generatedOutput?.id === output.id ? 'border-pink-500/80 ring-2 ring-pink-500/40' : 'border-pink-500/30'
                        }`}
                      >
                        {output.type === 'video' ? (
                          <video src={output.url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={output.url} alt={t('generator.resultImage')} className="w-full h-full object-cover" />
                        )}
                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          {output.type === 'video' ? <Film className="w-3 h-3 text-pink-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                          <span>{output.type === 'video' ? t('generator.resultVideo') : t('generator.resultImage')}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {generatedOutput && (
                    <div className="space-y-2">
                      <button
                        onClick={handleShareToCommunity}
                        disabled={Boolean(generatedOutput.isShared || sharingOutputId)}
                        className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                          generatedOutput.isShared ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 text-white shadow-pink-500/20 active:scale-98'
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{generatedOutput.isShared ? t('generator.shareDone') : t('generator.share')}</span>
                      </button>
                      <div className={`grid gap-2 text-xs ${isMobilePage ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {isMobilePage && (
                          <button
                            type="button"
                            onClick={handleCopyGeneratedPrompt}
                            className="rounded-xl border border-zinc-700 bg-zinc-800 px-2 py-2 font-bold text-zinc-200 transition-colors hover:bg-zinc-700"
                            aria-label={t('generator.prompt')}
                            title={t('generator.prompt')}
                          >
                            {copied ? <Check className="mx-auto h-4 w-4 text-emerald-400" /> : <Copy className="mx-auto h-4 w-4 text-pink-400" />}
                          </button>
                        )}
                        <a href={generatedOutput.url} target="_blank" rel="noreferrer" className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700">
                          <Download className="w-3.5 h-3.5 text-pink-400" />
                          <span>{t('generator.download')}</span>
                        </a>
                        {onSetChatBg && (
                          <button onClick={() => onSetChatBg(generatedOutput.url)} className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700">
                            <Wallpaper className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{t('generator.setBackground')}</span>
                          </button>
                        )}
                        {generatedOutput.type === 'video' ? (
                          <button
                            onClick={() => { void handleRegenerateVideo(); }}
                            disabled={generating}
                            className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${generating ? 'animate-spin' : ''}`} />
                            <span>{generating ? t('generator.regenerating') : t('generator.regenerate')}</span>
                          </button>
                        ) : (
                          <button onClick={handleCreateCharacterFromOutput} className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700">
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{t('generator.makeCharacter')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : generatedOutput ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  
                  {/* Large Media Preview Box */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-pink-500/50 shadow-2xl bg-black group">
                    {generatedOutput.type === 'video' ? (
                      <video
                        src={generatedOutput.url}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={generatedOutput.url}
                        alt={t('generator.resultImage')}
                        className="w-full h-full object-cover"
                      />
                    )}

                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      {generatedOutput.type === 'video' ? <Film className="w-3 h-3 text-pink-400" /> : <ImageIcon className="w-3 h-3 text-pink-400" />}
                      <span>{generatedOutput.type === 'video' ? t('generator.resultVideo') : t('generator.resultImage')}</span>
                    </div>
                  </div>

                  {/* Result actions */}
                  <div className="space-y-2">
                    
                    {/* Primary Highlighted Share Button */}
                    <button
                      onClick={handleShareToCommunity}
                      disabled={Boolean(generatedOutput.isShared || sharingOutputId)}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                        generatedOutput.isShared
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 text-white shadow-pink-500/20 active:scale-98'
                      }`}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{generatedOutput.isShared ? t('generator.shareDone') : t('generator.share')}</span>
                    </button>

                    {/* Secondary Actions Row */}
                    <div className={`grid gap-2 text-xs ${isMobilePage ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {isMobilePage && (
                        <button
                          type="button"
                          onClick={handleCopyGeneratedPrompt}
                          className="rounded-xl border border-zinc-700 bg-zinc-800 px-2 py-2 font-bold text-zinc-200 transition-colors hover:bg-zinc-700"
                          aria-label={t('generator.prompt')}
                          title={t('generator.prompt')}
                        >
                          {copied ? <Check className="mx-auto h-4 w-4 text-emerald-400" /> : <Copy className="mx-auto h-4 w-4 text-pink-400" />}
                        </button>
                      )}
                      <a
                        href={generatedOutput.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700"
                      >
                        <Download className="w-3.5 h-3.5 text-pink-400" />
                        <span>{t('generator.download')}</span>
                      </a>

                      {onSetChatBg && (
                        <button
                          onClick={() => {
                            onSetChatBg(generatedOutput.url);
                            setShareToast(t('generator.setBackground'));
                            setTimeout(() => setShareToast(null), 2500);
                          }}
                          className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700"
                        >
                          <Wallpaper className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t('generator.setBackground')}</span>
                        </button>
                      )}

                      {generatedOutput.type === 'video' ? (
                        <button
                          onClick={() => { void handleRegenerateVideo(); }}
                          disabled={generating}
                          className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${generating ? 'animate-spin' : ''}`} />
                          <span>{generating ? t('generator.regenerating') : t('generator.regenerate')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleCreateCharacterFromOutput}
                          className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center gap-1 border border-zinc-700"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t('generator.makeCharacter')}</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="aspect-[4/5] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center">
                    {mainMode === 'video' ? <Film className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-400">
                    {mainMode === 'video' ? t('generator.resultVideo') : t('generator.resultImage')}
                  </span>
                </div>
              )}
            </div>

            {/* My History Gallery Section (历史生成作品) */}
            <div className={`${isMobilePage ? 'hidden ' : ''}flex-1 min-h-0 space-y-2 pt-3 border-t border-zinc-800/80 lg:flex lg:flex-col`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-white">{t('generator.history', { count: historyWorks.length })}</span>
                <span className="text-[10px] text-zinc-400">{t('generator.historyHint')}</span>
              </div>

              <div className="max-h-[160px] overflow-y-auto p-1.5 custom-scrollbar lg:min-h-0 lg:max-h-none lg:flex-1">
                {historyWorks.length ? (
                  <div className="columns-2 gap-2 sm:columns-3">
                    {historyWorks.map((work) => {
                      const isSelected = generatedOutput?.id === work.id;

                      return (
                        <button
                          key={work.id}
                          type="button"
                          onClick={() => selectHistoryWork(work)}
                          aria-label={work.prompt || t('generator.historyHint')}
                          className={`group relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg border p-0 text-left transition-all ${
                            isSelected ? 'border-pink-500 ring-2 ring-inset ring-pink-500' : 'border-zinc-800 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {work.type === 'video' ? (
                            <video src={work.url} preload="metadata" playsInline className="block h-auto w-full bg-black" />
                          ) : (
                            <img
                              src={work.url}
                              alt={t('generator.historyHint')}
                              loading="lazy"
                              decoding="async"
                              className="block h-auto w-full"
                            />
                          )}

                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye className="h-4 w-4 text-white" />
                          </span>

                          <span className="absolute left-1 top-1 rounded-full bg-black/70 px-1 py-0.5 text-[8px] text-white">
                            {work.type === 'video' ? t('generator.video') : t('generator.image')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-[10px] text-zinc-400">{t('generator.noHistory')}</p>
                )}
              </div>
            </div>

          </div>

          {isMobilePage && mobileGeneratorView === 'home' && (
            <section className="mobile-generator-home mobile-modal-scroll min-h-0 overflow-y-auto bg-[#101017] custom-scrollbar" aria-live="polite">
              <div className="border-b border-white/[0.07] bg-[#13131c] px-4 pb-5 pt-4">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h1 id="ai-generator-title" className="text-base font-black text-zinc-50">{t('generator.title')}</h1>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{t('generator.subtitle')}</p>
                  </div>
                  <Sparkles className="h-5 w-5 shrink-0 text-pink-400" aria-hidden="true" />
                </div>

                <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => startMobileGenerator('image')}
                    className="group flex min-h-32 min-w-0 flex-col items-start justify-between rounded-2xl border border-pink-400/30 bg-[#1c1821] p-3 text-left shadow-[0_10px_30px_rgba(236,72,153,0.08)] transition-colors hover:border-pink-400/55 hover:bg-[#211a26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017]"
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-400/25 bg-pink-400/10 text-pink-300">
                        <ImageIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-pink-300" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-zinc-50">{t('generator.imageMode')}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-zinc-400">{t('generator.animeDesc')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startMobileGenerator('video')}
                    className="group flex min-h-32 min-w-0 flex-col items-start justify-between rounded-2xl border border-white/[0.09] bg-[#191923] p-3 text-left shadow-[0_10px_30px_rgba(20,18,32,0.22)] transition-colors hover:border-cyan-400/35 hover:bg-[#1e1e29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017]"
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                        <Video className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-zinc-50">{t('generator.videoMode')}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-zinc-400">{t('generator.renderHint')}</span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="px-4 pb-8 pt-5">
                <h2 className="text-base font-black text-zinc-50">{t('generator.history', { count: historyWorks.length })}</h2>
                    <p className="mt-1 text-[11px] text-zinc-400">{t('generator.historyHint')}</p>

                <div className="mt-3 grid grid-cols-3 rounded-xl border border-white/[0.07] bg-[#15151e] p-1" role="group" aria-label={t('generator.history', { count: historyWorks.length })}>
                  {([
                    ['all', t('common.all'), historyWorks.length],
                    ['image', t('generator.image'), imageHistoryCount],
                    ['video', t('generator.video'), videoHistoryCount],
                  ] as const).map(([filter, label, count]) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setMobileHistoryFilter(filter)}
                      aria-pressed={mobileHistoryFilter === filter}
                      className={`min-w-0 rounded-lg px-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017] ${
                        mobileHistoryFilter === filter
                          ? 'bg-pink-600 text-white shadow-[0_4px_14px_rgba(236,72,153,0.24)]'
                          : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      <span className={`ml-1 tabular-nums ${mobileHistoryFilter === filter ? 'text-pink-100' : 'text-zinc-400'}`}>{count}</span>
                    </button>
                  ))}
                </div>

                {filteredHistoryWorks.length ? (
                  <div className="mobile-generator-history-grid mt-3 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3">
                    {filteredHistoryWorks.map((work) => (
                      <button
                        key={work.id}
                        type="button"
                        onClick={() => selectHistoryWork(work)}
                        aria-label={work.prompt || t('generator.historyHint')}
                        className="group min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181821] text-left shadow-[0_8px_24px_rgba(12,10,20,0.18)] transition-colors hover:border-pink-400/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017]"
                      >
                        <span className="relative block aspect-[4/5] overflow-hidden bg-[#0d0d12]">
                          {work.type === 'video'
                            ? <video src={work.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                            : <img src={work.url} alt={work.prompt || t('generator.historyHint')} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-white/15 bg-[#111118]/80 px-2 py-1 text-[10px] font-bold text-zinc-100 backdrop-blur-sm">
                            {work.type === 'video' ? <Film className="h-3 w-3 text-pink-300" aria-hidden="true" /> : <ImageIcon className="h-3 w-3 text-pink-300" aria-hidden="true" />}
                            {work.type === 'video' ? t('generator.video') : t('generator.image')}
                          </span>
                          {work.type === 'video' && (
                            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#111118]/80 text-zinc-50 backdrop-blur-sm">
                              <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        {work.prompt.trim() && <span className="block truncate px-3 py-2.5 text-[11px] font-semibold text-zinc-300">{work.prompt}</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.09] bg-[#15151e] px-6 text-center">
                    <History className="h-7 w-7 text-zinc-600" aria-hidden="true" />
                    <p className="text-sm font-bold text-zinc-300">{t('generator.noHistory')}</p>
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
        {isMobilePage && mobileGeneratorView === 'wizard' && (
          <div className="mobile-generator-footer flex shrink-0 items-center justify-between gap-2 border-t border-zinc-800 bg-[#161622] px-3 py-3">
            <button
              type="button"
              onClick={handlePreviousMobileGeneratorStep}
              disabled={mobileGeneratorStep === 0 || generating}
              className="mobile-touch-target flex min-w-0 items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-xs font-bold text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('common.back')}</span>
            </button>
            {activeMobileGeneratorStep === 'settings' ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generationDisabled}
                className="mobile-touch-target flex min-w-0 items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-pink-500/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? t('generator.generating') : mainMode === 'video' ? t('generator.generateVideo') : t('generator.generateImage')}</span>
                {!generating && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-amber-100">
                    <Gem className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{formatNumber(generationDiamondCost)} {t('generator.diamonds')}</span>
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextMobileGeneratorStep}
                className="mobile-touch-target flex min-w-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-pink-500/30 transition-all hover:brightness-110"
              >
                <span>{t('common.next')}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {targetPickerOpen && (
          <div className="mobile-generator-target-picker absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
            <div className="mobile-generator-target-picker-panel flex h-full max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-[#101017] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#161622] px-4 py-3">
                <div>
                  <h3 className="text-sm font-black text-white">{t('generator.characterPickerTitle')}</h3>
                  <p className="text-[10px] text-zinc-400">{t('generator.characterPickerHint')}</p>
                </div>
                <button type="button" onClick={() => setTargetPickerOpen(false)} aria-label={t('common.close')} title={t('common.close')} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161622]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
                <aside className="mobile-generator-target-filters shrink-0 space-y-3 overflow-x-auto border-b border-zinc-800 bg-[#14141e] p-3 sm:w-48 sm:overflow-y-auto sm:border-b-0 sm:border-r">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">{t('generator.scope')}</span>
                    <div className="flex gap-1 sm:flex-col">
                      {([['all', t('common.all')], ['created', t('generator.created')], ['liked', t('generator.liked')]] as const).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => { setTargetScope(value); resetTargetSearch(); }} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-bold ${targetScope === value ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50' : 'text-white/80 hover:bg-zinc-800 hover:text-white'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">{t('generator.gender')}</span>
                    <div className="flex gap-1 sm:flex-col">
                      {([['all', t('generator.anyGender')], ['female', t('generator.female')], ['male', t('generator.male')], ['nonbinary', t('generator.nonbinary')]] as const).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => { setTargetGender(value); resetTargetSearch(); }} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-bold ${targetGender === value ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50' : 'text-white/80 hover:bg-zinc-800 hover:text-white'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">{t('generator.styleFilter')}</span>
                    <div className="flex gap-1 sm:flex-col">
                      {([['all', t('generator.anyStyle')], ['anime', t('generator.anime')], ['realistic', t('generator.realistic')]] as const).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => { setTargetStyle(value); resetTargetSearch(); }} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-bold ${targetStyle === value ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50' : 'text-white/80 hover:bg-zinc-800 hover:text-white'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400">{t('generator.age')}</span>
                    <div className="flex gap-1 sm:flex-col">
                      {([['all', t('generator.anyAge')], ['teen', t('generator.teen')], ['young', t('generator.young')], ['adult', t('generator.adult')], ['mature', t('generator.mature')]] as const).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => { setTargetAgeGroup(value); resetTargetSearch(); }} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-xs font-bold ${targetAgeGroup === value ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50' : 'text-white/80 hover:bg-zinc-800 hover:text-white'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                </aside>
                <section className="mobile-generator-target-results flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 p-3">
                    <input
                      value={targetQuery}
                      onChange={(event) => { setTargetQuery(event.target.value); resetTargetSearch(); }}
                      placeholder={t('generator.search')}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-800 bg-[#181826] px-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-pink-500"
                    />
                    <span className="shrink-0 text-[10px] text-zinc-400">{targetItems.length}/{targetTotal}</span>
                  </div>
                  <div ref={targetPickerScrollRef} onScroll={handleTargetPickerScroll} tabIndex={0} aria-label={t('generator.characterPickerTitle')} className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-3 custom-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101017] min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {targetItems.map((target) => {
                      const image = subMode === 'image-to-video'
                        ? target.cardPreview?.image
                        : target.cardPreview?.image || target.image;
                      const selected = sourceTarget?.id === target.id;
                      return (
                        <button
                          type="button"
                          key={`${target.target}-${target.id}`}
                          disabled={!image}
                          onClick={() => handleTargetSelect(target)}
                          className={`relative aspect-[3/4] overflow-hidden rounded-xl border text-left ${selected ? 'border-pink-500 ring-2 ring-pink-500/40' : 'border-zinc-800'} ${image ? 'hover:border-pink-400' : 'cursor-not-allowed opacity-50'}`}
                        >
                          {image ? <img src={image.url} alt={target.name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-zinc-900 px-2 text-center text-[10px] text-zinc-400">{t('generator.noImage')}</div>}
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1.5 text-[10px] font-bold text-white">{target.name}</span>
                          {selected && <span className="absolute right-1 top-1 rounded-full bg-pink-500 p-1 text-white"><Check className="h-3 w-3" /></span>}
                        </button>
                      );
                    })}
                    {targetLoading && <div className="col-span-full py-8 text-center text-xs text-zinc-400">{t('generator.loadingCards')}</div>}
                    {!targetLoading && targetError && <div className="col-span-full py-8 text-center text-xs text-rose-300">{targetError}</div>}
                    {!targetLoading && !targetError && !targetItems.length && <div className="col-span-full py-8 text-center text-xs text-zinc-400">{t('generator.noCards')}</div>}
                    {!targetLoading && targetItems.length >= targetTotal && targetItems.length > 0 && <div className="col-span-full py-3 text-center text-[10px] text-zinc-400">{t('generator.loadedCards')}</div>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {characterPrototypeSource && (
      <CreateCharacterModal
        key={characterPrototypeSource.id}
        isOpen
        flowMode="generatedImagePrototype"
        generatedImageSource={{
          mediaId: characterPrototypeSource.mediaId,
          jobId: characterPrototypeSource.jobId,
          url: characterPrototypeSource.url,
          prompt: characterPrototypeSource.promptUsed,
        }}
        generatedImageDraft={characterPrototypeDraft}
        generatedImageDraftLoading={characterPrototypeDraftLoading}
        generatedImageDraftError={characterPrototypeDraftError}
        onRetryGeneratedImageDraft={() => { void requestCharacterPrototypeDraft(characterPrototypeSource); }}
        onClose={closeCharacterPrototype}
        onCreateCharacter={(character) => onCharacterCreated?.(character)}
        onOpenUpgradeModal={() => onOpenUpgradeModal?.()}
        onOpenQuickUpgradeModal={onOpenQuickUpgradeModal}
        membershipFeatureKeys={membershipFeatureKeys}
        onOpenCharacterDetail={onOpenCharacterDetail ? (character) => {
          closeCharacterPrototype();
          onOpenCharacterDetail(character);
          onClose();
        } : undefined}
      />
    )}
    </>
  );
};
