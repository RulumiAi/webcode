import type { GenderType, Locale } from '../types';
import {
  CREATE_TAG_GROUPS,
  CREATE_TAG_TRANSLATIONS,
  CREATE_TAG_VALUES,
  createTagTranslationKey,
  type CreateTagGroup,
} from './createCharacterTagCatalog';

export type CreateTraitGroup = CreateTagGroup;
export type CreatePresetFamily = 'shared';

export interface CreateTraitPreset {
  id: string;
  canonical: string;
  group: CreateTraitGroup;
  index: number;
}

export interface CreateArchetypePreset {
  id: string;
  canonical: string;
  description: string;
}

export interface CreateCharacterPresetSet {
  family: CreatePresetFamily;
  appearance_and_body: CreateTraitPreset[];
  sexual_personality: CreateTraitPreset[];
  role_and_fantasy: CreateTraitPreset[];
  kinks_and_play: CreateTraitPreset[];
  archetypes: CreateArchetypePreset[];
}

export interface CreateCharacterPresetSelectionIds {
  appearance_and_body: string[];
  sexual_personality: string[];
  role_and_fantasy: string[];
  kinks_and_play: string[];
  adultStyle: string;
}

const makeTraitPresets = (group: CreateTraitGroup): CreateTraitPreset[] =>
  CREATE_TAG_VALUES[group].map((canonical, index) => ({
    id: `shared-${group}-${String(index + 1).padStart(2, '0')}`,
    canonical,
    group,
    index,
  }));

const makeArchetypePresets = (values: Array<[canonical: string, description: string]>): CreateArchetypePreset[] =>
  values.map(([canonical, description], index) => ({
    id: `shared-archetype-${String(index + 1).padStart(2, '0')}`,
    canonical,
    description,
  }));

export const SHARED_CREATE_CHARACTER_PRESETS: CreateCharacterPresetSet = {
  family: 'shared',
  appearance_and_body: makeTraitPresets('appearance_and_body'),
  sexual_personality: makeTraitPresets('sexual_personality'),
  role_and_fantasy: makeTraitPresets('role_and_fantasy'),
  kinks_and_play: makeTraitPresets('kinks_and_play'),
  archetypes: makeArchetypePresets([
    ['强势掌控（Dominant）', '高傲主动与节奏掌控，享受主导局势与支配张力'],
    ['顺从依恋（Submissive）', '温柔依赖与完全沉溺，渴望被你全心牵引与宠溺独占'],
    ['嫉妒拉扯（Jealous Tension）', '充满情感醋意与禁忌拉扯，因强烈占有欲而情绪波澜'],
    ['魅惑挑逗（Seductive）', '举止眼神皆是勾人动情，主动近身与耳语撩拨人心'],
    ['外冷内热（Cold Exterior）', '平日高冷严谨难以靠近，唯有独处时为你失控破防'],
    ['执念偏执（Obsessive）', '深情偏执与极端独占：“你的眼里只能有我一个人”'],
    ['脆弱反差（Vulnerable）', '藏在坚强外的脆弱娇柔，只在你面前卸下心理防备'],
    ['忠诚奉献（Devoted）', '毫无保留的真挚倾心，愿为你奉献一切与无微不至'],
  ]),
};

export const FEMALE_CREATE_CHARACTER_PRESETS = SHARED_CREATE_CHARACTER_PRESETS;
export const MALE_CREATE_CHARACTER_PRESETS = SHARED_CREATE_CHARACTER_PRESETS;
export const getCreateCharacterPresets = (_gender: GenderType): CreateCharacterPresetSet => SHARED_CREATE_CHARACTER_PRESETS;
export const shouldResetCreateCharacterPresetSelections = (_currentGender: GenderType, _nextGender: GenderType) => false;

export const getRandomCreateCharacterAge = (random: () => number = Math.random): number => {
  const sample = Math.min(1, Math.max(0, random()));
  return Math.min(35, 18 + Math.floor(sample * 18));
};

export const getDefaultCreateCharacterPresetSelections = (gender: GenderType): CreateCharacterPresetSelectionIds => {
  const presets = getCreateCharacterPresets(gender);
  return {
    appearance_and_body: [presets.appearance_and_body[0].id],
    sexual_personality: [presets.sexual_personality[0].id],
    role_and_fantasy: [presets.role_and_fantasy[0].id],
    kinks_and_play: [presets.kinks_and_play[0].id],
    adultStyle: presets.archetypes[0].id,
  };
};

const selectedCanonicalValues = (presets: CreateTraitPreset[], selectedIds: string[]) => presets
  .filter((preset) => selectedIds.includes(preset.id))
  .map((preset) => preset.canonical);

export const serializeCreateCharacterPresetSelections = (
  gender: GenderType,
  selected: CreateCharacterPresetSelectionIds,
) => {
  const presets = getCreateCharacterPresets(gender);
  const archetype = presets.archetypes.find((preset) => preset.id === selected.adultStyle);
  return {
    appearance_and_body: selectedCanonicalValues(presets.appearance_and_body, selected.appearance_and_body),
    sexual_personality: selectedCanonicalValues(presets.sexual_personality, selected.sexual_personality),
    role_and_fantasy: selectedCanonicalValues(presets.role_and_fantasy, selected.role_and_fantasy),
    kinks_and_play: selectedCanonicalValues(presets.kinks_and_play, selected.kinks_and_play),
    adultStyles: archetype ? [archetype.canonical] : [],
  };
};

export const getCreateTraitTranslationKey = (preset: CreateTraitPreset) =>
  createTagTranslationKey(preset.group, preset.index);

export const getCreateArchetypeTranslationKey = (
  preset: CreateArchetypePreset,
  field: 'name' | 'desc',
) => `create.preset.archetype.${preset.id}.${field}`;

type ArchetypeLocalization = { names: string[]; descriptions: string[] };

const ARCHETYPE_LOCALIZATIONS: Record<Locale, ArchetypeLocalization> = {
  en: {
    names: ['Dominant', 'Submissive', 'Jealous Tension', 'Seductive', 'Cold Exterior', 'Obsessive', 'Vulnerable', 'Devoted'],
    descriptions: [
      'Takes the lead with confident control of the pace and enjoys the tension of command.',
      'Gentle and deeply devoted, longing to be guided by you and cherished exclusively.',
      'Full of jealousy and forbidden push-pull, with strong possessiveness stirring every emotion.',
      'Every gesture and glance is alluring, drawing close to tease your heart with a whisper.',
      'Cool, rigorous, and hard to approach in public, but only lets down their guard with you in private.',
      'Deeply loving and intensely possessive: “I want to be the only one in your eyes.”',
      'Hides a soft vulnerability behind strength and lowers every guard only in front of you.',
      'Offers sincere devotion without reserve and wants to care for you in every detail.',
    ],
  },
  'zh-CN': {
    names: ['强势掌控（Dominant）', '顺从依恋（Submissive）', '嫉妒拉扯（Jealous Tension）', '魅惑挑逗（Seductive）', '外冷内热（Cold Exterior）', '执念偏执（Obsessive）', '脆弱反差（Vulnerable）', '忠诚奉献（Devoted）'],
    descriptions: ['高傲主动与节奏掌控，享受主导局势与支配张力', '温柔依赖与完全沉溺，渴望被你全心牵引与宠溺独占', '充满情感醋意与禁忌拉扯，因强烈占有欲而情绪波澜', '举止眼神皆是勾人动情，主动近身与耳语撩拨人心', '平日高冷严谨难以靠近，唯有独处时为你失控破防', '深情偏执与极端独占：“你的眼里只能有我一个人”', '藏在坚强外的脆弱娇柔，只在你面前卸下心理防备', '毫无保留的真挚倾心，愿为你奉献一切与无微不至'],
  },
  ja: {
    names: ['主導的（Dominant）', '従順で甘えん坊（Submissive）', '嫉妬の駆け引き（Jealous Tension）', '魅惑的な誘惑（Seductive）', '外は冷たく内は熱い（Cold Exterior）', '執着的（Obsessive）', '脆さとのギャップ（Vulnerable）', '献身的（Devoted）'],
    descriptions: ['自信を持って流れを導き、主導権と支配の緊張感を楽しむ', '優しく寄り添い、あなたに導かれ独占的に大切にされることを望む', '嫉妬と禁断の駆け引きに満ち、強い独占欲が感情を揺らす', '仕草も視線も人を惹きつけ、耳元の囁きで心を揺らす', '普段は冷たく厳しいが、二人きりではあなたの前でだけ心を許す', '深い愛と極端な独占欲を抱く', '強さの奥の弱さを隠し、あなたの前でだけ心の防御を解く', 'まっすぐな真心であなたのために尽くす'],
  },
  ko: {
    names: ['주도형 (Dominant)', '순종형 (Submissive)', '질투의 긴장감 (Jealous Tension)', '매혹적 유혹 (Seductive)', '겉은 차갑고 속은 뜨거움 (Cold Exterior)', '집착형 (Obsessive)', '여린 반전 (Vulnerable)', '헌신형 (Devoted)'],
    descriptions: ['당당하게 흐름을 이끌며 주도권과 지배에서 오는 긴장감을 즐긴다', '다정하게 의지하고 당신에게 이끌리며 온전히 아낌받길 바란다', '질투와 금지된 밀당이 가득하고 강한 소유욕이 감정을 흔든다', '행동과 눈빛 모두가 마음을 끌며 귓속말로 설레게 한다', '평소에는 차갑고 엄격하지만 둘만 있을 때 당신 앞에서만 무너진다', '깊은 사랑과 극단적인 독점욕을 품는다', '강한 모습 뒤의 여린 면을 숨기고 당신 앞에서만 경계를 내린다', '진심을 아낌없이 바치며 세심하게 보살핀다'],
  },
  es: {
    names: ['Dominante', 'Sumiso', 'Tensión de celos', 'Seductor', 'Frío por fuera', 'Obsesivo', 'Vulnerable', 'Devoto'],
    descriptions: ['Toma la iniciativa con seguridad y disfruta de la tensión del mando', 'Desea dejarse guiar por ti y ser querido en exclusiva', 'Los celos y la tensión prohibida agitan sus emociones', 'Cada gesto y mirada atrae y provoca tu corazón', 'Parece frío en público, pero solo baja la guardia contigo', 'Ama profundamente y posee una intensidad extrema', 'Oculta una vulnerabilidad suave tras su fortaleza', 'Se entrega con sinceridad y quiere cuidarte en cada detalle'],
  },
  pt: {
    names: ['Dominante', 'Submisso', 'Tensão de ciúme', 'Sedutor', 'Frio por fora', 'Obsessivo', 'Vulnerável', 'Devotado'],
    descriptions: ['Assume a liderança com confiança e aprecia a tensão do comando', 'Deseja ser guiado por você e cuidado com exclusividade', 'Ciúme e tensão proibida agitam cada emoção', 'Cada gesto e olhar atrai e provoca seu coração', 'Em público parece frio, mas baixa a guarda com você', 'Ama profundamente e tem intensidade extrema', 'Esconde uma vulnerabilidade suave por trás da força', 'Entrega-se com sinceridade e cuida de você em cada detalhe'],
  },
};

const buildPresetMessages = (locale: Locale): Record<string, string> => {
  const messages: Record<string, string> = {};
  for (const group of CREATE_TAG_GROUPS) {
    CREATE_TAG_VALUES[group].forEach((_value, index) => {
      messages[createTagTranslationKey(group, index)] = CREATE_TAG_TRANSLATIONS[locale][group][index];
    });
  }
  SHARED_CREATE_CHARACTER_PRESETS.archetypes.forEach((preset, index) => {
    messages[getCreateArchetypeTranslationKey(preset, 'name')] = ARCHETYPE_LOCALIZATIONS[locale].names[index];
    messages[getCreateArchetypeTranslationKey(preset, 'desc')] = ARCHETYPE_LOCALIZATIONS[locale].descriptions[index];
  });
  return messages;
};

export const CREATE_CHARACTER_PRESET_MESSAGES: Record<Locale, Record<string, string>> = Object.fromEntries(
  (['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'] as Locale[]).map((locale) => [locale, buildPresetMessages(locale)]),
) as Record<Locale, Record<string, string>>;

export interface CreateStepFourDisplayTag {
  id: string;
  label: string;
}

const STEP_FOUR_OBJECT_FIELDS = ['canonical', 'id', 'name', 'title', 'value', 'label'] as const;

const selectionToken = (item: unknown) => {
  if (typeof item === 'string') return item.trim();
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  for (const field of STEP_FOUR_OBJECT_FIELDS) {
    if (typeof record[field] === 'string' && record[field].trim()) return record[field].trim();
  }
  return '';
};

export const getCreateStepFourDisplayTags = (
  selections: Record<string, unknown> | undefined,
  translate: (key: string) => string,
): CreateStepFourDisplayTag[] => {
  if (!selections) return [];
  const result: CreateStepFourDisplayTag[] = [];
  const seen = new Set<string>();
  for (const group of CREATE_TAG_GROUPS) {
    const raw = selections[group];
    const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    for (const item of values) {
      const token = selectionToken(item);
      if (!token) continue;
      const preset = SHARED_CREATE_CHARACTER_PRESETS[group].find((candidate) => candidate.id === token || candidate.canonical === token);
      const canonical = preset?.canonical || token;
      const dedupeKey = canonical.normalize('NFKC').toLocaleLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const translationKey = preset ? getCreateTraitTranslationKey(preset) : '';
      const translated = translationKey ? translate(translationKey) : canonical;
      result.push({ id: preset?.id || `${group}:${canonical}`, label: translated && translated !== translationKey ? translated : canonical });
    }
  }
  return result;
};

export const summarizeCreateStepFourDisplayTags = (tags: CreateStepFourDisplayTag[], limit = 4) => {
  const visibleLimit = Math.max(0, Math.trunc(limit));
  return { visible: tags.slice(0, visibleLimit), remaining: Math.max(0, tags.length - visibleLimit) };
};
