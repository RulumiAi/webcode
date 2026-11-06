import type { ArtStyleType, GenderType, Locale } from '../types';
import {
  getCreateCharacterOptionLabel,
  normalizeCreateCharacterGender,
  type CreateCharacterOptionCategory,
} from '../data/createCharacterAssets';
import {
  getCreateArchetypeTranslationKey,
  getCreateCharacterPresets,
  getCreateStepFourDisplayTags,
} from '../data/createCharacterPresets';
import { CREATE_TAG_GROUPS, type CreateTagGroup } from '../data/createCharacterTagCatalog';

export type CreateFlowTranslate = (key: string) => string;

export interface CreateCharacterShowcaseTagInput {
  locale: Locale;
  gender: GenderType;
  artStyle: ArtStyleType;
  race: string;
  species: string;
  chest: string;
  hip: string;
  creationSelections?: Record<string, unknown>;
  rawTags?: string[];
}

export interface CreateCharacterPromptSelections {
  artStyle: ArtStyleType;
  gender: GenderType;
  name: string;
  age: number;
  race: string;
  species: string;
  skin: string;
  eye: string;
  face: string;
  hair: string;
  hairColor: string;
  body: string;
  chest: string;
  hip: string;
  appearance_and_body: string[];
  sexual_personality: string[];
  role_and_fantasy: string[];
  kinks_and_play: string[];
  archetype: string;
}

export type CreateCharacterPromptTone = 'plain' | 'identity' | 'lineage' | 'appearance' | 'body' | 'profile' | 'story';

export interface CreateCharacterPromptSegment {
  text: string;
  tone: CreateCharacterPromptTone;
}

export interface CreateCharacterPromptDocument {
  text: string;
  segments: CreateCharacterPromptSegment[];
}

const CREATE_FLOW_ERROR_KEYS: Record<string, string> = {
  NAME_TAKEN: 'create.nameTaken',
  VALIDATION_ERROR: 'create.errorValidation',
  CHARACTER_UNAVAILABLE: 'create.errorCharacterUnavailable',
  SOURCE_GENERATION_UNAVAILABLE: 'create.errorSourceGenerationUnavailable',
  SOURCE_MEDIA_UNAVAILABLE: 'create.errorSourceMediaUnavailable',
  SOURCE_MEDIA_TOO_SMALL: 'create.errorSourceMediaTooSmall',
  CONFLICT: 'create.errorConflict',
  INSUFFICIENT_CREDITS: 'create.errorInsufficientCredits',
  RATE_LIMITED: 'create.errorRateLimited',
  UPSTREAM_TIMEOUT: 'create.errorUpstreamTimeout',
  REQUEST_TIMEOUT: 'create.errorUpstreamTimeout',
  NETWORK_ERROR: 'create.errorUpstreamUnavailable',
  UPSTREAM_UNAVAILABLE: 'create.errorUpstreamUnavailable',
  UPSTREAM_INVALID_RESPONSE: 'create.errorUpstreamInvalidResponse',
  UPSTREAM_REJECTED: 'create.errorUpstreamRejected',
  UPSTREAM_GENERATION_FAILED: 'create.errorUpstreamGenerationFailed',
  UPSTREAM_MEDIA_UNAVAILABLE: 'create.errorUpstreamMediaUnavailable',
  UPSTREAM_SENSITIVE_CONTENT: 'create.errorSensitiveContent',
};

const optionLabel = (
  locale: Locale,
  gender: GenderType,
  category: CreateCharacterOptionCategory,
  id: string,
) => getCreateCharacterOptionLabel(locale, gender, category, id);

const listLocale = (locale: Locale) => locale === 'zh-CN' ? 'zh-CN' : locale;

const joinValues = (locale: Locale, values: string[], fallback: string) => {
  const unique = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  if (!unique.length) return fallback;
  if (unique.length === 1) return unique[0];
  return new Intl.ListFormat(listLocale(locale), { style: 'short', type: 'conjunction' }).format(unique);
};

export function buildCreateCharacterImagePromptDocument(
  locale: Locale,
  translate: CreateFlowTranslate,
  selections: CreateCharacterPromptSelections,
): CreateCharacterPromptDocument {
  const gender = normalizeCreateCharacterGender(selections.gender);
  const fallback = translate('create.prompt.unspecified');
  const lineage = selections.species && selections.species !== 'human'
    ? translate(`create.preset.species.${selections.species}.name`)
    : optionLabel(locale, gender, 'race', selections.race) || fallback;
  const values: Record<string, CreateCharacterPromptSegment> = {
    style: {
      text: translate(`create.prompt.style.${selections.artStyle === 'realistic' ? 'realistic' : 'anime'}`),
      tone: 'identity',
    },
    gender: { text: translate(`create.prompt.gender.${gender}`), tone: 'identity' },
    name: { text: selections.name.trim() || translate('create.unnamedCharacter'), tone: 'identity' },
    age: { text: String(Math.max(18, Number(selections.age) || 18)), tone: 'identity' },
    lineage: { text: lineage, tone: 'lineage' },
    skin: { text: optionLabel(locale, gender, 'skin', selections.skin), tone: 'appearance' },
    eye: { text: optionLabel(locale, gender, 'eye', selections.eye), tone: 'appearance' },
    face: { text: optionLabel(locale, gender, 'face', selections.face), tone: 'appearance' },
    hair: { text: optionLabel(locale, gender, 'hair', selections.hair), tone: 'appearance' },
    hairColor: { text: translate(`create.preset.hairColor.${selections.hairColor}.label`), tone: 'appearance' },
    body: { text: optionLabel(locale, gender, 'body', selections.body), tone: 'body' },
    chest: { text: optionLabel(locale, gender, 'chest', selections.chest), tone: 'body' },
    hip: { text: optionLabel(locale, gender, 'hip', selections.hip), tone: 'body' },
    appearance_and_body: { text: joinValues(locale, selections.appearance_and_body, fallback), tone: 'body' },
    sexual_personality: { text: joinValues(locale, selections.sexual_personality, fallback), tone: 'profile' },
    role_and_fantasy: { text: joinValues(locale, selections.role_and_fantasy, fallback), tone: 'profile' },
    kinks_and_play: { text: joinValues(locale, selections.kinks_and_play, fallback), tone: 'story' },
    archetype: { text: selections.archetype.trim() || fallback, tone: 'story' },
    quality: { text: translate('create.prompt.quality'), tone: 'plain' },
  };
  const template = translate('create.prompt.template');
  const segments: CreateCharacterPromptSegment[] = [];
  const tokenPattern = /\{\{([A-Za-z_]+)\}\}/g;
  let cursor = 0;
  for (const match of template.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: template.slice(cursor, index), tone: 'plain' });
    const value = values[match[1]];
    segments.push(value || { text: match[0], tone: 'plain' });
    cursor = index + match[0].length;
  }
  if (cursor < template.length) segments.push({ text: template.slice(cursor), tone: 'plain' });
  return { text: segments.map((segment) => segment.text).join(''), segments };
}

export function buildCreateCharacterImagePrompt(
  locale: Locale,
  translate: CreateFlowTranslate,
  selections: CreateCharacterPromptSelections,
) {
  return buildCreateCharacterImagePromptDocument(locale, translate, selections).text;
}

const showcaseToken = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const showcaseKey = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase();

const localizedValue = (translate: CreateFlowTranslate, key: string, fallback: string) => {
  const value = translate(key);
  return value && value !== key ? value : fallback;
};

/** Rebuild success-card tags from IDs/canonical values without leaking another locale. */
export function getCreateCharacterShowcaseTags(
  input: CreateCharacterShowcaseTagInput,
  translate: CreateFlowTranslate,
  fallbackPresetTags: string[] = [],
) {
  const gender = normalizeCreateCharacterGender(input.gender);
  const selections = input.creationSelections || {};
  const species = showcaseToken(selections.species) || input.species;
  const race = showcaseToken(selections.race) || input.race;
  const chest = showcaseToken(selections.chestSize) || showcaseToken(selections.chest) || input.chest;
  const hip = showcaseToken(selections.hipSize) || showcaseToken(selections.hip) || input.hip;
  const lineage = species && species !== 'human'
    ? localizedValue(translate, `create.preset.species.${species}.name`, species)
    : optionLabel(input.locale, gender, 'race', race);
  const semantic = [
    localizedValue(translate, `create.prompt.style.${input.artStyle === 'realistic' ? 'realistic' : 'anime'}`, input.artStyle),
    lineage,
    optionLabel(input.locale, gender, 'chest', chest),
    optionLabel(input.locale, gender, 'hip', hip),
  ].filter(Boolean);

  const stepFour = getCreateStepFourDisplayTags(selections, translate);
  const presets = getCreateCharacterPresets(input.gender);
  const adultStyles = Array.isArray(selections.adultStyles)
    ? selections.adultStyles
    : selections.adultStyles == null ? [] : [selections.adultStyles];
  const archetypeFallback = adultStyles.map((value) => {
    const token = showcaseToken(value);
    const preset = presets.archetypes.find((item) => item.id === token || item.canonical === token);
    return preset
      ? localizedValue(translate, getCreateArchetypeTranslationKey(preset, 'name'), preset.canonical)
      : '';
  }).filter(Boolean);
  const knownPresetLabels: string[] = [];
  const knownPresetIds = new Set<string>();
  const aliases = new Map<string, string>();
  const addAlias = (alias: unknown, label: string) => {
    const token = showcaseToken(alias);
    if (token && label) aliases.set(showcaseKey(token), label);
  };
  semantic.forEach((label) => addAlias(label, label));
  addAlias(input.artStyle, semantic[0] || input.artStyle);
  addAlias(race, lineage);
  addAlias(species, lineage);
  addAlias(chest, semantic[2] || chest);
  addAlias(hip, semantic[3] || hip);
  addAlias('White', lineage);
  addAlias('white', lineage);
  addAlias('flat chest', semantic[2] || chest);
  addAlias('small hips', semantic[3] || hip);

  const presetGroups: CreateTagGroup[] = [...CREATE_TAG_GROUPS];
  presetGroups.forEach((group) => {
    const raw = selections[group];
    const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    const localized = getCreateStepFourDisplayTags({ [group]: values }, translate);
    localized.forEach((tag) => {
      if (!tag.id.startsWith(`${group}:`)) {
        knownPresetLabels.push(tag.label);
        knownPresetIds.add(tag.id);
      }
    });
    values.forEach((value, index) => addAlias(value, localized[index]?.label || ''));
  });
  adultStyles.forEach((value, index) => addAlias(value, archetypeFallback[index] || ''));
  stepFour.forEach((tag) => {
    if (knownPresetIds.has(tag.id)) addAlias(tag.id, tag.label);
  });
  const presetFallback = [...knownPresetLabels, ...archetypeFallback, ...fallbackPresetTags];

  const resolved = (input.rawTags || []).map((tag) => aliases.get(showcaseKey(tag)) || '').filter(Boolean);
  const source = [...resolved, ...semantic, ...presetFallback];
  const unique = Array.from(new Set(source.filter(Boolean)));
  return unique.slice(0, 7);
}

export function localizeCreateFlowErrorCode(
  code: string | null | undefined,
  translate: CreateFlowTranslate,
  fallbackKey: string,
) {
  return translate((code && CREATE_FLOW_ERROR_KEYS[code]) || fallbackKey);
}

export function localizeCreateFlowError(
  reason: unknown,
  translate: CreateFlowTranslate,
  fallbackKey: string,
) {
  const code = reason && typeof reason === 'object' && 'code' in reason && typeof reason.code === 'string'
    ? reason.code
    : null;
  return localizeCreateFlowErrorCode(code, translate, fallbackKey);
}
