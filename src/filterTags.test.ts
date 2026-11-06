import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { translate } from './i18n';
import {
  CHARACTER_FILTER_TAG_GROUPS,
  CHARACTER_FILTER_TAG_SLUGS,
  POPULAR_CHARACTER_FILTER_TAG_SLUGS,
  getCharacterFilterTagLabel,
  getCharacterFilterTagLabels,
  getCharacterFilterTagTranslationKey,
  getPopularCharacterFilterTags,
  groupCharacterFilterTags,
} from './filterTags';

const locales = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'] as const;

test('localizes every stable Character Filter Tag in every supported locale', () => {
  const backendSource = readFileSync(new URL('../../content/filter_tags.py', import.meta.url), 'utf8');
  const backendSlugs = [...backendSource.matchAll(/^    \("([^"]+)", "(?:theme|personality|user_relationship|identity)",/gm)]
    .map((match) => match[1]);
  assert.deepEqual([...CHARACTER_FILTER_TAG_SLUGS], backendSlugs);

  for (const locale of locales) {
    const labels = CHARACTER_FILTER_TAG_SLUGS.map((slug) => (
      translate(locale, getCharacterFilterTagTranslationKey(slug))
    ));

    assert.equal(labels.length, CHARACTER_FILTER_TAG_SLUGS.length);
    labels.forEach((label, index) => {
      assert.ok(label.trim());
      assert.notEqual(label, getCharacterFilterTagTranslationKey(CHARACTER_FILTER_TAG_SLUGS[index]));
    });
  }
});

test('known tags ignore the Chinese API label outside the Chinese locale', () => {
  for (const locale of ['en', 'ja', 'ko', 'es', 'pt'] as const) {
    for (const slug of CHARACTER_FILTER_TAG_SLUGS) {
      const label = getCharacterFilterTagLabel(
        { slug, label: '仅中文标签' },
        locale,
        (key) => translate(locale, key),
      );
      assert.notEqual(label, '仅中文标签');
      assert.notEqual(label, slug);
    }
  }
});

test('unknown tags use the API label only in Chinese and readable slugs elsewhere', () => {
  const tag = { slug: 'future_story_arc', label: '未来故事线' };

  assert.equal(getCharacterFilterTagLabel(tag, 'zh-CN', (key) => key), '未来故事线');
  assert.equal(getCharacterFilterTagLabel(tag, 'en', (key) => key), 'Future Story Arc');
  assert.equal(getCharacterFilterTagLabel(tag, 'ja', (key) => key), 'Future Story Arc');
  assert.equal(getCharacterFilterTagLabel(tag, 'ko', (key) => key), 'Future Story Arc');
  assert.equal(getCharacterFilterTagLabel({ ...tag, label: '' }, 'zh-CN', (key) => key), tag.slug);
});

test('localizes tag arrays without changing their order', () => {
  const tags = [
    { slug: 'identity_student', label: '学生' },
    { slug: 'theme_horror', label: '恐怖' },
  ];

  assert.deepEqual(
    getCharacterFilterTagLabels(tags, 'en', (key) => translate('en', key)),
    ['Student', 'Horror'],
  );
});

test('keeps the homepage popular tags fixed and ordered', () => {
  const tags = getPopularCharacterFilterTags([
    { slug: 'theme_dark_romance', label: 'dark' },
    { slug: 'personality_flirtatious', label: 'flirty' },
  ]);
  assert.deepEqual(tags.map((tag) => tag.slug), [...POPULAR_CHARACTER_FILTER_TAG_SLUGS]);
  assert.equal(tags[0].label, 'flirty');
  assert.equal(tags[3].label, '');
});

test('groups all fourth-step filter tags by their stable slug prefix', () => {
  const tags = [
    { slug: 'theme_horror', label: 'Horror' },
    { slug: 'personality_dominant', label: 'Dominant' },
    { slug: 'user_relationship_rival', label: 'Rival' },
    { slug: 'identity_ceo', label: 'CEO' },
    { slug: 'future_story_arc', label: 'Future' },
    { slug: 'identity_ceo', label: 'Duplicate' },
  ];
  const groups = groupCharacterFilterTags(tags);

  assert.deepEqual(Object.keys(groups), CHARACTER_FILTER_TAG_GROUPS.map(({ id }) => id));
  assert.deepEqual(groups.personality.map((tag) => tag.slug), ['personality_dominant']);
  assert.deepEqual(groups.identity.map((tag) => tag.slug), ['identity_ceo']);
  assert.deepEqual(groups.relationship.map((tag) => tag.slug), ['user_relationship_rival']);
  assert.deepEqual(groups.interaction.map((tag) => tag.slug), ['theme_horror']);
});
