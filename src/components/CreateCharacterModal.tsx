import {EditorialGallery} from './EditorialGallery';
import {DESIGN_PREVIEW} from '../previewApi';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  Wand2, 
  Check, 
  Upload, 
  Film, 
  RefreshCw, 
  User, 
  Play, 
  Sliders,
  Palette,
  Smile,
  Briefcase,
  Users,
  Heart,
  Flame,
  Clapperboard,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Maximize2,
  Sparkle,
  MoonStar,
  PawPrint,
  Feather,
  Droplets,
  CircleUserRound,
  Globe,
  Dna,
  ShieldAlert,
  Zap,
  Tag,
  Eye,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Scissors,
  CheckSquare,
  Layers,
  SparklesIcon,
  Crown
} from 'lucide-react';
import { Character, GenderType, ArtStyleType, InteractiveScenario } from '../types';
import { api, ApiError, type ApiChatVoice, type ApiGenerationJob, type GeneratedImageDraft } from '../api';
import { registerLocaleMessages, useLocale } from '../i18n';
import { readablePortrait } from '../utils/creationProgress';
import {generationPolling} from '../utils/generationPolling';
import {
  getCreateCharacterMainPreviewAsset,
  getCreateCharacterOptionAsset,
  getCreateCharacterFantasySpeciesAsset,
  getCreateCharacterOptionLabel,
  getCreateCharacterOptionIds,
  normalizeCreateCharacterAssetUrl,
  normalizeCreateCharacterGender,
  type CreateCharacterOptionCategory,
} from '../data/createCharacterAssets';
import {
  getCreateArchetypeTranslationKey,
  CREATE_CHARACTER_PRESET_MESSAGES,
  getCreateCharacterPresets,
  getCreateTraitTranslationKey,
  getDefaultCreateCharacterPresetSelections,
  getRandomCreateCharacterAge,
  serializeCreateCharacterPresetSelections,
  shouldResetCreateCharacterPresetSelections,
  type CreateArchetypePreset,
  type CreateTraitPreset,
} from '../data/createCharacterPresets';
import { CREATE_FLOW_TRANSLATIONS } from '../data/createFlowTranslations';
import { getCreateCharacterVoices, getVoiceDisplayNameKey } from '../data/createCharacterVoices';
import { getDefaultCreateCharacterScenario, isDefaultCreateCharacterScenario } from '../data/createCharacterScenarios';
import { isNameTaken, isTransientNameCheckFailure } from '../utils/nameAvailability';
import {
  buildCreateCharacterImagePromptDocument,
  getCreateCharacterShowcaseTags,
  localizeCreateFlowError,
  localizeCreateFlowErrorCode,
} from '../utils/createCharacterLocalization';

registerLocaleMessages(CREATE_CHARACTER_PRESET_MESSAGES);
registerLocaleMessages(CREATE_FLOW_TRANSLATIONS);

interface CreateCharacterModalProps {
  isOpen: boolean;
  presentation?: 'dialog' | 'page' | 'workspace';
  flowMode?: 'standard' | 'generatedImagePrototype';
  generatedImageSource?: {
    mediaId: string;
    jobId: string;
    url: string;
    prompt: string;
  };
  generatedImageDraft?: GeneratedImageDraft | null;
  generatedImageDraftLoading?: boolean;
  generatedImageDraftError?: string | null;
  onRetryGeneratedImageDraft?: () => void;
  onClose: () => void;
  onCreateCharacter: (newChar: Character) => void;
  onOpenUpgradeModal?: () => void;
  onOpenRechargeModal?: () => void;
  onOpenQuickUpgradeModal?: (notice?: string, featureLabel?: string) => void;
  membershipFeatureKeys?: string[];
  walletBalance?: number;
  onSelectCharacterToChat?: (char: Character) => void;
  onOpenCharacterDetail?: (char: Character) => void;
  onRequireAuth?: () => void;
  wizardNickname?: { nickname: string; locale: string } | null;
  nicknameLoading?: boolean;
  nicknameError?: string | null;
  onRetryNickname?: () => void;
  onConsumeNickname?: () => void;
  onStartNextCharacter?: () => void;
}

const COMPACT_IMAGE_OPTION_GRID = 'mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
const DIALOG_IMAGE_OPTION_GRID = 'mx-auto grid w-full grid-cols-3 gap-3 lg:grid-cols-4 xl:grid-cols-5';
const EYE_IMAGE_OPTION_GRID = 'mx-auto grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';
const PROMPT_SEGMENT_CLASSES = {
  plain: 'text-zinc-300',
  identity: 'font-semibold text-pink-300',
  lineage: 'font-semibold text-violet-300',
  appearance: 'font-semibold text-amber-300',
  body: 'font-semibold text-cyan-300',
  profile: 'font-semibold text-emerald-300',
  story: 'font-semibold text-rose-300',
} as const;

const AssetPreview: React.FC<{
  asset: { src: string; srcSet?: string; video?: string };
  alt: string;
  className?: string;
  showBackdrop?: boolean;
  mediaKey?: React.Key;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({
  asset,
  alt,
  className = 'h-full w-full object-contain object-center',
  showBackdrop = true,
  mediaKey,
  priority = false,
  onLoad,
  onError,
}) => {
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  useEffect(() => {
    setPlaying(false);
    setVideoFailed(false);
    setImageFailed(false);
    setRetryNonce(0);
  }, [asset.src, asset.video]);
  const showVideo = Boolean(asset.video && playing && !videoFailed);
  const imageSrc = normalizeCreateCharacterAssetUrl(imageFailed ? '/create-character/portrait-placeholder.jpg' : asset.src);
  const videoSrc = asset.video ? normalizeCreateCharacterAssetUrl(asset.video) : undefined;
  const retry = () => {
    setImageFailed(false);
    setVideoFailed(false);
    setPlaying(false);
    setRetryNonce((value) => value + 1);
  };
  return (
    <div
      className="relative isolate h-full w-full overflow-hidden bg-[#101018]"
      onMouseEnter={() => asset.video && setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
      onFocus={() => asset.video && setPlaying(true)}
      onBlur={() => setPlaying(false)}
      onClick={() => asset.video && setPlaying(true)}
      tabIndex={asset.video ? 0 : -1}
    >
      {showBackdrop && (
        <>
          <img
            src={imageSrc}
            srcSet={imageFailed ? undefined : asset.srcSet}
            sizes="(max-width: 640px) 50vw, 384px"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl saturate-75"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
          <span className="pointer-events-none absolute inset-0 bg-[#090910]/30" aria-hidden="true" />
        </>
      )}
      {showVideo ? (
        <video
          key={`${String(mediaKey)}-${retryNonce}`}
          src={videoSrc}
          poster={imageSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className={`relative z-10 ${className}`}
          aria-label={alt}
          onLoadedData={onLoad}
          onError={() => {
            setVideoFailed(true);
            onError?.();
          }}
        />
      ) : (
        <img
          key={`${String(mediaKey)}-${retryNonce}`}
          src={imageSrc}
          srcSet={imageFailed ? undefined : asset.srcSet}
          sizes={priority ? '(max-width: 640px) 100vw, 768px' : '(max-width: 640px) 50vw, 384px'}
          alt={alt}
          className={`relative z-10 ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          onError={() => {
            if (!imageFailed) setImageFailed(true);
            onError?.();
          }}
        />
      )}
      {(imageFailed || videoFailed) && (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white shadow-lg"
          aria-label="Reload preview"
          title="Reload preview"
          onClick={(event) => {
            event.stopPropagation();
            retry();
          }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

const ImageChoiceOverlay: React.FC<{
  label: string;
  badge?: string;
  description?: string;
  swatch?: string;
}> = ({ label, badge, description, swatch }) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
      <div className="min-w-0 max-w-[calc(100%-1rem)] rounded-lg border border-white/10 bg-[#15131f]/72 px-2.5 py-1.5 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.95)] backdrop-blur-sm">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-black text-zinc-50 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
          {swatch && <span className="h-3 w-3 shrink-0 rounded-full border border-white/60" style={{ background: swatch }} aria-hidden="true" />}
          <span className="truncate">{label}</span>
        </span>
        {badge && <span className="mt-0.5 block truncate text-[9px] font-bold text-pink-200">{badge}</span>}
        {description && <span className="mt-0.5 block line-clamp-2 text-[9px] leading-tight text-zinc-300">{description}</span>}
      </div>
  </div>
);

// ================= CONSTANTS & RICH ADULT PRESETS =================

// Human Ethnicities & Fantasy Species
const HUMAN_RACES = [
  { id: 'east_asian', name: '东方 / 亚洲绝色', icon: '🌏', desc: '黑发茶瞳，皮肤细腻紧致，古典东方韵味与清纯诱惑', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'caucasian', name: '欧美 / 极致立体', icon: '🏛️', desc: '金发碧眼，高鼻深目，深邃性感与狂野气场', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
  { id: 'latina', name: '拉丁 / 热情热辣', icon: '💃', desc: '小麦蜜糖肤色，极致腰臀比，热情似火奔放拉满', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'black', name: '黑人 / 巧克力黑曜美姬', icon: '👑', desc: '深棕黑曜缎面肤色，极致挺拔身材与爆棚野性诱惑', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80' },
  { id: 'middle_eastern', name: '中东 / 阿拉伯异域', icon: '🕌', desc: '浓密睫毛与神秘眼神，薄纱微露下的绝美禁忌感', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'south_asian', name: '南亚 / 异域古铜蜜姬', icon: '🥻', desc: '高光古铜肌，温润丰满与独特神秘魅力', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80' },
];

const FANTASY_SPECIES = [
  { id: 'succubus', name: '😈 魅魔 (Succubus)', desc: '心形桃尾与小恶魔角，专为索求与吸取精气而生的绝美妖精', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'elf', name: '🧝‍♀️ 纯洁/堕落精灵', desc: '尖耳修长修身，空灵高贵，被征服堕落后的极致反差', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'beastkin', name: '🐾 狐仙 / 猫娘兽人', desc: '敏感兽耳与摇摆毛尾，受刺激时身心战栗娇喘着求欢', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { id: 'vampire', name: '🦇 吮血吸血鬼贵族', desc: '苍白冷皮与红宝石血瞳，渴望鲜血与深夜支配咬痕', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
  { id: 'angel', name: '👼 堕天圣天使', desc: '洁白羽翼与光环，神圣不可侵犯下的羞耻破防堕落', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80' },
  { id: 'slime_tentacle', name: '🐙 触手/史莱姆异种姬', desc: '充满黏液与触手缠绕，无死角深入包裹身体的奇幻刺激', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
];

// PHOTO-BASED VISUAL FEATURE PRESETS
const SKIN_TONES = [
  { id: 'porcelain', label: '冷白皮 / 珍珠纯白', tag: '透亮粉白', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'peach', label: '蜜桃粉白 / 微醺泛红', tag: '娇嫩欲滴', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'olive_tan', label: '小麦色 / 健康蜜糖光泽', tag: '油亮野性', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'ebony_black', label: '巧克力黑曜皮 / 爆棚野性', tag: '黑曜性感', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80' },
  { id: 'anime_white', label: '二次元发光冷白', tag: '二次元动漫', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
];

const EYE_COLORS = [
  { id: 'ruby', label: '发情魅惑红瞳', color: '#ef4444', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'sapphire', label: '深邃宝石蓝瞳', color: '#3b82f6', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80' },
  { id: 'amethyst', label: '妖娆魅惑紫瞳', color: '#a855f7', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'amber', label: '琥珀兽性金瞳', color: '#f59e0b', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
  { id: 'emerald', label: '翡翠清澈绿瞳', color: '#10b981', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80' },
  { id: 'heterochromia', label: '异色双瞳 (左红右蓝)', color: 'gradient', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80' },
];

const FACE_SHAPES = [
  { id: 'v_line', label: '精致瓜子脸 (V-Line)', desc: '下巴高挺流畅，精致度满格的顶配脸型', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'oval', label: '经典古典鹅蛋脸', desc: '线条柔和典雅，充满治愈与人妻亲和力', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'chubby', label: '胶原蛋白婴儿肥', desc: '嘟嘟脸萌态十足，受欺负捏脸时娇羞可人', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'sculpted', label: '欧美超模立体高颧骨', desc: '立体重立体高颧骨，女王霸气征服气场', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
];

const HAIRSTYLES = [
  { id: 'waves', label: '风情大波浪卷发', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'bob', label: '干练性感 Bob 短发', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
  { id: 'twin_tails', label: '二次元双马尾 (抓把手)', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { id: 'hime_cut', label: '姬发式黑长直人妻切', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'wolf_cut', label: '野性狼尾碎发', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'afro', label: '爆炸头', img: '' },
  { id: 'buzz_cut', label: '寸头', img: '' },
  { id: 'mohawk', label: '短莫霍克', img: '' },
  { id: 'slick_back', label: '复古背头', img: '' },
  { id: 'classic_bob', label: '复古波波头', img: '' },
  { id: 'bangs', label: '齐刘海', img: '' },
  { id: 'high_ponytail', label: '青春高马尾', img: '' },
  { id: 'half_up', label: '随性半扎发', img: '' },
  { id: 'wool_curls', label: '可爱羊毛卷', img: '' },
];

const FANTASY_SPECIES_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  human: CircleUserRound,
  succubus: Flame,
  elf: Sparkle,
  beastkin: PawPrint,
  vampire: MoonStar,
  angel: Feather,
  slime_tentacle: Droplets,
};

const visibleHairstyles = (gender: GenderType) => {
  const ids = getCreateCharacterOptionIds(normalizeCreateCharacterGender(gender), 'hair');
  return HAIRSTYLES.filter((item) => ids.includes(item.id as typeof ids[number]));
};

const HAIR_COLORS = [
  { id: 'black', label: '乌黑发亮漆黑发', color: '#18181b' },
  { id: 'silver', label: '空灵发光银白发', color: '#e4e4e7' },
  { id: 'blonde', label: '闪耀耀眼金发', color: '#facc15' },
  { id: 'pink', label: '魅惑发情樱花粉', color: '#f472b6' },
  { id: 'purple', label: '夜店风情紫罗兰', color: '#c084fc' },
  { id: 'brown', label: '温柔栗棕长发', color: '#a16207' },
];

const BODY_BUILDS = [
  { id: 'curvy', label: '丰满肉感 S 曲线 (Curvy)', badge: 'S级极致腰臀', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'slim', label: '纤细苗条 骨感轻盈 (Slim/Petite)', badge: '易抱易推倒', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'athletic', label: '健美紧致 蜜桃腰腹 (Fit/Muscular)', badge: '马甲线拉满', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'tall_model', label: '高挑九头身 欧美大长腿', badge: '九头身大长腿', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
];

const CHEST_SIZES = [
  { id: 'flat', label: '秀气平胸 (A-Cup)', badge: '娇小可人', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { id: 'natural', label: '匀称挺拔 (B-Cup / C-Cup)', badge: '自然坚挺', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'full', label: '傲人深沟 (D-Cup / E-Cup)', badge: '存在感爆发', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'voluptuous', label: '爆乳巨乳 (G-Cup / H-Cup+)', badge: '极致沉重震撼', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
];

const HIP_SIZES = [
  { id: 'compact', label: '紧致挺拔翘臀', badge: '弹性爆发', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80' },
  { id: 'peach', label: '性感饱满蜜桃臀', badge: '撞击声响清脆', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80' },
  { id: 'hourglass', label: '极致沙漏大观臀', badge: '腰臀比炸裂', img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80' },
];

const MOBILE_HIP_RATIO_GUIDES: Record<string, { waist: string; hip: string }> = {
  compact: { waist: '48%', hip: '72%' },
  peach: { waist: '58%', hip: '92%' },
  hourglass: { waist: '38%', hip: '96%' },
};

const MOBILE_BODY_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  en: { curvy: 'Curvy S-shape', slim: 'Slim petite', athletic: 'Fit and athletic', tall_model: 'Soft plus-size' },
  'zh-CN': { curvy: '丰满肉感 S 曲线', slim: '纤细苗条', athletic: '健美紧致', tall_model: '丰满柔软体型' },
  ja: { curvy: '豊かなSライン', slim: 'スリム体型', athletic: '引き締まった体型', tall_model: '柔らかなプラスサイズ' },
  ko: { curvy: '풍만한 S라인', slim: '슬림 체형', athletic: '탄탄한 체형', tall_model: '포근한 플러스 사이즈' },
  es: { curvy: 'Curvas en S', slim: 'Delgado y pequeño', athletic: 'Atlético y tonificado', tall_model: 'Curvas suaves de talla grande' },
  pt: { curvy: 'Curvas em S', slim: 'Magro e delicado', athletic: 'Atlético e definido', tall_model: 'Curvas suaves de tamanho grande' },
};

const MOBILE_BODY_BADGE_OVERRIDES: Record<string, Record<string, string>> = {
  en: { curvy: 'Defined waist', slim: 'Light and petite', athletic: 'Toned core', tall_model: 'Soft full-body curve' },
  'zh-CN': { curvy: '腰臀更饱满', slim: '线条轻盈', athletic: '腰腹紧致', tall_model: '丰满柔软' },
  ja: { curvy: 'くびれのあるライン', slim: '軽やかな細身', athletic: '引き締まった体幹', tall_model: '柔らかなボディライン' },
  ko: { curvy: '선명한 S라인', slim: '가볍고 슬림한 체형', athletic: '탄탄한 코어', tall_model: '부드러운 플러스 사이즈' },
  es: { curvy: 'Cintura definida', slim: 'Ligero y pequeño', athletic: 'Abdomen tonificado', tall_model: 'Curvas suaves' },
  pt: { curvy: 'Cintura definida', slim: 'Leve e delicado', athletic: 'Abdômen definido', tall_model: 'Curvas suaves' },
};

const MOBILE_HIP_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  en: { compact: 'Tight rounded hips', peach: 'Full peach hips', hourglass: 'Wide hourglass hips' },
  'zh-CN': { compact: '紧致圆润臀', peach: '饱满蜜桃臀', hourglass: '宽胯沙漏臀' },
  ja: { compact: '引き締まった丸みヒップ', peach: '豊かなピーチヒップ', hourglass: '幅広い砂時計ヒップ' },
  ko: { compact: '탄탄한 둥근 힙', peach: '풍만한 피치 힙', hourglass: '넓은 모래시계 힙' },
  es: { compact: 'Caderas firmes y redondeadas', peach: 'Caderas de melocotón', hourglass: 'Caderas en reloj de arena' },
  pt: { compact: 'Quadris firmes e arredondados', peach: 'Quadris em formato pêssego', hourglass: 'Quadris em ampulheta' },
};

const MOBILE_HIP_BADGE_OVERRIDES: Record<string, Record<string, string>> = {
  en: { compact: 'Tight contour', peach: 'Full hip peak', hourglass: 'Stronger waist-to-hip curve' },
  'zh-CN': { compact: '线条收紧', peach: '臀峰饱满', hourglass: '腰臀差更明显' },
  ja: { compact: '引き締まったライン', peach: '豊かなヒップトップ', hourglass: '腰とヒップの差が明確' },
  ko: { compact: '탄탄한 라인', peach: '풍만한 힙 볼륨', hourglass: '뚜렷한 허리-힙 대비' },
  es: { compact: 'Contorno firme', peach: 'Volumen marcado', hourglass: 'Mayor contraste cintura-cadera' },
  pt: { compact: 'Contorno firme', peach: 'Volume marcado', hourglass: 'Maior contraste cintura-quadril' },
};

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  presentation = 'dialog',
  flowMode = 'standard',
  generatedImageSource,
  generatedImageDraft = null,
  generatedImageDraftLoading = false,
  generatedImageDraftError = null,
  onRetryGeneratedImageDraft,
  onClose,
  onCreateCharacter,
  onOpenUpgradeModal,
  onOpenRechargeModal,
  onOpenQuickUpgradeModal,
  membershipFeatureKeys = [],
  walletBalance,
  onSelectCharacterToChat,
  onOpenCharacterDetail,
  onRequireAuth,
  wizardNickname,
  nicknameLoading = false,
  nicknameError = null,
  onRetryNickname,
  onConsumeNickname,
  onStartNextCharacter,
}) => {
  const { locale, t } = useLocale();
  const isPage = presentation === 'page';
  const isWorkspace = presentation === 'workspace';
  const isEmbedded = isPage || isWorkspace;
  const isGeneratedImagePrototype = flowMode === 'generatedImagePrototype' && Boolean(generatedImageSource);
  const localizePreset = (group: string, id: string, field: string, fallback: string) => {
    const key = `create.preset.${group}.${id}.${field}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return locale === 'zh-CN' ? fallback : `${t('create.presetFallback')} · ${id.replace(/[-_]/g, ' ')}`;
  };
  const localizeCanonicalPreset = (key: string, fallback: string) => {
    const translated = t(key);
    return translated !== key ? translated : fallback;
  };
  const localizeTrait = (preset: CreateTraitPreset) =>
    localizeCanonicalPreset(getCreateTraitTranslationKey(preset), preset.canonical);
  const localizeArchetype = (preset: CreateArchetypePreset, field: 'name' | 'desc') =>
    localizeCanonicalPreset(
      getCreateArchetypeTranslationKey(preset, field),
      field === 'name' ? preset.canonical : preset.description,
    );

  // Step Navigation State (Steps 1 ~ 6)
  const [currentStep, setCurrentStep] = useState<number>(isGeneratedImagePrototype ? 4 : 1);
  const [mobileQuestionIndex, setMobileQuestionIndex] = useState(0);

  // Completion Success Showcase state
  const [createdCharacter, setCreatedCharacter] = useState<Character | null>(null);

  // Step 1: Art Style & Gender
  const [artStyle, setArtStyle] = useState<ArtStyleType>('anime');
  const [gender, setGender] = useState<GenderType>('female');

  // Step 2: Race & Species
  const [selectedRace, setSelectedRace] = useState<string>('caucasian');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('human');

  // Step 3: Visual Appearance Details (No forced live preview previewing, pure details selection with rich photo cards)
  const [appearanceSubTab, setAppearanceSubTab] = useState<'skin' | 'chest' | 'hip' | 'body' | 'face' | 'hair' | 'eye'>('skin');
  const [skinTone, setSkinTone] = useState<string>('porcelain');
  const [eyeColor, setEyeColor] = useState<string>('ruby');
  const [faceShape, setFaceShape] = useState<string>('v_line');
  const [hairstyle, setHairstyle] = useState<string>('waves');
  const [hairColor, setHairColor] = useState<string>('black');
  const [bodyBuild, setBodyBuild] = useState<string>('curvy');
  const [chestSize, setChestSize] = useState<string>('flat');
  const [hipSize, setHipSize] = useState<string>('compact');

  // Modal to enlarge photo preview option
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Step 4: New character tags, age, roles, and play preferences
  const [age, setAge] = useState<number>(() => getRandomCreateCharacterAge());
  const initialPresetSelections = getDefaultCreateCharacterPresetSelections('female');
  const [selectedAppearanceAndBody, setSelectedAppearanceAndBody] = useState<string[]>(initialPresetSelections.appearance_and_body);
  const [selectedSexualPersonality, setSelectedSexualPersonality] = useState<string[]>(initialPresetSelections.sexual_personality);
  const [selectedRoleAndFantasy, setSelectedRoleAndFantasy] = useState<string[]>(initialPresetSelections.role_and_fantasy);
  const [selectedKinksAndPlay, setSelectedKinksAndPlay] = useState<string[]>(initialPresetSelections.kinks_and_play);

  // Step 5: Adult Style Tags, Background Story & Scenarios
  const [selectedAdultStyle, setSelectedAdultStyle] = useState<string>(initialPresetSelections.adultStyle);
  const [name, setName] = useState<string>('');
  const nameEditedRef = useRef(false);
  const nameAvailabilityPromiseRef = useRef<{ key: string; promise: Promise<boolean> } | null>(null);
  const nicknameConsumptionRequestedRef = useRef(false);
  const [subtitle, setSubtitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const profileInputSnapshotRef = useRef({ subtitle: '', backgroundStory: '', firstMessage: '' });

  const [scenarios, setScenarios] = useState<InteractiveScenario[]>(() => [getDefaultCreateCharacterScenario(locale)]);

  // Step 6: Final Integrated AI Portrait Generation & Voice Tone Selection
  const [avatarUrl, setAvatarUrl] = useState<string>(generatedImageSource?.url || '');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceCatalog, setVoiceCatalog] = useState<ApiChatVoice[]>([]);
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceLoadNonce, setVoiceLoadNonce] = useState(0);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationPollNonce, setGenerationPollNonce] = useState(0);
  const [generationJob, setGenerationJob] = useState<ApiGenerationJob | null>(null);
  const [generationFailureStage, setGenerationFailureStage] = useState<'generation' | 'stCard' | null>(null);
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameCheckWarning, setNameCheckWarning] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const portraitJobRef = useRef<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [avatarReloadNonce, setAvatarReloadNonce] = useState(0);
  const [publicPublishLoading, setPublicPublishLoading] = useState(false);
  const [publicPublishError, setPublicPublishError] = useState<string | null>(null);
  const [prototypeCreating, setPrototypeCreating] = useState(false);
  const [prototypeComplete, setPrototypeComplete] = useState(false);
  const showcaseShownRef = useRef(false);
  const appliedGeneratedImageDraftRef = useRef<GeneratedImageDraft | null>(null);
  const delayedPollTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const wizardGenerateAbortRef = useRef<AbortController | null>(null);
  const generationRecoveryAtRef = useRef(0);
  const stRetryAtRef = useRef(0);
  const wizardContentRef = useRef<HTMLDivElement | null>(null);
  const wizardStepNavRefs = useRef<Array<HTMLLIElement | null>>([]);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const showPortraitProgress = isGeneratingImage;
  const portraitGenerationProgress = Math.max(4, Math.min(100, generationJob?.progress ?? 4));

  const withAvatarReloadNonce = (url: string) => {
    if (!avatarReloadNonce) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}reload=${avatarReloadNonce}`;
  };
  const normalizedGender = normalizeCreateCharacterGender(gender);
  const createVoices = useMemo(() => getCreateCharacterVoices(gender, voiceCatalog), [gender, voiceCatalog]);
  const localizedVoiceName = (voiceId: string | undefined, fallback = '') => {
    const displayNameKey = voiceId ? getVoiceDisplayNameKey(voiceId) : undefined;
    return displayNameKey ? t(displayNameKey) : fallback;
  };
  const stylePreviewMedia = {
    anime: getCreateCharacterMainPreviewAsset(normalizedGender, 'anime'),
    realistic: getCreateCharacterMainPreviewAsset(normalizedGender, 'realistic'),
  };
  const standardWizardSteps = [
    { step: 1, label: t('create.step1'), subtitle: t('create.step1Sub') },
    { step: 2, label: t('create.step2'), subtitle: t('create.step2Sub') },
    { step: 3, label: t('create.step3'), subtitle: t('create.step3Sub') },
    { step: 4, label: t('create.step4'), subtitle: t('create.step4Sub') },
    { step: 5, label: t('create.step5'), subtitle: t('create.step5Sub') },
    { step: 6, label: t('create.step6'), subtitle: t('create.step6Sub') },
  ];
  const prototypeWizardSteps = [
    { step: 4, label: t('create.fromImageTraits'), subtitle: t('create.step4Sub') },
    { step: 5, label: t('create.fromImageStory'), subtitle: t('create.step5Sub') },
    { step: 6, label: t('create.fromImageConfirm'), subtitle: t('create.fromImageConfirmHint') },
  ];
  const wizardSteps = isGeneratedImagePrototype ? prototypeWizardSteps : standardWizardSteps;
  const mobileQuestionsByStep: Record<number, string[]> = {
    1: [t('create.artStyle')],
    2: [t('create.race')],
    3: [t('create.skinTone'), t('create.chestSize'), t('create.hipSize'), t('create.bodyBuild'), t('create.faceShape'), t('create.hairStyle'), t('create.eyeColor')],
    4: [t('create.step4')],
    5: [t('create.archetypeHint'), t('create.name')],
    6: isGeneratedImagePrototype ? [t('create.fromImageCreate')] : [t('create.promptLabel'), t('create.generate')],
  };
  const mobileQuestionTitles = mobileQuestionsByStep[currentStep] || [];
  const mobileQuestionTitle = mobileQuestionTitles[mobileQuestionIndex] || wizardSteps.find((step) => step.step === currentStep)?.label || '';
  const mobileQuestionCount = mobileQuestionTitles.length;
  const firstWizardStep = isGeneratedImagePrototype ? 4 : 1;
  const isFirstWizardQuestion = currentStep === firstWizardStep && (!isPage || mobileQuestionIndex === 0);
  const isFinalWizardQuestion = currentStep === 6 && (!isPage || mobileQuestionIndex === mobileQuestionCount - 1);

  useEffect(() => {
    if (!isOpen || currentStep >= 5) return;
    const nextStep = currentStep + 1;
    const categories: CreateCharacterOptionCategory[] = nextStep === 2
      ? ['race']
      : nextStep === 3
        ? ['skin', 'face', 'hair', 'eye']
        : nextStep === 4
          ? ['body', 'chest', 'hip']
          : [];
    if (!categories.length) return;
    const urls = categories.flatMap((category) =>
      getCreateCharacterOptionIds(normalizeCreateCharacterGender(gender), category)
        .map((id) => getCreateCharacterOptionAsset(gender, artStyle, category, id).src),
    );
    const preload = () => urls.forEach((url) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = normalizeCreateCharacterAssetUrl(url);
    });
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: {timeout: number}) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const handle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(preload, {timeout: 1500})
      : window.setTimeout(preload, 500);
    return () => {
      if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [artStyle, currentStep, gender, isOpen]);
  const showMobileQuestion = (index: number) => !isPage || mobileQuestionIndex === index;
  const goToWizardStep = (step: number, questionIndex = 0) => {
    setCurrentStep(Math.min(6, Math.max(1, step)));
    setMobileQuestionIndex(Math.max(0, questionIndex));
  };
  const handlePreviousWizardQuestion = () => {
    if (isPage && mobileQuestionIndex > 0) {
      setMobileQuestionIndex((index) => index - 1);
      return;
    }
    if (currentStep <= firstWizardStep) return;
    const previousStep = currentStep - 1;
    goToWizardStep(previousStep, isPage ? mobileQuestionsByStep[previousStep].length - 1 : 0);
  };
  const handleNextWizardQuestion = () => {
    if (isPage && mobileQuestionIndex < mobileQuestionCount - 1) {
      setMobileQuestionIndex((index) => index + 1);
      return;
    }
    if (currentStep < 6) void navigateToStep(currentStep + 1);
  };
  const activePresets = getCreateCharacterPresets(gender);
  const selectedAppearanceAndBodyLabels = selectedAppearanceAndBody.map((id) => activePresets.appearance_and_body.find((preset) => preset.id === id)).filter((preset): preset is CreateTraitPreset => Boolean(preset)).map(localizeTrait);
  const selectedSexualPersonalityLabels = selectedSexualPersonality.map((id) => activePresets.sexual_personality.find((preset) => preset.id === id)).filter((preset): preset is CreateTraitPreset => Boolean(preset)).map(localizeTrait);
  const selectedRoleAndFantasyLabels = selectedRoleAndFantasy.map((id) => activePresets.role_and_fantasy.find((preset) => preset.id === id)).filter((preset): preset is CreateTraitPreset => Boolean(preset)).map(localizeTrait);
  const selectedKinksAndPlayLabels = selectedKinksAndPlay.map((id) => activePresets.kinks_and_play.find((preset) => preset.id === id)).filter((preset): preset is CreateTraitPreset => Boolean(preset)).map(localizeTrait);
  const selectedArchetype = activePresets.archetypes.find((preset) => preset.id === selectedAdultStyle);
  const characterTags = Array.from(new Set([...selectedAppearanceAndBodyLabels, ...selectedSexualPersonalityLabels, ...selectedRoleAndFantasyLabels, ...selectedKinksAndPlayLabels, ...(selectedArchetype ? [localizeArchetype(selectedArchetype, 'name')] : [])]));
  const showcaseTags = useMemo(() => getCreateCharacterShowcaseTags({
    locale,
    gender: createdCharacter?.gender || gender,
    artStyle: createdCharacter?.artStyle || artStyle,
    race: selectedRace,
    species: selectedSpecies,
    chest: chestSize,
    hip: hipSize,
    creationSelections: createdCharacter?.creationSelections,
    rawTags: createdCharacter?.rawTags || createdCharacter?.tags,
  }, t, characterTags), [artStyle, characterTags, chestSize, createdCharacter, gender, hipSize, locale, selectedRace, selectedSpecies, t]);
  const visualAsset = (category: CreateCharacterOptionCategory, id: string) => {
    return getCreateCharacterOptionAsset(gender, artStyle, category, id);
  };
  const visualLabel = (category: CreateCharacterOptionCategory, id: string) => {
    if (isPage && category === 'body') return MOBILE_BODY_LABEL_OVERRIDES[locale]?.[id] || getCreateCharacterOptionLabel(locale, gender, category, id);
    if (isPage && category === 'hip') return MOBILE_HIP_LABEL_OVERRIDES[locale]?.[id] || getCreateCharacterOptionLabel(locale, gender, category, id);
    return getCreateCharacterOptionLabel(locale, gender, category, id);
  };
  const visualBadge = (category: CreateCharacterOptionCategory, id: string, fallback: string) => {
    if (isPage && category === 'body') return MOBILE_BODY_BADGE_OVERRIDES[locale]?.[id] || fallback;
    if (isPage && category === 'hip') return MOBILE_HIP_BADGE_OVERRIDES[locale]?.[id] || fallback;
    return localizePreset(category, id, 'badge', fallback);
  };
  const automaticImagePrompt = useMemo(() => buildCreateCharacterImagePromptDocument(locale, t, {
    artStyle,
    gender,
    name,
    age,
    race: selectedRace,
    species: selectedSpecies,
    skin: skinTone,
    eye: eyeColor,
    face: faceShape,
    hair: hairstyle,
    hairColor,
    body: bodyBuild,
    chest: chestSize,
    hip: hipSize,
    appearance_and_body: selectedAppearanceAndBodyLabels,
    sexual_personality: selectedSexualPersonalityLabels,
    role_and_fantasy: selectedRoleAndFantasyLabels,
    kinks_and_play: selectedKinksAndPlayLabels,
    archetype: selectedArchetype ? localizeArchetype(selectedArchetype, 'name') : '',
  }), [age, artStyle, bodyBuild, chestSize, eyeColor, faceShape, gender, hairColor, hairstyle, hipSize, locale, name, selectedAdultStyle, selectedAppearanceAndBody, selectedKinksAndPlay, selectedRoleAndFantasy, selectedSexualPersonality, selectedRace, selectedSpecies, skinTone, t]);
  useEffect(() => {
    if (!isOpen || createdCharacter || nameEditedRef.current || !wizardNickname?.nickname) return;
    setName(wizardNickname.nickname);
    setNameError(null);
  }, [createdCharacter, isOpen, wizardNickname?.locale, wizardNickname?.nickname]);
  useEffect(() => {
    if (!isOpen || isEmbedded) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [isEmbedded, isOpen]);

  useEffect(() => {
    if (wizardContentRef.current) wizardContentRef.current.scrollTop = 0;
  }, [currentStep, mobileQuestionIndex]);

  useEffect(() => {
    if (isGeneratedImagePrototype || isPromptManuallyEdited) return;
    setImagePrompt(automaticImagePrompt.text);
  }, [automaticImagePrompt.text, isGeneratedImagePrototype, isPromptManuallyEdited]);

  useEffect(() => {
    setScenarios((current) => current.map((scenario) =>
      isDefaultCreateCharacterScenario(scenario) ? getDefaultCreateCharacterScenario(locale) : scenario,
    ));
  }, [locale]);

  useEffect(() => {
    const questionCount = mobileQuestionsByStep[currentStep]?.length || 1;
    if (mobileQuestionIndex >= questionCount) setMobileQuestionIndex(0);
  }, [currentStep, mobileQuestionIndex]);

  useEffect(() => {
    if (!isOpen || createdCharacter || !window.matchMedia('(max-width: 1023px)').matches) return;
    const activeStepIndex = wizardSteps.findIndex((step) => step.step === currentStep);
    wizardStepNavRefs.current[activeStepIndex]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  }, [createdCharacter, currentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    stopVoiceSample();
    setVoiceCatalog([]);
    setSelectedVoice('');
    setVoiceLoading(true);
    setVoiceError(null);
    void api.createdCharacters.voices(normalizedGender, locale)
      .then(({ voices }) => {
        if (!active) return;
        setVoiceCatalog(voices);
      })
      .catch((reason) => {
        if (!active) return;
        if (reason instanceof ApiError && reason.status === 401) {
          onClose();
          onRequireAuth?.();
          return;
        }
        setVoiceCatalog([]);
        setSelectedVoice('');
        setVoiceError(localizeCreateFlowError(reason, t, 'create.voiceCatalogError'));
      })
      .finally(() => { if (active) setVoiceLoading(false); });
    return () => { active = false; };
  }, [isOpen, locale, membershipFeatureKeys, normalizedGender, voiceLoadNonce]);

  useEffect(() => {
    const firstVoiceId = createVoices[0]?.voiceId || '';
    setSelectedVoice((previous) => createVoices.some((voice) => voice.voiceId === previous) ? previous : firstVoiceId);
  }, [createVoices]);

  useEffect(() => {
    if (!isOpen || !isGeneratedImagePrototype || !generatedImageDraft || appliedGeneratedImageDraftRef.current === generatedImageDraft) return;
    appliedGeneratedImageDraftRef.current = generatedImageDraft;
    setName(generatedImageDraft.name);
    setSubtitle(generatedImageDraft.subtitle);
    setDescription(generatedImageDraft.backgroundStory);
    setGreeting(generatedImageDraft.firstMessage);
    setSystemInstruction(generatedImageDraft.systemPrompt);
    setNameError(null);
  }, [generatedImageDraft, isGeneratedImagePrototype, isOpen]);

  const showCreatedCharacter = (character: Character) => {
    const shouldNotifyParent = !showcaseShownRef.current;
    showcaseShownRef.current = true;
    setCreatedCharacter(character);
    setGenerationFailureStage(null);
    setGenerationError(null);
    setIsGeneratingImage(false);
    setGenerationJobId(null);
    setPublicPublishError(null);
    setPublicPublishLoading(false);
    if (shouldNotifyParent) onCreateCharacter(character);
  };

  const handlePublishCreatedCharacter = async () => {
    if (!createdCharacterId || !createdCharacter || publicPublishLoading) return;
    if (createdCharacter.publicStatus === 'pending' || createdCharacter.publicStatus === 'approved') return;
    if (!membershipFeatureKeys.includes('publishCharacters')) {
      if (onOpenQuickUpgradeModal) onOpenQuickUpgradeModal(t('create.publishMembershipRequired'), t('upgrade.feature.publishCharacters'));
      else onOpenUpgradeModal?.();
      return;
    }
    if (walletBalance !== undefined && walletBalance < 20) {
      onOpenRechargeModal?.();
      return;
    }
    setPublicPublishLoading(true);
    setPublicPublishError(null);
    const reconcilePublicState = async () => {
      try {
        const current = await api.createdCharacters.get(createdCharacterId);
        if (current.publicStatus === 'pending' || current.publicStatus === 'approved') {
          setCreatedCharacter(current);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };
    try {
      const published = await api.createdCharacters.publish(createdCharacterId);
      setCreatedCharacter(published);
      if (published.publicStatus !== 'pending' && published.publicStatus !== 'approved') {
        await reconcilePublicState();
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        onClose();
        onRequireAuth?.();
        return;
      }
      if (reason instanceof ApiError && reason.code === 'MEMBERSHIP_REQUIRED') {
        onOpenQuickUpgradeModal?.(t('create.publishMembershipRequired'), t('upgrade.feature.publishCharacters'));
        if (!onOpenQuickUpgradeModal) onOpenUpgradeModal?.();
        return;
      }
      if (reason instanceof ApiError && reason.code === 'INSUFFICIENT_DIAMONDS') {
        onOpenRechargeModal?.();
        return;
      }
      if (await reconcilePublicState()) return;
      setPublicPublishError(t('create.publishError'));
    } finally {
      setPublicPublishLoading(false);
    }
  };

  useEffect(() => {
    if (isGeneratedImagePrototype || !generationJobId || !createdCharacterId) return;
    let active = true;
    const unsubscribe = generationPolling.subscribe(
      [generationJobId],
      (job) => {
        void (async () => {
        if (!active) return;
        setGenerationJob(job);

        const portrait = readablePortrait(job);
        if (portrait && portraitJobRef.current !== job.id) {
          portraitJobRef.current = job.id;
          setAvatarUrl(portrait.url);
          setHasGeneratedImage(true);
          setAvatarLoadFailed(false);
        }

        if (job.status === 'complete' && job.designProfileStatus === 'complete' && portrait) {
          const completed = await api.createdCharacters.get(createdCharacterId);
          if (!active) return;
          setAvatarUrl(completed.avatar || portrait.url);
          setHasGeneratedImage(true);
          showCreatedCharacter(completed);
          return;
        }
        if (job.status === 'failed' || job.status === 'canceled') {
          if (job.failureCode === 'INSUFFICIENT_CREDITS') {
            setIsGeneratingImage(false);
            setGenerationFailureStage('generation');
            setGenerationError(localizeCreateFlowErrorCode(job.failureCode, t, 'create.generationError'));
            return;
          }
          if (Date.now() >= generationRecoveryAtRef.current) {
            generationRecoveryAtRef.current = Date.now() + 3000;
            try {
              const retried = await api.generation.jobs.retry(job.id);
              if (!active) return;
              setGenerationJob(retried);
              setGenerationJobId(retried.id);
              setGenerationPollNonce((value) => value + 1);
              return;
            } catch (reason) {
              if (reason instanceof ApiError && reason.status === 401) {
                onClose();
                onRequireAuth?.();
                return;
              }
            }
          }
        }
        })();
      },
      () => {
        if (!active) return;
        setIsGeneratingImage(false);
        setGenerationFailureStage('generation');
        setGenerationError(localizeCreateFlowErrorCode('GENERATION_NOT_FOUND', t, 'create.generationError'));
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [generationJobId, createdCharacterId, generationPollNonce, isGeneratedImagePrototype, onCreateCharacter]);

  useEffect(() => {
    if (!isOpen || isGeneratedImagePrototype || !createdCharacterId || !createdCharacter || createdCharacter.stCard?.status === 'complete') return;
    let active = true;
    let timer: number | undefined;
    const pollStCard = async () => {
      try {
        const character = await api.createdCharacters.get(createdCharacterId);
        if (!active) return;
        setCreatedCharacter(character);
        if (character.stCard?.status === 'complete') return;
        if (Date.now() >= stRetryAtRef.current) {
          stRetryAtRef.current = Date.now() + 5000;
          try {
            await api.createdCharacters.retryStCard(createdCharacterId);
          } catch (reason) {
            if (reason instanceof ApiError && reason.status === 401) {
              onClose();
              onRequireAuth?.();
              return;
            }
          }
        }
        timer = window.setTimeout(() => { void pollStCard(); }, 1500);
      } catch (reason) {
        if (!active) return;
        if (reason instanceof ApiError && reason.status === 401) {
          onClose();
          onRequireAuth?.();
          return;
        }
        timer = window.setTimeout(() => { void pollStCard(); }, 3000);
      }
    };
    void pollStCard();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [createdCharacter?.stCard?.status, createdCharacterId, generationPollNonce, isGeneratedImagePrototype, isOpen, onClose, onRequireAuth]);

  useEffect(() => {
    if (!isOpen || !isGeneratedImagePrototype || !createdCharacterId || prototypeComplete) return;
    let active = true;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const character = await api.createdCharacters.get(createdCharacterId);
        if (!active) return;
        setCreatedCharacter(character);
        const status = character.stCard?.status;
        if (status === 'complete') {
          setPrototypeComplete(true);
          setPrototypeCreating(false);
          onCreateCharacter(character);
          if (onOpenCharacterDetail) onOpenCharacterDetail(character);
          return;
        }
        if (status === 'failed') {
          setPrototypeCreating(false);
          setGenerationError(localizeCreateFlowErrorCode(character.stCard?.errorCode, t, 'create.fromImageCreateError'));
          return;
        }
        timer = window.setTimeout(() => { void poll(); }, 1500);
      } catch (reason) {
        if (!active) return;
        setPrototypeCreating(false);
        setGenerationError(localizeCreateFlowError(reason, t, 'create.fromImageCreateError'));
      }
    };
    void poll();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [createdCharacterId, generationPollNonce, isGeneratedImagePrototype, isOpen, onCreateCharacter, onOpenCharacterDetail, prototypeComplete, t]);

  const stopVoiceSample = () => {
    const player = voiceAudioRef.current;
    if (player) {
      player.pause();
      player.currentTime = 0;
      voiceAudioRef.current = null;
    }
    setPlayingVoiceId(null);
  };

  const hasVoiceAccess = (voice: ApiChatVoice) => (
    voice.isFree === true
    || !voice.requiredMembershipFeature
    || membershipFeatureKeys.includes(voice.requiredMembershipFeature)
  );

  const openVoiceMembership = (voice: ApiChatVoice) => {
    const notice = t('panel.voiceMembershipRequired');
    const featureLabel = `${t('panel.premiumVoice')}: ${localizedVoiceName(voice.voiceId, voice.name)}`;
    if (onOpenQuickUpgradeModal) onOpenQuickUpgradeModal(notice, featureLabel);
    else onOpenUpgradeModal?.();
  };

  const handleSelectVoice = (voice: ApiChatVoice) => {
    if (!hasVoiceAccess(voice)) {
      openVoiceMembership(voice);
      return;
    }
    setSelectedVoice(voice.voiceId);
  };

  const handlePlayVoiceSample = (voice: ApiChatVoice) => {
    if (!hasVoiceAccess(voice)) {
      openVoiceMembership(voice);
      return;
    }
    if (!voice.previewUrl) return;
    if (playingVoiceId === voice.voiceId) {
      stopVoiceSample();
      return;
    }

    stopVoiceSample();
    const player = new Audio(voice.previewUrl);
    player.preload = 'auto';
    voiceAudioRef.current = player;
    setPlayingVoiceId(voice.voiceId);
    const finish = () => {
      if (voiceAudioRef.current !== player) return;
      voiceAudioRef.current = null;
      setPlayingVoiceId(null);
    };
    player.onended = finish;
    player.onerror = finish;
    void player.play().catch(finish);
  };

  useEffect(() => {
    if (isOpen) return;
    wizardGenerateAbortRef.current?.abort();
    wizardGenerateAbortRef.current = null;
    stopVoiceSample();
  }, [isOpen]);

  useEffect(() => () => {
    wizardGenerateAbortRef.current?.abort();
    voiceAudioRef.current?.pause();
    voiceAudioRef.current = null;
    if (delayedPollTimerRef.current) window.clearTimeout(delayedPollTimerRef.current);
  }, []);

  const handleGenderChange = (nextGender: GenderType) => {
    const shouldResetPresets = shouldResetCreateCharacterPresetSelections(gender, nextGender);
    stopVoiceSample();
    setGender(nextGender);
    setSelectedVoice('');
    if (!shouldResetPresets || isGeneratedImagePrototype) return;
    const defaults = getDefaultCreateCharacterPresetSelections(nextGender);
    setSelectedAppearanceAndBody(defaults.appearance_and_body);
    setSelectedSexualPersonality(defaults.sexual_personality);
    setSelectedRoleAndFantasy(defaults.role_and_fantasy);
    setSelectedKinksAndPlay(defaults.kinks_and_play);
    setSelectedAdultStyle(defaults.adultStyle);
  };

  const handleRaceSelection = (raceId: string) => {
    setSelectedRace(raceId);
    setSelectedSpecies('human');
  };

  const handleSpeciesSelection = (speciesId: string) => {
    setSelectedRace('');
    setSelectedSpecies(speciesId);
  };

  if (!isOpen) return null;

  // Toggle trait helper
  const toggleTrait = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Rebuild the image prompt from the current selections in Steps 1 to 5.
  const handleBuildPromptFromSelections = () => {
    setIsPromptManuallyEdited(false);
    setImagePrompt(automaticImagePrompt.text);
  };

  const wizardSelections = () => ({
    artStyle,
    gender,
    race: selectedRace,
    species: selectedSpecies,
    skinTone,
    eyeColor,
    faceShape,
    hairstyle,
    hairColor,
    bodyBuild,
    chestSize,
    hipSize,
    ...serializeCreateCharacterPresetSelections(gender, {
      appearance_and_body: selectedAppearanceAndBody,
      sexual_personality: selectedSexualPersonality,
      role_and_fantasy: selectedRoleAndFantasy,
      kinks_and_play: selectedKinksAndPlay,
      adultStyle: selectedAdultStyle,
    }),
    scenarios,
    imagePrompt,
  });

  const checkNameBeforeStepSix = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameCheckWarning(null);
      setNameError(t('create.nameRequired'));
      return false;
    }

    const requestKey = `${createdCharacterId || 'new'}:${normalizedName}`;
    if (nameAvailabilityPromiseRef.current?.key === requestKey) {
      return nameAvailabilityPromiseRef.current.promise;
    }

    const promise = (async () => {
      try {
        const result = await api.createdCharacters.wizardNameAvailability(normalizedName, createdCharacterId || undefined);
        if (isNameTaken(result)) {
          setNameCheckWarning(null);
          setNameError(t('create.nameTaken'));
          return false;
        }
        if (!result.available) {
          setNameError(null);
          setNameCheckWarning(t('create.nameCheckWarning'));
          return true;
        }
        setNameError(null);
        setNameCheckWarning(null);
        return true;
      } catch (reason) {
        if (reason instanceof ApiError && reason.status === 401) {
          onClose();
          onRequireAuth?.();
          return false;
        }
        if (reason instanceof ApiError && reason.code === 'NAME_TAKEN') {
          setNameCheckWarning(null);
          setNameError(t('create.nameTaken'));
          return false;
        }
        if (isTransientNameCheckFailure(reason)) {
          setNameError(null);
          setNameCheckWarning(t('create.nameCheckWarning'));
          return true;
        }
        setNameCheckWarning(null);
        setNameError(localizeCreateFlowError(reason, t, 'create.nameCheckError'));
        return false;
      } finally {
        if (nameAvailabilityPromiseRef.current?.key === requestKey) {
          nameAvailabilityPromiseRef.current = null;
        }
      }
    })();
    nameAvailabilityPromiseRef.current = { key: requestKey, promise };
    return promise;
  };

  const snapshotProfileInputs = () => {
    const snapshot = {
      subtitle: subtitle.trim(),
      backgroundStory: description.trim(),
      firstMessage: greeting.trim(),
    };
    profileInputSnapshotRef.current = snapshot;
    return snapshot;
  };

  const navigateToStep = async (step: number) => {
    if (step === 6 && currentStep === 5) snapshotProfileInputs();
    if (step === 6 && currentStep !== 6 && !(await checkNameBeforeStepSix())) {
      goToWizardStep(5, isPage ? 1 : 0);
      return;
    }
    goToWizardStep(step);
  };

  const handleCreatePrototype = () => {
    if (!name.trim()) {
      setNameError(t('create.nameRequired'));
      goToWizardStep(5, isPage ? 1 : 0);
      return;
    }
    setNameError(null);
    if (!selectedVoice || !createVoices.some((voice) => voice.voiceId === selectedVoice)) {
      setGenerationError(voiceLoading ? t('create.voiceLoading') : t('create.voiceRequired'));
      return;
    }
    const selectedVoiceOption = createVoices.find((voice) => voice.voiceId === selectedVoice);
    if (selectedVoiceOption && !hasVoiceAccess(selectedVoiceOption)) {
      openVoiceMembership(selectedVoiceOption);
      return;
    }
    setGenerationError(null);
    setPrototypeCreating(true);
    void api.createdCharacters.createFromGeneratedImage({
      generationJobId: generatedImageSource?.jobId || '',
      mediaId: generatedImageSource?.mediaId || '',
      gender,
      contentLocale: locale,
      name: name.trim(),
      subtitle: subtitle.trim(),
      backgroundStory: description.trim(),
      firstMessage: greeting.trim(),
      systemPrompt: systemInstruction.trim(),
      voiceId: selectedVoice,
      selections: {
        appearance_and_body: selectedAppearanceAndBody,
        sexual_personality: selectedSexualPersonality,
        role_and_fantasy: selectedRoleAndFantasy,
        kinks_and_play: selectedKinksAndPlay,
        adultStyles: [selectedAdultStyle],
      },
    }).then((character) => {
      setCreatedCharacter(character);
      setCreatedCharacterId(character.id);
      setPrototypeCreating(false);
      setPrototypeComplete(false);
      setGenerationError(null);
    }).catch((reason) => {
      setPrototypeCreating(false);
      if (reason instanceof ApiError && reason.code === 'MEMBERSHIP_REQUIRED') {
        if (selectedVoiceOption) openVoiceMembership(selectedVoiceOption);
      } else if (reason instanceof ApiError && reason.code === 'NAME_TAKEN') {
        setNameCheckWarning(null);
        setNameError(t('create.nameTaken'));
      } else setGenerationError(localizeCreateFlowError(reason, t, 'create.fromImageCreateError'));
    });
  };

  const retryPrototypeCard = () => {
    if (!createdCharacterId) return;
    setGenerationError(null);
    setPrototypeCreating(true);
    void api.createdCharacters.retryStCard(createdCharacterId).then(() => {
      setPrototypeCreating(false);
      setGenerationPollNonce((value) => value + 1);
    }).catch((reason) => {
      setPrototypeCreating(false);
      setGenerationError(localizeCreateFlowError(reason, t, 'create.fromImageCreateError'));
    });
  };

  const handleGenerateAiImage = async () => {
    if (!name.trim()) {
      setNameError(t('create.nameRequired'));
      goToWizardStep(5, isPage ? 1 : 0);
      return;
    }
    setNameError(null);
    if (walletBalance !== undefined && walletBalance < 10) {
      onOpenRechargeModal?.();
      return;
    }
    if (!selectedVoice || !createVoices.some((voice) => voice.voiceId === selectedVoice)) {
      setGenerationError(voiceLoading ? t('create.voiceLoading') : t('create.voiceRequired'));
      return;
    }
    const selectedVoiceOption = createVoices.find((voice) => voice.voiceId === selectedVoice);
    if (selectedVoiceOption && !hasVoiceAccess(selectedVoiceOption)) {
      openVoiceMembership(selectedVoiceOption);
      return;
    }
    setGenerationError(null);
    setGenerationFailureStage(null);
    setHasGeneratedImage(false);
    setAvatarUrl('');
    portraitJobRef.current = null;
    setAvatarLoadFailed(false);
    setAvatarReloadNonce(0);
    setPublicPublishLoading(false);
    setPublicPublishError(null);
    setIsGeneratingImage(true);
    wizardGenerateAbortRef.current?.abort();
    const controller = new AbortController();
    wizardGenerateAbortRef.current = controller;
    const profileInputs = snapshotProfileInputs();
    try {
      const result = await api.createdCharacters.wizardGenerate({
        characterId: createdCharacterId || undefined,
        name: name.trim(),
        age: Math.max(18, Number(age) || 18),
        style: artStyle === 'all' ? 'anime' : artStyle,
        gender,
        voiceId: selectedVoice,
        contentLocale: locale,
        imagePrompt: imagePrompt.trim(),
        subtitle: profileInputs.subtitle,
        backgroundStory: profileInputs.backgroundStory,
        firstMessage: profileInputs.firstMessage,
        systemPrompt: systemInstruction.trim(),
        relationship: 'friendship',
        selections: wizardSelections(),
      }, controller.signal);
      if (!nicknameConsumptionRequestedRef.current) {
        nicknameConsumptionRequestedRef.current = true;
        onConsumeNickname?.();
      }
      setCreatedCharacterId(result.character.id);
      setName(result.character.name);
      setGenerationJobId(result.job.id);
      setGenerationJob(result.job);
      if (result.character.avatar) setAvatarUrl(result.character.avatar);
    } catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') {
        setIsGeneratingImage(false);
        return;
      }
      setIsGeneratingImage(false);
      setGenerationFailureStage('generation');
      if (reason instanceof ApiError && reason.status === 401) {
        onClose();
        onRequireAuth?.();
        return;
      }
      if (reason instanceof ApiError && reason.code === 'NAME_TAKEN') {
        setNameCheckWarning(null);
        setNameError(t('create.nameTaken'));
        goToWizardStep(5, isPage ? 1 : 0);
        return;
      }
      if (reason instanceof ApiError && reason.code === 'MEMBERSHIP_REQUIRED') {
        if (selectedVoiceOption) openVoiceMembership(selectedVoiceOption);
        return;
      }
      setGenerationError(localizeCreateFlowError(reason, t, 'create.generationError'));
    } finally {
      if (wizardGenerateAbortRef.current === controller) wizardGenerateAbortRef.current = null;
    }
  };

  const handleRetryGeneration = async () => {
    if (!generationJob) {
      await handleGenerateAiImage();
      return;
    }
    setGenerationError(null);
    setGenerationFailureStage(null);
    setIsGeneratingImage(true);
    try {
      const retried = await api.generation.jobs.retry(generationJob.id);
      setGenerationJob(retried);
      setGenerationJobId(retried.id);
      setGenerationPollNonce((value) => value + 1);
    } catch (reason) {
      setIsGeneratingImage(false);
      setGenerationFailureStage('generation');
      if (reason instanceof ApiError && reason.status === 401) {
        onClose();
        onRequireAuth?.();
        return;
      }
      if (reason instanceof ApiError && reason.code === 'INSUFFICIENT_CREDITS') {
        setGenerationError(localizeCreateFlowErrorCode(reason.code, t, 'create.generationError'));
      }
    }
  };

  const handleRetryStCard = async () => {
    if (!createdCharacterId) return;
    setGenerationError(null);
    setGenerationFailureStage(null);
    setIsGeneratingImage(true);
    try {
      await api.createdCharacters.retryStCard(createdCharacterId);
      if (delayedPollTimerRef.current) window.clearTimeout(delayedPollTimerRef.current);
      delayedPollTimerRef.current = window.setTimeout(() => {
        delayedPollTimerRef.current = null;
        setGenerationPollNonce((value) => value + 1);
      }, 1000);
    } catch (reason) {
      setIsGeneratingImage(false);
      if (reason instanceof ApiError && reason.status === 401) {
        onClose();
        onRequireAuth?.();
        return;
      }
      if (createdCharacterId) {
        setGenerationFailureStage(null);
        if (delayedPollTimerRef.current) window.clearTimeout(delayedPollTimerRef.current);
        delayedPollTimerRef.current = window.setTimeout(() => {
          delayedPollTimerRef.current = null;
          setGenerationPollNonce((value) => value + 1);
        }, 1000);
      }
    }
  };

  const handleRetryCurrentStage = async () => {
    if (generationFailureStage === 'stCard') {
      await handleRetryStCard();
      return;
    }
    await handleRetryGeneration();
  };

  // Reset Modal state for creating another character
  const handleResetCreation = () => {
    stopVoiceSample();
    wizardGenerateAbortRef.current?.abort();
    wizardGenerateAbortRef.current = null;
    generationRecoveryAtRef.current = 0;
    stRetryAtRef.current = 0;
    if (delayedPollTimerRef.current) window.clearTimeout(delayedPollTimerRef.current);
    delayedPollTimerRef.current = null;
    setCreatedCharacter(null);
    showcaseShownRef.current = false;
    setPrototypeComplete(false);
    appliedGeneratedImageDraftRef.current = null;
    setCreatedCharacterId(null);
    setGenerationJobId(null);
    setGenerationPollNonce(0);
    setGenerationJob(null);
    setGenerationError(null);
    setGenerationFailureStage(null);
    setNameError(null);
    setNameCheckWarning(null);
    setAvatarUrl('');
    portraitJobRef.current = null;
    setAvatarLoadFailed(false);
    setAvatarReloadNonce(0);
    setImagePrompt('');
    setIsPromptManuallyEdited(false);
    setSelectedVoice(getCreateCharacterVoices('female', voiceCatalog)[0]?.voiceId || '');
    setIsGeneratingImage(false);
    setCurrentStep(1);
    setMobileQuestionIndex(0);
    setName('');
    nameEditedRef.current = false;
    nicknameConsumptionRequestedRef.current = false;
    profileInputSnapshotRef.current = { subtitle: '', backgroundStory: '', firstMessage: '' };
    onStartNextCharacter?.();
    setSubtitle('');
    setDescription('');
    setSystemInstruction('');
    setGreeting('');
    setArtStyle('anime');
    setGender('female');
    setSelectedRace('caucasian');
    setSelectedSpecies('human');
    setSkinTone('porcelain');
    setEyeColor('ruby');
    setFaceShape('v_line');
    setHairstyle('waves');
    setHairColor('black');
    setBodyBuild('curvy');
    setChestSize('flat');
    setHipSize('compact');
    setAge(getRandomCreateCharacterAge());
    const defaults = getDefaultCreateCharacterPresetSelections('female');
    setSelectedAppearanceAndBody(defaults.appearance_and_body);
    setSelectedSexualPersonality(defaults.sexual_personality);
    setSelectedRoleAndFantasy(defaults.role_and_fantasy);
    setSelectedKinksAndPlay(defaults.kinks_and_play);
    setSelectedAdultStyle(defaults.adultStyle);
    setScenarios([getDefaultCreateCharacterScenario(locale)]);
    setHasGeneratedImage(false);
  };

  return (
    <div
      className={isPage
        ? 'mobile-create-page relative flex h-full min-h-0 w-full flex-col'
        : isWorkspace
          ? 'create-workspace-shell relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#09090d] text-zinc-100'
          : 'mobile-create-panel safe-area-top fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4'}
      role={isEmbedded ? undefined : 'dialog'}
      aria-modal={isEmbedded ? undefined : true}
      aria-labelledby="create-character-title"
      data-presentation={presentation}
    >
      
      {/* Enlarge Photo Modal Preview overlay */}
      {previewPhotoUrl && (
        <div 
          className="safe-area-top fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-2 backdrop-blur-lg animate-in zoom-in-95 safe-area-bottom sm:p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-[#181828] rounded-3xl overflow-hidden border border-pink-500/50 p-2 shadow-2xl">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="mobile-touch-target absolute right-4 top-4 z-10 flex items-center justify-center rounded-full bg-black/80 text-white hover:bg-pink-600"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhotoUrl} alt={t('create.previewImageAlt')} className="h-auto max-h-[80dvh] w-full rounded-2xl object-contain" />
            <div className="p-3 text-center">
              <span className="text-xs text-pink-300 font-extrabold">🔍 {t('create.previewImage')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS SHOWCASE CARD MODAL VIEW ================= */}
      {prototypeComplete && generatedImageSource ? (
        <div className="mobile-modal-scroll relative my-auto max-h-[calc(100dvh-16px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-pink-500/60 bg-[#121222] p-5 text-zinc-100 shadow-2xl sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="mobile-touch-target absolute right-3 top-3 flex items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="pr-10">
            <h2 id="create-character-title" className="text-lg font-black text-white">{t('create.fromImagePreviewTitle')}</h2>
            <p className="mt-1 text-xs text-emerald-300">{t('create.fromImageSaved')}</p>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <img
              src={generatedImageSource.url}
              alt={t('create.fromImageSourceAlt')}
              className="max-h-[62dvh] w-full rounded-xl bg-black object-contain"
            />
            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="break-words text-xl font-black text-pink-200">{name.trim()}</h3>
                <p className="mt-1 break-words text-sm text-zinc-300">{subtitle.trim() || t('create.noSummary')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400">{t('create.selectedTags')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...selectedAppearanceAndBodyLabels, ...selectedSexualPersonalityLabels, ...selectedRoleAndFantasyLabels, ...selectedKinksAndPlayLabels].slice(0, 10).map((tag) => {
                    return <span key={tag} className="rounded-md bg-pink-950/70 px-2 py-1 text-[10px] font-bold text-pink-200">#{tag}</span>;
                  })}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-900/80 p-3">
                <p className="text-xs font-bold text-zinc-400">{t('create.fromImageStory')}</p>
                <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-xs leading-5 text-zinc-200">{description.trim() || greeting.trim() || t('create.noSummary')}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-zinc-500">{t('create.gender')}</dt><dd className="mt-1 font-bold text-white">{gender === 'female' ? t('create.female') : gender === 'male' ? t('create.male') : t('create.nonbinary')}</dd></div>
                <div><dt className="text-zinc-500">{t('create.voice')}</dt><dd className="mt-1 break-words font-bold text-white">{localizedVoiceName(selectedVoice, t('common.none'))}</dd></div>
              </dl>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setPrototypeComplete(false)} className="min-h-11 rounded-xl bg-zinc-800 px-5 text-xs font-black text-zinc-200 hover:bg-zinc-700">{t('create.fromImageBackToEdit')}</button>
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-pink-600 px-5 text-xs font-black text-white hover:bg-pink-500">{t('common.close')}</button>
          </div>
        </div>
      ) : createdCharacter && isGeneratedImagePrototype ? (
        <div className="mobile-modal-scroll relative my-auto w-full max-w-xl rounded-2xl border border-pink-500/60 bg-[#121222] p-6 text-zinc-100 shadow-2xl">
          <button type="button" onClick={onClose} className="absolute right-3 top-3 text-zinc-400 hover:text-white" aria-label={t('common.close')}><X className="h-5 w-5" /></button>
          <div className="pr-8">
            <h2 className="text-lg font-black text-white">{t('create.fromImagePreviewTitle')}</h2>
            <p className="mt-2 text-sm text-pink-200">{prototypeCreating ? t('create.fromImageStCreating') : t('create.fromImageStPending')}</p>
            {generationError && <p className="mt-3 text-xs text-rose-300" role="alert">{generationError}</p>}
          </div>
          <div className="mt-5 flex gap-2">
            {createdCharacter.stCard?.status !== 'complete' && <button type="button" onClick={retryPrototypeCard} disabled={prototypeCreating} className="min-h-11 rounded-xl bg-pink-600 px-4 text-xs font-black text-white disabled:opacity-60">{createdCharacter.stCard?.status === 'failed' ? t('create.fromImageRetrySt') : t('create.fromImageRedeliver')}</button>}
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-zinc-800 px-4 text-xs font-black text-zinc-200">{t('common.close')}</button>
          </div>
        </div>
      ) : createdCharacter ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-6">
        <div
          className="mobile-create-success mobile-modal-scroll relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border-2 border-pink-500/80 bg-[#121222] p-4 text-zinc-100 shadow-2xl shadow-pink-500/20 animate-in zoom-in-95 duration-300 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="created-character-title"
        >
          
          <button
            type="button"
            onClick={onClose}
            className="mobile-touch-target absolute right-4 top-4 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t('create.saved')}</span>
            </div>
            <h2 id="created-character-title" className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <span>{createdCharacter.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold shadow-sm">
                {createdCharacter.artStyle === 'anime' ? t('create.anime') : t('create.realistic')}
              </span>
            </h2>
            <p className="text-xs text-pink-300 italic">{createdCharacter.subtitle}</p>
          </div>

          {/* Large Hero Poster & Details Split Card */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 bg-[#18182a] p-4 rounded-2xl border border-zinc-800 mb-6 items-center">
            
            {/* Left Image Poster */}
            <div className="sm:col-span-5 relative aspect-[3/4] rounded-xl overflow-hidden bg-black border border-pink-500/40 shadow-xl group">
              <img
                key={`${createdCharacter.avatar}-${avatarReloadNonce}`}
                src={withAvatarReloadNonce(createdCharacter.avatar)}
                alt={createdCharacter.name}
                className="w-full h-full object-cover"
                onLoad={() => setAvatarLoadFailed(false)}
                onError={() => setAvatarLoadFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-pink-600 text-white text-[10px] font-black">
                {t('create.creatorHandle')} {t('create.creatorBadge')}
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <span className="text-[10px] text-pink-300 font-bold block">🎙️ {t('create.voice')}: {localizedVoiceName(createdCharacter.voiceStyle, createdCharacter.voiceStyle)}</span>
              </div>
              {avatarLoadFailed && (
                <div className="absolute inset-x-3 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-amber-500/40 bg-black/90 px-3 py-2 text-center text-[11px] text-amber-200" role="alert">
                  {t('create.imageLoadError')}
                  <button
                    type="button"
                    className="ml-2 font-bold underline"
                    onClick={() => {
                      setAvatarLoadFailed(false);
                      setAvatarReloadNonce((value) => value + 1);
                    }}
                  >
                    {t('create.retryImage')}
                  </button>
                </div>
              )}
            </div>

            {/* Right Attributes */}
            <div className="sm:col-span-7 space-y-3 text-left">
              <div>
                <span className="text-[10px] text-pink-400 font-extrabold block mb-1">🔥 {t('create.selectedTags')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {showcaseTags.map((tg, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-pink-950/60 text-pink-300 border border-pink-500/20 font-bold">
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-rose-400 font-extrabold block">💬 {t('create.greeting')} {t('create.preview')}</span>
                <p className="text-xs text-zinc-200 italic line-clamp-3">“{createdCharacter.greeting}”</p>
              </div>

              <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                <span>{t('create.age')}: {createdCharacter.age}{t('create.ageUnit')}</span>
                <span>{t('create.gender')}: {createdCharacter.gender === 'female' ? `♀ ${t('create.female')}` : createdCharacter.gender === 'male' ? `♂ ${t('create.male')}` : `⚧ ${t('create.nonbinary')}`}</span>
                <span>{t('create.score')}: <span className="text-amber-400 font-extrabold">9.9 {t('create.perfectMatch')}</span></span>
              </div>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <button
              type="button"
              onClick={() => void handlePublishCreatedCharacter()}
              disabled={publicPublishLoading || createdCharacter.publicStatus === 'pending' || createdCharacter.publicStatus === 'approved'}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black transition-colors disabled:cursor-default disabled:opacity-90 ${createdCharacter.publicStatus === 'approved' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : createdCharacter.publicStatus === 'pending' ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-violet-400/50 bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500'}`}
            >
              <Crown className="h-5 w-5 shrink-0" />
              <span>{publicPublishLoading ? t('create.publishSubmitting') : createdCharacter.publicStatus === 'approved' ? t('create.publishApproved') : createdCharacter.publicStatus === 'pending' ? t('create.publishPending') : createdCharacter.publicStatus === 'rejected' ? t('create.publishResubmit') : `${t('create.publishToCommunity')} · ${t('upgrade.feature.publishCharacters')} · 20 ${t('upgrade.diamonds')}`}</span>
            </button>
            {publicPublishError && <p className="text-center text-xs text-rose-300" role="alert">{publicPublishError}</p>}
          </div>

          {/* Completion actions */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                onSelectCharacterToChat?.(createdCharacter);
              }}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-pink-600 px-5 text-xs font-black text-white transition-colors hover:bg-pink-500"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{t('detail.startChat')}</span>
            </button>
            <button
              type="button"
              onClick={handleResetCreation}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-zinc-800 px-5 text-xs font-black text-zinc-100 transition-colors hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4" />
              <span>{t('create.createAnother')}</span>
            </button>
          </div>
        </div>
        </div>
      ) : (

        /* ================= MAIN WIZARD FORM MODAL CONTAINER ================= */
        <div className={isPage
          ? 'mobile-create-panel relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#12121e] text-zinc-100'
          : isWorkspace
            ? 'create-workspace-panel relative flex min-h-0 h-full w-full flex-col overflow-hidden bg-[#12121e] text-zinc-100'
          : 'mobile-create-panel relative flex h-[min(95dvh,72rem)] w-[min(96vw,90rem)] max-w-[90rem] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#12121e] text-zinc-100 shadow-2xl sm:rounded-3xl'}>
          <h2 id="create-character-title" className="sr-only" aria-live="polite">
            {isGeneratedImagePrototype ? t('create.fromImageTitle') : `${t('create.title')} ${t('create.step', { current: currentStep })}`}
          </h2>
          <div className="shrink-0 border-b border-zinc-800 bg-[#12121e]">
            {isPage ? (
              <div className="flex h-10 items-center justify-end px-3">
                <button
                  onClick={onClose}
                  className="mobile-touch-target flex items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label={t('common.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
            <div className={isWorkspace
              ? 'flex items-center justify-between px-4 py-2.5 lg:px-6'
              : 'flex justify-end px-3 pb-1 pt-2 sm:px-4'}>
              {isWorkspace && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{t('create.title')}</span>
                    <span className="rounded-full border border-pink-500/25 bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                      {t('create.step', { current: currentStep })}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500">{t('create.stepHint')}</p>
                </div>
              )}
              <button
                onClick={onClose}
                className="mobile-touch-target flex items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav
              className={isWorkspace
                ? 'mobile-scroll-strip overflow-x-auto px-4 pb-2 lg:px-6'
                : 'mobile-scroll-strip overflow-x-auto px-3 pb-2 sm:px-4'}
              aria-label={t('create.step', { current: currentStep })}
            >
              <ol className={isWorkspace
                ? 'flex min-w-max gap-1 rounded-xl border border-zinc-800 bg-[#181826] p-1 lg:grid lg:min-w-0 lg:grid-cols-6 lg:gap-0.5'
                : 'flex min-w-max gap-1 rounded-2xl border border-zinc-800 bg-[#181826] p-1 lg:grid lg:min-w-0 lg:grid-cols-6 lg:gap-1'}>
                {wizardSteps.map((step, index) => {
                  const isActive = currentStep === step.step;
                  return (
                    <li
                      key={step.step}
                      ref={(node) => { wizardStepNavRefs.current[index] = node; }}
                      className={isWorkspace ? 'min-w-40 lg:min-w-0' : 'min-w-40 lg:min-w-0'}
                    >
                      <button
                        type="button"
                        onClick={() => { void navigateToStep(step.step); }}
                        aria-current={isActive ? 'step' : undefined}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 lg:px-2 ${isWorkspace ? 'min-h-10 py-1' : 'min-h-12 py-1.5'} ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/20'
                            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                          isActive ? 'bg-white text-pink-600' : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {step.step}
                        </span>
                        <span className="min-w-0">
                          <span className={`block ${isWorkspace ? 'truncate text-[10px]' : 'text-[10px]'} font-black leading-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                            {step.label}
                          </span>
                          <span className={`block pt-0.5 ${isWorkspace ? 'truncate text-[7px]' : 'text-[8px]'} font-semibold leading-tight ${isActive ? 'text-pink-100' : 'text-zinc-600'}`}>
                            {step.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
              </>
            )}
          </div>

          {/* Wizard Main Content Container */}
          <div ref={wizardContentRef} className={`mobile-modal-scroll min-h-0 flex-1 overscroll-contain ${currentStep === 6 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'} ${isPage ? 'px-3 pb-3 pt-2' : isWorkspace ? 'px-4 pb-2 pt-2 lg:px-8 lg:pb-3 lg:pt-3 xl:px-10' : 'px-6 pb-3 pt-2 xl:px-8'}`}>
            
            {/* ================= STEP 1: 画风与性别 ================= */}
            {DESIGN_PREVIEW&&currentStep===1&&<EditorialGallery onSelect={url=>{setAvatarUrl(url);setHasGeneratedImage(true)}}/>}
            {currentStep === 1 && (
              <div className={`mx-auto animate-in fade-in duration-300 ${isPage ? 'flex min-h-full max-w-6xl -translate-y-2 flex-col justify-start gap-6 pb-8 pt-12 sm:pt-16' : 'max-w-7xl lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,.85fr)] lg:items-stretch lg:gap-5'}`}>
                {isPage && (
                  <div className="order-0 mx-auto w-full max-w-[38rem] px-4 text-center">
                    <p className="text-[10px] font-bold text-pink-300/80">{t('create.mobileEyebrow')}</p>
                    <h3 className="mt-1 text-xl font-black leading-tight text-zinc-100">
                      {t('create.mobileHeroPrefix')} <span className="text-pink-300">{t('create.mobileHeroAccent')}</span>
                    </h3>
                    <p className="mx-auto mt-2 max-w-[22rem] text-[11px] leading-relaxed text-zinc-500">
                      {t('create.mobileHeroDescription')}
                    </p>
                  </div>
                )}

                {/* 1. 画风选择 */}
                <div className={`${showMobileQuestion(0) ? '' : 'hidden'} ${isPage ? 'order-2 space-y-2' : 'space-y-3 rounded-2xl border border-white/[0.07] bg-[#171722] p-4 shadow-[0_18px_50px_-38px_rgba(236,72,153,0.55)]'}`}>
                  {!isPage && (
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-400">
                        <Palette className="h-4 w-4" />
                      </span>
                      <div>
                        <label className="block text-xs font-extrabold text-pink-300">1. {t('create.artStyle')} *</label>
                        <p className="mt-0.5 text-[10px] text-zinc-500">{t('create.styleSectionHint')}</p>
                      </div>
                    </div>
                  )}

                  <div className={isPage ? 'mx-auto grid w-full max-w-3xl grid-cols-1 gap-2.5 min-[360px]:grid-cols-2' : 'grid w-full grid-cols-2 gap-3'}>
                    {/* Anime Style */}
                    <button
                      type="button"
                      onClick={() => setArtStyle('anime')}
                      aria-pressed={artStyle === 'anime'}
                      className={`relative min-w-0 overflow-hidden text-left ${isPage ? 'rounded-2xl border' : 'rounded-xl border'} transition-all cursor-pointer ${
                        artStyle === 'anime'
                          ? 'border-pink-400 bg-pink-500/10 ring-1 ring-inset ring-pink-400/35 shadow-[0_18px_38px_-30px_rgba(236,72,153,0.85)]'
                          : 'border-white/[0.08] bg-[#1d1d2a] hover:border-white/[0.16] hover:bg-[#20202f]'
                      }`}
                    >
                      <div className={isPage ? 'aspect-[2/3] bg-black' : 'aspect-[3/4] bg-[#101018]'}>
                        <AssetPreview asset={stylePreviewMedia.anime} alt={t('create.anime')} priority />
                        {isPage && artStyle === 'anime' && (
                          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      {isPage ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0915] via-[#0b0915]/80 to-transparent px-3 pb-3 pt-10">
                          <span className="block text-sm font-black text-white">{t('create.anime')}</span>
                        </div>
                      ) : (
                        <div className="p-3">
                          <span className="mb-1 flex items-center justify-between gap-2 text-sm font-black text-zinc-100">
                            <span>{t('create.anime')}</span>
                            {artStyle === 'anime' && <Check className="h-4 w-4 shrink-0 text-pink-300" />}
                          </span>
                          <p className="break-words text-[11px] leading-relaxed text-zinc-400">{t('create.animeDescription')}</p>
                        </div>
                      )}
                    </button>

                    {/* Realistic Style */}
                    <button
                      type="button"
                      onClick={() => setArtStyle('realistic')}
                      aria-pressed={artStyle === 'realistic'}
                      className={`relative min-w-0 overflow-hidden text-left ${isPage ? 'rounded-2xl border' : 'rounded-xl border'} transition-all cursor-pointer ${
                        artStyle === 'realistic'
                          ? 'border-pink-400 bg-pink-500/10 ring-1 ring-inset ring-pink-400/35 shadow-[0_18px_38px_-30px_rgba(236,72,153,0.85)]'
                          : 'border-white/[0.08] bg-[#1d1d2a] hover:border-white/[0.16] hover:bg-[#20202f]'
                      }`}
                    >
                      <div className={isPage ? 'aspect-[2/3] bg-black' : 'aspect-[3/4] bg-[#101018]'}>
                        <AssetPreview asset={stylePreviewMedia.realistic} alt={t('create.realistic')} priority />
                        {isPage && artStyle === 'realistic' && (
                          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      {isPage ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0915] via-[#0b0915]/80 to-transparent px-3 pb-3 pt-10">
                          <span className="block text-sm font-black text-white">{t('create.realistic')}</span>
                        </div>
                      ) : (
                        <div className="p-3">
                          <span className="mb-1 flex items-center justify-between gap-2 text-sm font-black text-zinc-100">
                            <span>{t('create.realistic')}</span>
                            {artStyle === 'realistic' && <Check className="h-4 w-4 shrink-0 text-pink-300" />}
                          </span>
                          <p className="break-words text-[11px] leading-relaxed text-zinc-400">{t('create.realisticDescription')}</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. 性别选择 */}
                <div className={`${showMobileQuestion(0) ? '' : 'hidden'} ${isPage ? 'order-1 space-y-2' : 'flex h-full flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#171722] p-4 shadow-[0_18px_50px_-38px_rgba(236,72,153,0.55)]'}`}>
                  {!isPage && (
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10 text-pink-400">
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <label className="block text-xs font-extrabold text-pink-300">2. {t('create.gender')} *</label>
                        <p className="mt-0.5 text-[10px] text-zinc-500">{t('create.genderSectionHint')}</p>
                      </div>
                    </div>
                  )}

                  <div className={isPage ? 'mx-auto flex w-full max-w-[38rem] items-center gap-1 rounded-full border border-white/[0.08] bg-[#171722] p-1' : 'grid min-h-0 flex-1 grid-cols-1 grid-rows-3 gap-3'}>
                    {[
                      { id: 'female', symbol: '♀', label: t('create.female'), desc: t('create.femaleDescription') },
                      { id: 'male', symbol: '♂', label: t('create.male'), desc: t('create.maleDescription') },
                      { id: 'nonbinary', symbol: '⚧', label: t('create.nonbinary'), desc: t('create.nonbinaryDescription') },
                    ].map((g) => {
                      const targetGender = g.id as GenderType;
                      const isSelected = gender === targetGender;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleGenderChange(targetGender)}
                          aria-pressed={isSelected}
                          className={`${isPage ? 'flex min-h-10 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-full px-3 py-2 text-center' : 'grid h-full min-h-0 grid-cols-[2.75rem_minmax(0,1fr)_1.5rem] items-center gap-4 rounded-xl px-5 py-3 text-left'} border transition-all ${
                            isSelected
                              ? 'border-pink-300/70 bg-pink-500/20 text-pink-100 ring-1 ring-inset ring-pink-400/25 shadow-[0_10px_24px_-18px_rgba(236,72,153,0.8)]'
                              : 'border-transparent bg-transparent text-zinc-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          {isPage ? (
                            <span className="block truncate text-[11px] font-black leading-tight">{g.label}</span>
                          ) : (
                            <>
                              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-black ${isSelected ? 'border-pink-400/40 bg-pink-500/15 text-pink-200' : 'border-white/[0.08] bg-[#151520] text-zinc-400'}`} aria-hidden="true">
                                {g.symbol}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-black text-zinc-100">{g.label}</span>
                                <span className="mt-1 block text-[10px] leading-relaxed text-zinc-500">{g.desc}</span>
                              </span>
                              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-pink-400 bg-pink-500 text-white' : 'border-zinc-600 text-transparent'}`}>
                                <Check className="h-3 w-3" />
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: 种族与魔幻种族 ================= */}
            {currentStep === 2 && (
              <div
                role="radiogroup"
                aria-label={t('create.stepTitle2')}
                className={`mx-auto animate-in fade-in duration-300 ${isPage ? 'max-w-4xl space-y-4' : 'max-w-7xl space-y-5'}`}
              >
                {/* 人类现实种族 */}
                <div className={`${showMobileQuestion(0) ? '' : 'hidden'} space-y-3 ${isPage ? 'rounded-2xl border border-white/[0.07] bg-[#171722]/60 p-3' : 'rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10'} text-pink-400`}>
                      <Globe className="h-4 w-4" />
                    </span>
                    <div>
                      <label className="block text-xs font-extrabold text-pink-300">{t('create.humanRaces')}</label>
                      {!isPage && <p className="mt-0.5 text-[10px] text-zinc-500">{t('create.raceSectionHint')}</p>}
                    </div>
                  </div>

                  <div className={isPage ? 'mx-auto grid w-full max-w-5xl grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid grid-cols-3 gap-3 xl:grid-cols-6'}>
                    {HUMAN_RACES.map((race) => {
                      const isSelected = selectedSpecies === 'human' && selectedRace === race.id;
                      const label = visualLabel('race', race.id);
                      return (
                        <button
                          key={race.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleRaceSelection(race.id)}
                          className={`group relative overflow-hidden ${isPage ? 'rounded-2xl' : 'rounded-xl'} bg-[#161522] text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                              : 'hover:ring-1 hover:ring-white/20'
                          }`}
                        >
                           <div className="relative aspect-[2/3]">
                             <AssetPreview asset={getCreateCharacterOptionAsset(gender, artStyle, 'race', race.id)} alt={label} showBackdrop={false} />
                             <ImageChoiceOverlay label={`${race.icon} ${label}`} />
                             {isSelected && (
                               <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                 <Check className="h-4 w-4" />
                               </span>
                             )}
                           </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 猎奇/魔幻种族 */}
                <div className={`${showMobileQuestion(0) ? '' : 'hidden'} space-y-3 ${isPage ? 'rounded-2xl border border-white/[0.07] bg-[#171722]/60 p-3' : 'rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10'} text-pink-400`}>
                      <Dna className="h-4 w-4" />
                    </span>
                    <div>
                      <label className="block text-xs font-extrabold text-pink-300">{t('create.fantasySpecies')}</label>
                      {!isPage && <p className="mt-0.5 text-[10px] text-zinc-500">{t('create.speciesSectionHint')}</p>}
                    </div>
                  </div>

                  <div className={isPage ? 'mx-auto grid w-full max-w-5xl grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid grid-cols-3 gap-3 xl:grid-cols-6'}>
                    {FANTASY_SPECIES.map((spec) => {
                      const isSelected = selectedSpecies === spec.id;
                      const previewAsset = getCreateCharacterFantasySpeciesAsset(gender, artStyle, spec.id);
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleSpeciesSelection(spec.id)}
                          className={`${isPage ? 'overflow-hidden rounded-2xl' : 'overflow-hidden rounded-xl'} bg-[#161522] text-left transition-all ${
                            isSelected
                              ? 'ring-2 ring-pink-400 text-zinc-100 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                              : 'hover:ring-1 hover:ring-white/20 text-zinc-300'
                          }`}
                        >
                          <span className="relative block aspect-[2/3]">
                            <AssetPreview asset={previewAsset} alt={localizePreset('species', spec.id, 'name', spec.name)} showBackdrop={false} />
                            <span className="absolute left-2 top-2 rounded-full bg-[#161522]/80 px-2 py-0.5 text-[9px] font-black text-pink-200 backdrop-blur-sm">
                              {t('create.fantasyBadge')}
                            </span>
                            <ImageChoiceOverlay label={localizePreset('species', spec.id, 'name', spec.name)} />
                            {isSelected && (
                              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: 视觉外在细节 (直接选定照片/型号方案) ================= */}
            {currentStep === 3 && (
              <div className={`mx-auto space-y-4 animate-in fade-in duration-300 ${isPage ? 'max-w-4xl' : 'max-w-7xl'}`}>
                {/* Parameter Sub Tabs */}
                <div className={`${isPage ? 'hidden' : 'grid'} grid-cols-7 gap-2 rounded-2xl border border-white/[0.07] bg-[#171722] p-2`}>
                  {[
                     { id: 'skin', label: t('create.skinTone'), icon: Sparkles },
                     { id: 'chest', label: t('create.chestSize'), icon: User },
                     { id: 'hip', label: t('create.hipSize'), icon: Heart },
                     { id: 'body', label: t('create.bodyBuild'), icon: Sliders },
                     { id: 'face', label: t('create.faceShape'), icon: Smile },
                     { id: 'hair', label: t('create.hairStyle'), icon: Scissors },
                     { id: 'eye', label: t('create.eyeColor'), icon: Eye },
                  ].map((tab, index) => {
                    const TabIcon = tab.icon;
                    const isActive = appearanceSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAppearanceSubTab(tab.id as any)}
                        className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-black transition-all ${
                          isActive
                            ? 'border-pink-400/60 bg-pink-500/12 text-pink-200 ring-1 ring-inset ring-pink-400/25'
                            : 'border-transparent text-zinc-500 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-zinc-200'
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-pink-500 text-white' : 'bg-white/[0.05] text-zinc-500'}`}>
                          <TabIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{index + 1}. {tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SubTab Content 1: Skin Tones (肤色) */}
                {(isPage ? mobileQuestionIndex === 0 : appearanceSubTab === 'skin') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-pink-400">{t('create.skinToneHint')}</span>
                    </div>
                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {SKIN_TONES.map((skin) => {
                        const isSelected = skinTone === skin.id;
                        const asset = visualAsset('skin', skin.id);
                        const label = visualLabel('skin', skin.id);
                        return (
                          <div
                            key={skin.id}
                            onClick={() => setSkinTone(skin.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer group ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                            <div className="relative aspect-[2/3]">
                              <AssetPreview asset={asset} alt={label} showBackdrop={false} />
                              <ImageChoiceOverlay label={label} />
                              {isSelected && (
                                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 2: Chest Sizes (胸部尺寸) */}
                {(isPage ? mobileQuestionIndex === 1 : appearanceSubTab === 'chest') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-rose-400">{t('create.chestSizeHint')}</span>
                    </div>
                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {CHEST_SIZES.map((cs) => {
                        const isSelected = chestSize === cs.id;
                        const asset = visualAsset('chest', cs.id);
                        const label = visualLabel('chest', cs.id);
                        return (
                          <div
                            key={cs.id}
                            onClick={() => setChestSize(cs.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer group ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                            <div className="relative aspect-[2/3]">
                              <AssetPreview asset={asset} alt={label} showBackdrop={false} />
                              <ImageChoiceOverlay label={label} />
                              {isSelected && (
                                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 3: Hip Sizes (臀部尺寸) */}
                {(isPage ? mobileQuestionIndex === 2 : appearanceSubTab === 'hip') && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-400">{t('create.hipSizeHint')}</span>
                    </div>
                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {HIP_SIZES.map((hs) => {
                        const isSelected = hipSize === hs.id;
                        const asset = visualAsset('hip', hs.id);
                        const label = visualLabel('hip', hs.id);
                        return (
                          <div
                            key={hs.id}
                            onClick={() => setHipSize(hs.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer group ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                            <div className="relative aspect-[2/3]">
                              <AssetPreview asset={asset} alt={label} showBackdrop={false} />
                              <ImageChoiceOverlay label={label} />
                              {isPage && (
                                <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1" aria-label={label}>
                                  <span className="h-1 rounded-full bg-pink-300/80" style={{ width: MOBILE_HIP_RATIO_GUIDES[hs.id]?.waist }} />
                                  <span className="h-1 rounded-full bg-purple-300/90" style={{ width: MOBILE_HIP_RATIO_GUIDES[hs.id]?.hip }} />
                                </span>
                              )}
                              {isSelected && (
                                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 4: Body Builds (身形) */}
                {(isPage ? mobileQuestionIndex === 3 : appearanceSubTab === 'body') && (
                  <div className="space-y-3 animate-in fade-in">
                     <span className="text-xs font-extrabold text-pink-400 block">{t('create.bodyBuildHint')}</span>
                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {BODY_BUILDS.map((b) => {
                        const isSelected = bodyBuild === b.id;
                        const label = visualLabel('body', b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => setBodyBuild(b.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer group ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                            <div className="relative aspect-[2/3]">
                              <AssetPreview asset={visualAsset('body', b.id)} alt={label} showBackdrop={false} />
                              <ImageChoiceOverlay label={label} />
                              {isSelected && (
                                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 5: Face Shapes (脸型) */}
                {(isPage ? mobileQuestionIndex === 4 : appearanceSubTab === 'face') && (
                  <div className="space-y-3 animate-in fade-in">
                     <span className="text-xs font-extrabold text-pink-400 block">{t('create.faceShapeHint')}</span>
                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {FACE_SHAPES.map((face) => {
                        const isSelected = faceShape === face.id;
                        const label = visualLabel('face', face.id);
                        return (
                          <div
                            key={face.id}
                            onClick={() => setFaceShape(face.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                             <div className="relative aspect-[2/3] w-full">
                               <AssetPreview asset={visualAsset('face', face.id)} alt={label} showBackdrop={false} />
                               <ImageChoiceOverlay label={label} />
                               {isSelected && (
                                 <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                   <Check className="h-4 w-4" />
                                 </span>
                               )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 6: Hair (发型与发色) */}
                {(isPage ? mobileQuestionIndex === 5 : appearanceSubTab === 'hair') && (
                  <div className="space-y-3 animate-in fade-in">
                    <span className="block text-xs font-extrabold text-pink-400">{t('create.hairStyleHint')}</span>

                    <div className="rounded-2xl border border-purple-400/15 bg-[#171722] p-3 sm:p-4">
                      <span className="mb-2.5 block text-xs font-extrabold text-purple-300">{t('create.hairColorHint')}</span>
                      <div role="radiogroup" aria-label={t('create.hairColorHint')} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {HAIR_COLORS.map((hc) => {
                          const isSelected = hairColor === hc.id;
                          const label = localizePreset('hairColor', hc.id, 'label', hc.label);
                          return (
                            <button
                              key={hc.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => setHairColor(hc.id)}
                              className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 ${
                                isSelected
                                  ? 'border-pink-400/70 bg-pink-500/12 text-zinc-100 ring-1 ring-inset ring-pink-400/25'
                                  : 'border-white/[0.08] bg-[#1d1d2a] text-zinc-400 hover:border-purple-300/35 hover:bg-[#20202f] hover:text-zinc-100'
                              }`}
                            >
                              <span
                                className="h-5 w-5 shrink-0 rounded-full border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                                style={{ backgroundColor: hc.color }}
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1 truncate text-[11px] font-bold">{label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-pink-300" aria-hidden="true" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={isPage ? COMPACT_IMAGE_OPTION_GRID : DIALOG_IMAGE_OPTION_GRID}>
                      {visibleHairstyles(gender).map((h) => {
                        const isSelected = hairstyle === h.id;
                        const label = visualLabel('hair', h.id);
                        return (
                          <div
                            key={h.id}
                            onClick={() => setHairstyle(h.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                             <div className="relative aspect-[2/3] w-full">
                               <AssetPreview asset={visualAsset('hair', h.id)} alt={label} showBackdrop={false} />
                               <ImageChoiceOverlay label={label} />
                               {isSelected && (
                                 <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                   <Check className="h-4 w-4" />
                                 </span>
                               )}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubTab Content 7: Eye Colors (眼睛) */}
                {(isPage ? mobileQuestionIndex === 6 : appearanceSubTab === 'eye') && (
                  <div className="space-y-3 animate-in fade-in">
                     <span className="text-xs font-extrabold text-pink-400 block">{t('create.eyeColorHint')}</span>
                    <div className={isPage ? (gender === 'nonbinary' ? 'grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : COMPACT_IMAGE_OPTION_GRID) : EYE_IMAGE_OPTION_GRID}>
                      {EYE_COLORS.map((eye) => {
                        const isSelected = eyeColor === eye.id;
                        const label = visualLabel('eye', eye.id);
                        return (
                          <div
                            key={eye.id}
                            onClick={() => setEyeColor(eye.id)}
                            className={`relative overflow-hidden rounded-2xl bg-[#161522] transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-pink-400 shadow-[0_16px_34px_-28px_rgba(236,72,153,0.85)]'
                                : 'hover:ring-1 hover:ring-white/20'
                            }`}
                          >
                            {!isPage && gender === 'nonbinary' ? (
                              <div className="flex items-center gap-3 p-3">
                                <div
                                  className="h-6 w-6 shrink-0 rounded-full border border-white/50 shadow"
                                  style={{ background: eye.color === 'gradient' ? 'linear-gradient(to right, red, blue)' : eye.color }}
                                />
                                <span className="truncate text-xs font-bold text-white">{label}</span>
                              </div>
                            ) : (
                              <>
                                <div className="relative aspect-[3/2] overflow-hidden bg-[#101018]">
                                  <AssetPreview asset={visualAsset('eye', eye.id)} alt={label} showBackdrop={false} />
                                  {isPage && (
                                    <span
                                      className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-2 border-white/80 shadow-lg"
                                      style={{ background: eye.color === 'gradient' ? 'linear-gradient(to right, #ef4444, #3b82f6)' : eye.color }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <ImageChoiceOverlay label={label} />
                                  {isSelected && (
                                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg" aria-hidden="true">
                                      <Check className="h-4 w-4" />
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: Appearance / Sexual Personality / Role / Kinks ================= */}
            {currentStep === 4 && (
              <div className={`mx-auto space-y-4 animate-in fade-in duration-300 ${isPage ? 'max-w-4xl' : 'max-w-7xl lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0'}`}>
                {/* Appearance and body */}
                <div className={`space-y-3 ${isPage ? '' : 'min-h-[13rem] rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-pink-400">
                      <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/25 bg-pink-500/10'}`}><Smile className="h-4 w-4" /></span>
                      <span>{t('create.appearanceAndBodyHint')}</span>
                    </label>
                    {!isPage && <span className="text-[10px] text-zinc-600">{selectedAppearanceAndBody.length}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.appearance_and_body.map((p) => {
                      const isSelected = selectedAppearanceAndBody.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTrait(selectedAppearanceAndBody, setSelectedAppearanceAndBody, p.id)}
                          className={`min-h-9 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70 ${
                            isSelected
                              ? 'border-pink-400 bg-pink-600 text-white shadow-[0_8px_20px_-14px_rgba(236,72,153,0.95)]'
                              : 'border-white/[0.09] bg-[#1c1c29] text-zinc-400 hover:border-pink-400/35 hover:bg-[#232031] hover:text-zinc-100'
                          }`}
                        >
                          {isSelected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <Plus className="mr-1 inline h-3.5 w-3.5" />}
                          {localizeTrait(p)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sexual personality */}
                <div className={`space-y-3 ${isPage ? '' : 'min-h-[13rem] rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-rose-400">
                      <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10'}`}><Briefcase className="h-4 w-4" /></span>
                      <span>{t('create.sexualPersonalityHint')}</span>
                    </label>
                    {!isPage && <span className="text-[10px] text-zinc-600">{selectedSexualPersonality.length}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.sexual_personality.map((o) => {
                      const isSelected = selectedSexualPersonality.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTrait(selectedSexualPersonality, setSelectedSexualPersonality, o.id)}
                          className={`min-h-9 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 ${
                            isSelected
                              ? 'border-rose-400 bg-rose-600 text-white shadow-[0_8px_20px_-14px_rgba(244,63,94,0.95)]'
                              : 'border-white/[0.09] bg-[#1c1c29] text-zinc-400 hover:border-rose-400/35 hover:bg-[#232031] hover:text-zinc-100'
                          }`}
                        >
                          {isSelected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <Plus className="mr-1 inline h-3.5 w-3.5" />}
                          {localizeTrait(o)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role and fantasy */}
                <div className={`space-y-3 ${isPage ? '' : 'min-h-[13rem] rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-purple-400">
                      <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/25 bg-purple-500/10'}`}><Users className="h-4 w-4" /></span>
                      <span>{t('create.roleAndFantasyHint')}</span>
                    </label>
                    {!isPage && <span className="text-[10px] text-zinc-600">{selectedRoleAndFantasy.length}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.role_and_fantasy.map((r) => {
                      const isSelected = selectedRoleAndFantasy.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTrait(selectedRoleAndFantasy, setSelectedRoleAndFantasy, r.id)}
                          className={`min-h-9 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 ${
                            isSelected
                              ? 'border-purple-400 bg-purple-600 text-white shadow-[0_8px_20px_-14px_rgba(168,85,247,0.95)]'
                              : 'border-white/[0.09] bg-[#1c1c29] text-zinc-400 hover:border-purple-400/35 hover:bg-[#232031] hover:text-zinc-100'
                          }`}
                        >
                          {isSelected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <Plus className="mr-1 inline h-3.5 w-3.5" />}
                          {localizeTrait(r)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kinks and play */}
                <div className={`space-y-3 ${isPage ? '' : 'min-h-[13rem] rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
                      <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10'}`}><Flame className="h-4 w-4" /></span>
                      <span>{t('create.kinksAndPlayHint')}</span>
                    </label>
                    {!isPage && <span className="text-[10px] text-zinc-600">{selectedKinksAndPlay.length}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePresets.kinks_and_play.map((f) => {
                      const isSelected = selectedKinksAndPlay.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTrait(selectedKinksAndPlay, setSelectedKinksAndPlay, f.id)}
                          className={`min-h-9 rounded-lg border px-3 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                            isSelected
                              ? 'border-amber-400 bg-gradient-to-r from-amber-700 to-rose-600 text-white shadow-[0_8px_20px_-14px_rgba(245,158,11,0.95)]'
                              : 'border-white/[0.09] bg-[#1c1c29] text-zinc-400 hover:border-amber-400/35 hover:bg-[#232031] hover:text-zinc-100'
                          }`}
                        >
                          {isSelected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <Plus className="mr-1 inline h-3.5 w-3.5" />}
                          {localizeTrait(f)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: 成人风格故事定位 & 剧情开场白 ================= */}
            {currentStep === 5 && (
              <div className={`mx-auto animate-in fade-in duration-300 ${isPage ? 'max-w-4xl space-y-4' : 'max-w-7xl space-y-4'}`}>
                {isGeneratedImagePrototype && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-pink-500/30 bg-pink-950/20 px-3 py-2">
                    <span className="text-xs text-pink-200">{generatedImageDraftLoading ? t('create.fromImageDraftLoading') : generatedImageDraftError || t('create.fromImageDraftHint')}</span>
                    <button type="button" onClick={onRetryGeneratedImageDraft} disabled={generatedImageDraftLoading || !onRetryGeneratedImageDraft} className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{t('create.fromImageRandomize')}</button>
                  </div>
                )}
                <div className={isPage ? 'space-y-4' : 'lg:grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-5'}>
                {/* 成人剧情 Archetype 定位 */}
                <div className={`${showMobileQuestion(0) ? '' : 'hidden'} space-y-3 ${isPage ? '' : 'h-full rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`${isPage ? '' : 'flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/20 bg-pink-500/10'} text-pink-400`}>
                      <Clapperboard className="h-4 w-4" />
                    </span>
                    <div>
                      <label className="block text-xs font-extrabold text-pink-300">{t('create.archetypeHint')}</label>
                      {!isPage && <p className="mt-0.5 text-[10px] text-zinc-500">{t('create.archetypeHelper')}</p>}
                    </div>
                  </div>

                  <div role="radiogroup" aria-label={t('create.archetypeHint')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activePresets.archetypes.map((arch) => {
                      const isSelected = selectedAdultStyle === arch.id;
                      return (
                        <button
                          key={arch.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedAdultStyle(arch.id)}
                          className={`${isPage ? '' : 'min-h-[5.25rem]'} ${isSelected
                            ? 'w-full rounded-xl border border-pink-400/60 bg-pink-500/12 p-3 text-left ring-1 ring-inset ring-pink-400/25 transition-all'
                            : 'w-full rounded-xl border border-white/[0.07] bg-[#1d1d2a] p-3 text-left transition-all hover:border-white/[0.14] hover:bg-[#20202f]'
                          }`}
                        >
                          <span className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-black text-white">
                              {localizeArchetype(arch, 'name')}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-pink-400" />}
                          </span>
                          <span className="block text-[10px] text-zinc-400 line-clamp-2">{localizeArchetype(arch, 'desc')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={isPage ? 'contents' : 'h-full space-y-4 rounded-2xl border border-white/[0.07] bg-[#171722] p-4'}>
                {/* 角色基础信息 */}
                <div className={isPage ? 'space-y-4 pt-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'}>
                  <div className={showMobileQuestion(1) ? '' : 'hidden'}>
                    <label htmlFor="create-character-name" className="text-xs font-bold text-zinc-300 block mb-1">{t('create.name')} *</label>
                    <input
                      id="create-character-name"
                      type="text"
                      value={name}
                      maxLength={80}
                      aria-invalid={Boolean(nameError)}
                      aria-describedby="create-character-name-feedback"
                      onChange={(event) => {
                        const nextName = event.target.value;
                        if (nextName !== name && !nameEditedRef.current) {
                          nameEditedRef.current = true;
                          if (!nicknameConsumptionRequestedRef.current) {
                            nicknameConsumptionRequestedRef.current = true;
                            onConsumeNickname?.();
                          }
                        }
                        setName(nextName);
                        setNameError(null);
                        setNameCheckWarning(null);
                      }}
                      placeholder={nicknameLoading ? t('create.nicknameLoading') : t('create.namePlaceholder')}
                      className={`w-full bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-xl border ${nameError ? 'border-rose-500' : 'border-zinc-800'} focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                    />
                    <div id="create-character-name-feedback" className="mt-1 min-h-4 text-[11px]" aria-live="polite">
                      {nameError ? (
                        <p className="text-rose-300">{nameError}</p>
                      ) : nameCheckWarning ? (
                        <p className="text-amber-300">{nameCheckWarning}</p>
                      ) : nicknameError ? (
                        <p className="text-amber-300">
                          {nicknameError}{' '}
                          <button type="button" className="font-bold underline underline-offset-2" onClick={onRetryNickname}>{t('create.retryNickname')}</button>
                        </p>
                      ) : nicknameLoading && !name ? (
                        <p className="text-zinc-400">{t('create.nicknameLoading')}</p>
                      ) : wizardNickname?.nickname && !nameEditedRef.current ? (
                        <p className="text-zinc-400">{t('create.nicknameAutoFilled')}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className={showMobileQuestion(1) ? '' : 'hidden'}>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">{t('create.subtitle')}</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={t('create.subtitlePlaceholder')}
                      className="w-full bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-zinc-800 focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className={showMobileQuestion(1) ? '' : 'hidden'}>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t('create.description')}</label>
                  <textarea
                    rows={isPage ? 5 : 7}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('create.descriptionPlaceholder')}
                    className="min-h-36 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-white focus:border-pink-500"
                  />
                </div>

                <div className={showMobileQuestion(1) ? '' : 'hidden'}>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">{t('create.greeting')}</label>
                  <textarea
                    rows={isPage ? 5 : 7}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder={t('create.greetingPlaceholder')}
                    className="min-h-36 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-white focus:border-pink-500"
                  />
                </div>
                </div>
                </div>
              </div>
            )}

            {/* ================= STEP 6: 方案汇总全景 & AI 立绘生成与音色 ================= */}
            {currentStep === 6 && !isGeneratedImagePrototype && (
              <div className={`mx-auto h-full min-h-0 animate-in fade-in duration-300 ${isPage ? 'max-w-5xl' : 'max-w-7xl'}`}>
                <div className="grid h-full min-h-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(17rem,.62fr)_minmax(0,1.38fr)]">
                  
                  {/* Left: portrait, character tags, and generation action */}
                  <div className={`${(isPage ? showMobileQuestion(1) : showMobileQuestion(2)) ? '' : 'hidden'} flex h-full min-h-0 min-w-0 flex-col gap-2.5`}>
                    <div className={`relative w-full min-h-0 overflow-hidden bg-[#101018] shadow-[0_22px_60px_-42px_rgba(236,72,153,0.8)] ${isPage ? 'aspect-[2/3] rounded-3xl' : 'flex-1 rounded-2xl'}`}>
                      {showPortraitProgress ? (
                        <img
                          src="/assets/lurova-entry-poster-v1.webp"
                          alt=""
                          aria-hidden="true"
                          className="relative z-10 h-full w-full object-cover object-center animate-pulse motion-reduce:animate-none"
                          style={{ opacity: 0.2 + (portraitGenerationProgress / 100) * 0.45 }}
                        />
                      ) : avatarUrl ? (
                         <AssetPreview
                           asset={{ src: withAvatarReloadNonce(avatarUrl) }}
                           alt={t('create.avatarResultAlt')}
                           mediaKey={`${avatarUrl}-${avatarReloadNonce}`}
                           className="relative z-10 h-full w-full object-cover object-center"
                           onLoad={() => setAvatarLoadFailed(false)}
                           onError={() => setAvatarLoadFailed(true)}
                         />
                      ) : (
                        <AssetPreview
                          asset={{ src: '/create-character/portrait-placeholder.jpg' }}
                          alt={t('create.avatarResultAlt')}
                          className="relative z-10 h-full w-full object-cover object-center"
                          showBackdrop={false}
                        />
                      )}

                      {showPortraitProgress && (
                        <>
                          <div className="pointer-events-none absolute inset-0 z-[15] animate-pulse bg-pink-300/10 motion-reduce:animate-none" aria-hidden="true" />
                          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#090713] via-[#130b20]/95 to-transparent px-4 pb-4 pt-16">
                            <div className="rounded-xl border border-pink-300/20 bg-[#171020]/88 p-3 shadow-[0_12px_35px_-16px_rgba(244,114,182,0.8)] backdrop-blur-md">
                              <div
                                className="h-2 overflow-hidden rounded-full bg-[#090713]/90 ring-1 ring-inset ring-white/10"
                                role="progressbar"
                                aria-label={t('create.progress')}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={portraitGenerationProgress}
                              >
                                <div
                                  className="relative h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-rose-300 shadow-[0_0_16px_rgba(244,114,182,0.75)] transition-[width] duration-500 ease-out"
                                  style={{ width: `${portraitGenerationProgress}%` }}
                                >
                                  <span className="absolute inset-0 animate-pulse bg-white/15 motion-reduce:animate-none" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-base font-black text-pink-300">{name || t('create.unnamedCharacter')}</span>
                      </div>
                      {hasGeneratedImage && !showPortraitProgress && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pink-950/70 px-2.5 py-1 text-[10px] font-black text-pink-200 ring-1 ring-inset ring-pink-500/30">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('create.rendered')}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 rounded-xl border border-white/[0.07] bg-[#171722] p-2.5">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-zinc-300">
                        <Tag className="h-3.5 w-3.5 text-pink-400" />
                        <span>{t('create.selectedTraits')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {characterTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-pink-500/20 bg-pink-950/45 px-1.5 py-0.5 text-[10px] font-bold text-pink-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!showPortraitProgress && <button
                      type="button"
                      onClick={handleGenerateAiImage}
                      className="z-20 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-black text-white shadow-lg shadow-pink-500/25 transition-colors hover:bg-pink-500"
                    >
                      <Sparkles className="h-5 w-5" />
                       <span>{hasGeneratedImage ? t('create.regenerate') : `${t('create.generate')} · 10 ${t('upgrade.diamonds')}`}</span>
                    </button>}
                    {avatarLoadFailed && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-200" role="alert">
                        {t('create.imageLoadError')}
                        <button
                          type="button"
                          className="ml-2 font-bold underline"
                          onClick={() => {
                            setAvatarLoadFailed(false);
                            setAvatarReloadNonce((value) => value + 1);
                          }}
                        >
                          {t('create.retryImage')}
                        </button>
                      </div>
                    )}
                    {generationError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200" role="alert">
                        {generationError}
                         <button type="button" className="ml-2 underline" onClick={() => { void handleRetryCurrentStage(); }}>{t('common.retry')}</button>
                      </div>
                    )}
                  </div>

                  {/* Right: generated prompt and voice selection */}
                  <div className={`${isPage && mobileQuestionIndex !== 0 ? 'hidden' : ''} min-h-0 min-w-0 space-y-3 overflow-hidden rounded-3xl border border-zinc-800 bg-[#161626] p-3 sm:p-4 lg:flex lg:h-full lg:flex-col`}>
                    
                    {/* Prompt Box */}
                    <div className={`${showMobileQuestion(0) ? '' : 'hidden'} shrink-0 space-y-2`}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-pink-400 flex items-center gap-1.5">
                          <Wand2 className="w-4 h-4" />
                           <span>{t('create.promptLabel')}</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleBuildPromptFromSelections}
                          className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500 hover:text-white"
                        >
                           {t('create.rebuildPrompt')}
                        </button>
                      </div>

                      {isPromptManuallyEdited ? (
                        <textarea
                          ref={promptTextareaRef}
                          value={imagePrompt}
                          onChange={(event) => setImagePrompt(event.target.value)}
                          aria-label={t('create.promptLabel')}
                          className="h-[12rem] w-full resize-none overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 text-zinc-300 shadow-inner shadow-black/20 outline-none transition-colors focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                        />
                      ) : (
                        <div
                          role="textbox"
                          aria-multiline="true"
                          aria-label={t('create.promptLabel')}
                          tabIndex={0}
                          onClick={() => {
                            setIsPromptManuallyEdited(true);
                            window.requestAnimationFrame(() => promptTextareaRef.current?.focus());
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            setIsPromptManuallyEdited(true);
                            window.requestAnimationFrame(() => promptTextareaRef.current?.focus());
                          }}
                          className="h-[12rem] w-full cursor-text overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 shadow-inner shadow-black/20 outline-none transition-colors focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                        >
                          {automaticImagePrompt.segments.map((segment, index) => (
                            <span key={`${segment.tone}-${index}`} className={PROMPT_SEGMENT_CLASSES[segment.tone]}>{segment.text}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Voice Selection Section (Expanded & Stretched to match left aspect height) */}
                    <div className={`${(isPage ? showMobileQuestion(0) : showMobileQuestion(1)) ? '' : 'hidden'} flex min-h-0 flex-1 flex-col space-y-1.5 border-t border-zinc-800 pt-2`}>
                      
                      {/* Voice Header with VIP indicator & Test Toggle */}
                      <div className="flex items-center justify-between shrink-0 mb-1 gap-3">
                        <label className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                           <span>{t('create.voiceHint')}</span>
                        </label>

                        {!isPage && voiceLoading ? (
                          <span className="text-[10px] text-zinc-400">{t('create.loadingVoices')}</span>
                        ) : null}
                      </div>

                      {/* Keep cards content-sized so the voice section does not dominate the workspace. */}
                      <div className="custom-scrollbar grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start gap-2 overflow-y-auto p-0.5 pr-1">
                        {voiceError && !isPage && (
                          <p className="col-span-2 text-[11px] text-rose-300" role="alert">
                            {voiceError}
                             <button type="button" className="ml-2 underline" onClick={() => setVoiceLoadNonce((value) => value + 1)}>{t('create.retryVoices')}</button>
                          </p>
                        )}
                        {createVoices.map((voice) => {
                          const isSelected = selectedVoice === voice.voiceId;
                          const isPlaying = playingVoiceId === voice.voiceId;
                          const previewUnavailable = !voice.previewUrl && !voice.previewText;
                          const showMembershipBadge = voice.isFree === false;
                          const isVoiceLocked = !hasVoiceAccess(voice);

                          return (
                            <div
                              key={voice.voiceId}
                              onClick={() => handleSelectVoice(voice)}
                              className={`flex min-h-[5rem] min-w-0 items-center justify-between gap-2 rounded-xl border p-2 transition-all sm:min-h-[5.5rem] ${
                                isSelected
                                  ? 'cursor-pointer border-pink-500 bg-pink-950/60 ring-1 ring-inset ring-pink-400/30 shadow-lg shadow-pink-950/30'
                                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                <div className="flex min-w-0 items-start gap-1.5">
                                  <span className="line-clamp-2 min-w-0 flex-1 break-words text-xs font-black leading-snug text-white">
                                    {t(voice.displayNameKey)}
                                  </span>
                                  {showMembershipBadge && (
                                    <span className="mt-0.5 shrink-0" role="img" aria-label={t('create.vipExclusive')} title={t('create.vipExclusive')}>
                                      <Crown className="h-3 w-3 text-amber-300" aria-hidden="true" />
                                    </span>
                                  )}
                                  {isSelected && !isPage && (
                                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-extrabold text-pink-300">
                                      <Check className="w-3 h-3" />
                                      <span>{t('common.selected')}</span>
                                    </span>
                                  )}
                                </div>
                                {!isPage && (
                                  <p className="line-clamp-2 break-words text-[10px] italic leading-snug text-zinc-400">
                                    “{voice.previewText || t(voice.displayNameKey)}”
                                  </p>
                                )}
                              </div>

                              {/* Right Preview Audio Player Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayVoiceSample(voice);
                                }}
                                disabled={previewUnavailable && !isVoiceLocked}
                                aria-label={`${t('create.listen')} ${t(voice.displayNameKey)}`}
                                title={`${t('create.listen')} ${t(voice.displayNameKey)}`}
                                className={`flex min-h-9 w-[4.75rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                                  isPlaying
                                    ? 'bg-pink-600 text-white border border-pink-400 shadow-md animate-pulse'
                                    : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-40'
                                }`}
                              >
                                {isPlaying ? (
                                  <>
                                    <div className="flex items-end gap-0.5 h-3">
                                      <span className="w-0.5 bg-white animate-pulse h-2"></span>
                                      <span className="w-0.5 bg-white animate-pulse h-3 delay-75"></span>
                                      <span className="w-0.5 bg-white animate-pulse h-1.5 delay-150"></span>
                                    </div>
                                     <span className="text-[10px] text-pink-200">{t('create.pause')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                                     <span className="text-[10px]">{t('create.listen')}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && isGeneratedImagePrototype && generatedImageSource && (
              <div className="mx-auto grid w-full max-w-5xl gap-5 animate-in fade-in duration-300 lg:grid-cols-12">
                <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black p-2 ring-1 ring-inset ring-pink-500/45">
                    <img
                      src={generatedImageSource.url}
                      alt={t('create.fromImageSourceAlt')}
                      className="max-h-[min(58dvh,38rem)] w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-pink-200">{name.trim() || t('create.unnamedCharacter')}</p>
                    <p className="mt-1 break-words text-xs text-zinc-400">{subtitle.trim() || t('create.noSummary')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePrototype}
                    disabled={prototypeCreating}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-4 text-sm font-black text-white shadow-lg shadow-pink-950/40 transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className={`h-5 w-5 ${prototypeCreating ? 'animate-spin' : ''}`} />
                    <span>{prototypeCreating ? t('create.fromImageCreating') : t('create.fromImageCreate')}</span>
                  </button>
                  {generationError && <p className="text-center text-xs text-rose-300" role="alert">{generationError}</p>}
                </div>

                <div className="min-w-0 rounded-2xl bg-[#161626] p-4 ring-1 ring-inset ring-zinc-800 sm:p-5 lg:col-span-7">
                  <fieldset>
                    <legend className="text-xs font-black text-pink-300">{t('create.fromImageChooseGender')}</legend>
                    <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-zinc-900 p-1" role="group">
                      {(['female', 'male', 'nonbinary'] as const).map((value) => {
                        const label = value === 'female' ? t('create.female') : value === 'male' ? t('create.male') : t('create.nonbinary');
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleGenderChange(value)}
                            aria-pressed={gender === value}
                            className={`min-h-10 rounded-lg px-2 text-xs font-black transition-colors ${
                              gender === value ? 'bg-pink-600 text-white' : 'text-white/70 hover:bg-zinc-800 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="mt-5 border-t border-zinc-800 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 text-xs font-black text-pink-300">
                        <Volume2 className="h-4 w-4" />
                        <span>{t('create.voiceHint')}</span>
                      </h3>
                      {voiceLoading && <span className="text-[10px] text-zinc-400">{t('create.loadingVoices')}</span>}
                    </div>
                    <div className="mt-3 max-h-[min(48dvh,26rem)] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                      {voiceError && <p className="text-xs text-rose-300" role="alert">{voiceError}</p>}
                      {!voiceLoading && !voiceError && !createVoices.length && <p className="py-8 text-center text-xs text-zinc-500">{t('create.voiceRequired')}</p>}
                      {createVoices.map((voice) => {
                        const isSelected = selectedVoice === voice.voiceId;
                        const isPlaying = playingVoiceId === voice.voiceId;
                        const showMembershipBadge = voice.isFree === false;
                        const isVoiceLocked = !hasVoiceAccess(voice);
                        return (
                          <div
                            key={voice.voiceId}
                              className={`flex min-w-0 items-center justify-between gap-2 rounded-xl p-2 ring-1 ring-inset ${
                              isSelected ? 'bg-purple-950/70 ring-purple-500' : 'bg-zinc-900/80 ring-zinc-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectVoice(voice)}
                              className="min-h-9 min-w-0 flex-1 rounded-lg px-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                              aria-pressed={isSelected}
                            >
                              <span className="flex min-w-0 items-start gap-1.5">
                                <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{t(voice.displayNameKey)}</span>
                                {showMembershipBadge && (
                                  <span className="mt-0.5 shrink-0" role="img" aria-label={t('create.vipExclusive')} title={t('create.vipExclusive')}>
                                    <Crown className="h-3 w-3 text-amber-300" aria-hidden="true" />
                                  </span>
                                )}
                              </span>
                              {isSelected && <span className="mt-0.5 block text-[10px] font-bold text-purple-300">{t('common.selected')}</span>}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlayVoiceSample(voice)}
                              disabled={!voice.previewUrl && !isVoiceLocked}
                              className={`flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                isPlaying ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-white/85 hover:bg-zinc-700'
                              }`}
                            >
                              {isPlaying ? <Play className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5 text-purple-300" />}
                              <span>{isPlaying ? t('create.pause') : t('create.listen')}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Footer Bar */}
          <div className={`${isPage ? 'px-3 py-3' : isWorkspace ? 'px-4 py-2 lg:px-6 lg:py-2.5' : 'px-5 py-4'} bg-[#161626] border-t border-zinc-800 shrink-0 flex items-center justify-between`}>
            <button
              type="button"
              disabled={isFirstWizardQuestion}
              onClick={handlePreviousWizardQuestion}
              className={`${isWorkspace ? 'min-h-9 px-3 py-1.5 rounded-lg' : 'min-h-11 px-4 py-2.5 rounded-xl'} text-xs font-black transition-all flex items-center gap-1.5 ${
                isFirstWizardQuestion
                  ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
               <span>{t('create.back')}</span>
            </button>

            <div className="flex items-center gap-3">
              {!isFinalWizardQuestion ? (
                <button
                  type="button"
                  onClick={handleNextWizardQuestion}
                  className={`${isWorkspace ? 'min-h-9 rounded-lg px-4 py-1.5' : 'min-h-11 rounded-xl px-6 py-2.5'} flex items-center gap-1.5 bg-pink-600 text-xs font-black text-white shadow-lg shadow-pink-500/25 transition-colors hover:bg-pink-500`}
                >
                   <span>{t('create.next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

