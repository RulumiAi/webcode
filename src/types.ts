export type GenderType = 'female' | 'male' | 'nonbinary' | 'all';
export type ArtStyleType = 'anime' | 'realistic' | 'all';
export type SortOption = 'hot_month' | 'hot_week' | 'top_rated' | 'trending' | 'newest' | 'popular';
export type Locale = 'en' | 'zh-CN' | 'ja' | 'ko' | 'es' | 'pt';

export const DISPLAY_TAG_IDS = [
  'domme',
  'sub',
  'ntr',
  'seductress',
  'contrast',
  'yandere',
  'onee_san',
  'sweet_pure',
  'dominant_alpha',
  'wolf_puppy',
  'stoic_scholar',
  'loyal_guard',
  'yandere_dominant',
  'bad_boy_seduction',
  'tsundere_rival',
  'submissive_male',
] as const;

export type DisplayTagId = (typeof DISPLAY_TAG_IDS)[number];

export interface MediaPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  thumbnailLargeUrl?: string;
  previewUrl?: string;
  title: string;
  likes?: number;
  locked?: boolean;
  unlockCost?: number;
}

export interface MediaVideo {
  id: string;
  coverUrl: string;
  coverFallbackUrl?: string;
  videoUrl?: string;
  title: string;
  duration: string;
  views?: string;
  likes?: number;
  locked?: boolean;
  unlockCost?: number;
}

export interface InteractiveScenario {
  id: string;
  title: string;
  description: string;
  bgImage?: string;
  openingLine: string;
  isLocked?: boolean;
  unlockCost?: number;
  isVip?: boolean;
}

export interface CharacterFilterTag {
  slug: string;
  label: string;
}

export interface Character {
  id: string;
  name: string;
  age: number | null;
  ageStatus?: 'known' | 'secret';
  subtitle: string;
  description: string;
  displayDescription?: string;
  avatar: string;
  avatarThumbnail?: string;
  avatarThumbnailLarge?: string;
  bgImage?: string;
  author: string;
  likes: number; // e.g. 2100 -> formatted 2.1k
  chatCount: number; // e.g. 1500000 -> formatted 1.5M
  commentCount: number;
  tags: string[];
  filterTags?: CharacterFilterTag[];
  gender: GenderType | null;
  artStyle: ArtStyleType | null;
  category: string;
  isHot?: boolean;
  isNew?: boolean;
  warningBadge?: string; // e.g. "⚠️NTR救星⚠️", "🔥爆火推介", "⚡高辣剧情"
  badgeColor?: string;
  systemInstruction: string;
  greeting: string;
  voiceStyle?: string;
  isFavorite?: boolean;
  photos?: MediaPhoto[];
  videos?: MediaVideo[];
  scenarios?: InteractiveScenario[];
  creatorId?: string;
  creatorAvatar?: string;
  source?: 'api' | 'created';
  galleryLoaded?: boolean;
  rawTags?: string[];
  relationship?: string | null;
  subtitleSource?: string;
  backgroundStory?: string;
  firstMessage?: string;
  creationSelections?: Record<string, unknown>;
  stCard?: { status: 'pending' | 'complete' | 'failed'; remoteIdentifier: string | null; errorCode: string | null; errorMessage: string | null } | null;
  publicStatus?: 'notSubmitted' | 'pending' | 'approved' | 'rejected';
  publicModerationReason?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  timestamp: string;
  isVoicePlaying?: boolean;
  status?: 'streaming' | 'complete' | 'failed' | 'canceled';
  failureCode?: string | null;
}

export interface FilterState {
  searchQuery: string;
  gender: GenderType;
  artStyle: ArtStyleType;
  ageGroup: 'teen' | 'young' | 'adult' | 'mature' | 'all';
  categoryTag: string;
  sortBy: SortOption;
}

export type NavTab = 
  | 'explore' 
  | 'chat' 
  | 'create' 
  | 'generate' 
  | 'my-ai' 
  | 'feed'
  | 'community' 
  | 'help' 
  | 'safety'
  | 'referral'
  | 'profile';

export interface AppNotification {
  id: string;
  type: 'creatorNewCharacter' | 'creatorUpdate' | 'systemNotice';
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  characterId?: string;
  characterName?: string;
  characterAvatar?: string;
  actionType: 'viewCharacter' | 'chat' | 'creatorProfile' | 'none';
}
