import type { CharacterFilterTag, Locale } from './types';
import { demoThemeLabel } from './demoThemes';

export const CHARACTER_FILTER_TAG_SLUGS = [
  'theme_daily_life', 'theme_dark_romance', 'theme_school', 'theme_coming_of_age',
  'theme_conflict', 'theme_family', 'theme_career', 'theme_betrayal', 'theme_supernatural',
  'theme_friendship', 'theme_horror', 'theme_crime',
  'personality_secretive', 'personality_flirtatious', 'personality_emotional',
  'personality_arrogant', 'personality_teasing', 'personality_violent', 'personality_dominant',
  'personality_jealous', 'personality_kind', 'personality_gentle', 'personality_strong_willed',
  'personality_introverted', 'personality_hostile', 'personality_strict', 'personality_intelligent',
  'personality_friendly',
  'user_relationship_boyfriend', 'user_relationship_potential_love', 'user_relationship_friend',
  'user_relationship_romantic_partner', 'user_relationship_stranger', 'user_relationship_enemy',
  'user_relationship_sick_lover', 'user_relationship_protector', 'user_relationship_classmate',
  'user_relationship_rival', 'user_relationship_kidnapper', 'user_relationship_hostile',
  'identity_student', 'identity_young_adult', 'identity_husband', 'identity_mafia',
  'identity_wealthy', 'identity_ceo', 'identity_criminal', 'identity_aristocrat',
  'identity_adult', 'identity_teenager', 'identity_leader', 'identity_idol', 'identity_worker',
  'identity_heir',
] as const;

export const POPULAR_CHARACTER_FILTER_TAG_SLUGS = [
  'personality_flirtatious',
  'personality_dominant',
  'personality_secretive',
  'identity_ceo',
  'identity_student',
  'user_relationship_boyfriend',
  'user_relationship_romantic_partner',
  'user_relationship_rival',
  'theme_daily_life',
  'theme_dark_romance',
] as const;

export const CHARACTER_FILTER_TAG_GROUPS = [
  { id: 'personality', prefix: 'personality_', translationKey: 'tags.group.personality' },
  { id: 'identity', prefix: 'identity_', translationKey: 'tags.group.identity' },
  { id: 'relationship', prefix: 'user_relationship_', translationKey: 'tags.group.relationship' },
  { id: 'interaction', prefix: 'theme_', translationKey: 'tags.group.interaction' },
] as const;

export type CharacterFilterTagGroup = (typeof CHARACTER_FILTER_TAG_GROUPS)[number]['id'];

const characterFilterTagSlugSet = new Set<string>(CHARACTER_FILTER_TAG_SLUGS);

export function getPopularCharacterFilterTags(tags: CharacterFilterTag[]) {
  const bySlug = new Map(tags.map((tag) => [tag.slug, tag]));
  return POPULAR_CHARACTER_FILTER_TAG_SLUGS.map((slug) => bySlug.get(slug) || { slug, label: '' });
}

export function groupCharacterFilterTags(tags: CharacterFilterTag[]) {
  const groups = Object.fromEntries(
    CHARACTER_FILTER_TAG_GROUPS.map(({ id }) => [id, [] as CharacterFilterTag[]]),
  ) as Record<CharacterFilterTagGroup, CharacterFilterTag[]>;
  const seen = new Set<string>();
  tags.forEach((tag) => {
    if (seen.has(tag.slug)) return;
    const group = CHARACTER_FILTER_TAG_GROUPS.find(({ prefix }) => tag.slug.startsWith(prefix));
    if (!group) return;
    groups[group.id].push(tag);
    seen.add(tag.slug);
  });
  return groups;
}

export function isCharacterFilterTagSlug(value: string): value is (typeof CHARACTER_FILTER_TAG_SLUGS)[number] {
  return characterFilterTagSlugSet.has(value);
}

export function getCharacterFilterTagTranslationKey(slug: string) {
  return `tags.filter.${slug}`;
}

export function formatFilterTagSlug(slug: string) {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ') || slug;
}

export function getCharacterFilterTagLabel(
  tag: CharacterFilterTag,
  locale: Locale,
  translate: (key: string) => string,
) {
  const demoLabel = demoThemeLabel(tag.slug, locale);
  if (demoLabel) return demoLabel;
  if (isCharacterFilterTagSlug(tag.slug)) return translate(getCharacterFilterTagTranslationKey(tag.slug));
  if (locale === 'zh-CN') return tag.label?.trim() || tag.slug;
  return formatFilterTagSlug(tag.slug);
}

export function getCharacterFilterTagLabels(
  tags: CharacterFilterTag[],
  locale: Locale,
  translate: (key: string) => string,
) {
  return tags.map((tag) => getCharacterFilterTagLabel(tag, locale, translate));
}
