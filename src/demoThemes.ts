import type { ContentKind } from './discoveryCatalog';
import type { Locale } from './types';

export interface DemoTheme {
  id: string;
  featured: boolean;
  nsfwOnly: boolean;
  match: string[];
  label: Record<'ja' | 'en' | 'zh-CN', string>;
}

function theme(
  id: string,
  jaLabel: string,
  en: string,
  zh: string,
  match: string[],
  options: { featured?: boolean; nsfwOnly?: boolean } = {},
): DemoTheme {
  return {
    id,
    match,
    featured: options.featured !== false,
    nsfwOnly: options.nsfwOnly === true,
    label: { ja: jaLabel, en, 'zh-CN': zh },
  };
}

/** PM §4.2 themes. Featured chips are a display count, not a selection cap. */
export const DEMO_THEMES: Record<ContentKind, DemoTheme[]> = {
  characters: [
    theme('demo_sweet', '甘い恋愛', 'Sweet romance', '甜蜜恋爱', ['demo_sweet']),
    theme('demo_daily', '日常の寄り添い', 'Everyday company', '日常陪伴', ['demo_daily']),
    theme('demo_slow', 'ゆっくり育つ関係', 'Slow-growing bond', '慢热关系', ['demo_slow']),
    theme('demo_fantasy', 'ファンタジーRP', 'Fantasy roleplay', '奇幻角色扮演', ['demo_fantasy']),
    theme('demo_heal', '癒やしの相談', 'Comforting talk', '治愈倾诉', ['demo_heal']),
    theme('demo_bicker', 'ケンカップル', 'Quarreling sweethearts', '欢喜冤家', ['demo_bicker']),
    theme('demo_late', '深夜トーク', 'Late-night talk', '深夜谈心', ['demo_late'], { featured: false }),
    theme('demo_gap', 'すれ違い', 'Missed timing', '擦肩错过', ['demo_gap'], { featured: false }),
    theme('demo_share', '同居もの', 'Sharing a home', '同居日常', ['demo_share'], { featured: false }),
    theme('demo_adult', '成人向け・合意の仮例', 'Consensual adult sample', '成人合意示例', ['demo_adult'], { featured: false, nsfwOnly: true }),
  ],
  stories: [
    theme('romance', '恋愛', 'Romance', '恋爱', ['romance']),
    theme('fantasy', 'ファンタジー', 'Fantasy', '奇幻', ['fantasy']),
    theme('mystery', 'サスペンス', 'Suspense', '悬疑', ['mystery']),
    theme('adventure', '冒険', 'Adventure', '冒险', ['adventure']),
    theme('urban_daily', '都会の日常', 'City everyday', '都市日常', ['urban', 'daily', 'cozy']),
    theme('comedy', 'コメディ', 'Comedy', '喜剧', ['comedy']),
    theme('healing', '癒やし', 'Comfort', '治愈', ['healing'], { featured: false }),
    theme('action', 'アクション', 'Action', '动作', ['action'], { featured: false }),
  ],
  comics: [
    theme('romance', '恋愛', 'Romance', '恋爱', ['romance']),
    theme('fantasy_adventure', 'ファンタジー冒険', 'Fantasy adventure', '奇幻冒险', ['fantasy', 'adventure']),
    theme('daily_4koma', '日常4コマ', 'Everyday four-panel', '日常四格', ['daily', 'comedy']),
    theme('action', 'アクション', 'Action', '动作', ['action']),
    theme('mystery', 'サスペンス', 'Suspense', '悬疑', ['mystery']),
    theme('healing', '癒やし', 'Comfort', '治愈', ['healing']),
    theme('drama', 'ドラマ', 'Drama', '剧情', ['drama'], { featured: false }),
  ],
  photos: [
    theme('portrait', '人物ポートレート', 'Portrait', '人物肖像', ['portrait']),
    theme('fashion', 'ファッション', 'Fashion styling', '时尚穿搭', ['fashion']),
    theme('costume', 'ロールプレイ', 'Role costume', '角色扮演', ['costume']),
    theme('fantasy_look', 'ファンタジーな装い', 'Fantasy styling', '奇幻造型', ['fantasy']),
    theme('home_daily', 'おうちの日常', 'At-home everyday', '居家日常', ['daily', 'cozy', 'cafe']),
    theme('couple', '二人の写真', 'Photo of two', '双人合影', ['couple']),
    theme('night_mood', '夜の雰囲気', 'Night mood', '夜间氛围', ['night'], { featured: false }),
  ],
  videos: [
    theme('short_story', 'ストーリー短編', 'Story short', '剧情短片', ['short_story', 'drama']),
    theme('romance_date', 'ロマンチックなデート', 'Romantic date', '浪漫约会', ['romance_date', 'romance']),
    theme('performance', '人物の演技', 'Character performance', '人物演绎', ['performance']),
    theme('dance', 'ダンス', 'Dance', '舞蹈', ['dance']),
    theme('fantasy_scene', 'ファンタジーシーン', 'Fantasy scene', '奇幻场景', ['fantasy_scene', 'fantasy']),
    theme('mood_short', 'ムード短編', 'Mood short', '氛围短片', ['mood_short', 'atmosphere']),
    theme('cafe_clip', 'カフェのひとコマ', 'Café moment', '咖啡馆片段', ['cafe'], { featured: false }),
  ],
};

const localeKey = (locale: Locale): 'ja' | 'en' | 'zh-CN' => (
  locale === 'ja' || locale === 'zh-CN' ? locale : 'en'
);

export function demoThemeLabel(id: string, locale: Locale, kind?: ContentKind) {
  const pools = kind ? [DEMO_THEMES[kind]] : Object.values(DEMO_THEMES);
  for (const list of pools) {
    const hit = list.find((item) => item.id === id);
    if (hit) return hit.label[localeKey(locale)];
  }
  return '';
}

export function parseThemeSelection(value: string) {
  return value.split(',').map((part) => part.trim()).filter((part) => part && part !== 'all');
}

/** 「すべて」 is mutually exclusive with specific themes. Specific themes combine with OR. */
export function toggleThemeSelection(current: string, id: string) {
  if (id === 'all') return 'all';
  const selected = new Set(parseThemeSelection(current));
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  return selected.size ? [...selected].join(',') : 'all';
}

export function selectionMatches(genres: string[], selected: string, themes: DemoTheme[]) {
  const want = parseThemeSelection(selected);
  if (!want.length) return true;
  const genreSet = new Set(genres);
  return want.some((id) => {
    const themeItem = themes.find((item) => item.id === id);
    if (!themeItem) return genreSet.has(id);
    return themeItem.match.some((slug) => genreSet.has(slug)) || genreSet.has(id);
  });
}

export function isNsfwThemeId(id: string) {
  return Object.values(DEMO_THEMES).some((list) => list.some((item) => item.id === id && item.nsfwOnly));
}

export function stripNsfwThemes(selection: string) {
  const next = parseThemeSelection(selection).filter((id) => !isNsfwThemeId(id));
  return next.length ? next.join(',') : 'all';
}

export function visibleDemoThemes(kind: ContentKind, options: { mature: boolean; hasContent: (themeItem: DemoTheme) => boolean }) {
  return DEMO_THEMES[kind].filter((themeItem) => {
    if (themeItem.nsfwOnly && !options.mature) return false;
    return options.hasContent(themeItem);
  });
}

export function splitThemeChips(themes: DemoTheme[]) {
  const featured = themes.filter((item) => item.featured);
  const extra = themes.filter((item) => !item.featured);
  const primary = featured.slice(0, 8);
  if (primary.length < 6) primary.push(...extra.splice(0, 6 - primary.length));
  const primaryIds = new Set(primary.map((item) => item.id));
  return { primary, extra: [...extra, ...featured.filter((item) => !primaryIds.has(item.id))] };
}

const ADULT_QUERY_BITS = ['demo_adult', '18+', '成人', '茜', '夜のカフェ', '月のテラス', '紫乃', '花灯り', '悠真', 'ジャズの夜', '黄昏の海', '星のギャラリー', 'akane', 'velvet evening', 'moonlit terrace', 'lantern walk', 'midnight jazz', 'sunset coast', 'starlit'];

export function isSensitiveDemoQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  return ADULT_QUERY_BITS.some((bit) => normalized.includes(bit.toLowerCase()));
}
