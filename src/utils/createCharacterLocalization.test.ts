import assert from 'node:assert/strict';
import test from 'node:test';
import { registerLocaleMessages, translate, SUPPORTED_LOCALES } from '../i18n';
import { getCreateCharacterOptionLabel } from '../data/createCharacterAssets';
import { CREATE_CHARACTER_PRESET_MESSAGES, SHARED_CREATE_CHARACTER_PRESETS, getCreateTraitTranslationKey } from '../data/createCharacterPresets';
import { CREATE_FLOW_TRANSLATIONS } from '../data/createFlowTranslations';
import {
  buildCreateCharacterImagePrompt,
  buildCreateCharacterImagePromptDocument,
  getCreateCharacterShowcaseTags,
  localizeCreateFlowError,
  localizeCreateFlowErrorCode,
  type CreateCharacterPromptSelections,
} from './createCharacterLocalization';

registerLocaleMessages(CREATE_CHARACTER_PRESET_MESSAGES);
registerLocaleMessages(CREATE_FLOW_TRANSLATIONS);

const selections: CreateCharacterPromptSelections = {
  artStyle: 'anime',
  gender: 'female',
  name: 'Yunxi',
  age: 22,
  race: 'east_asian',
  species: 'human',
  skin: 'porcelain',
  eye: 'ruby',
  face: 'v_line',
  hair: 'waves',
  hairColor: 'black',
  body: 'curvy',
  chest: 'natural',
  hip: 'peach',
  appearance_and_body: [],
  sexual_personality: [],
  role_and_fantasy: [],
  kinks_and_play: [],
  archetype: '',
};

test('builds the step-six image prompt in every supported locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const t = (key: string) => translate(locale, key);
    const template = t('create.prompt.template');
    assert.match(template, /\{\{lineage\}\}/, `${locale}:lineage token`);
    assert.doesNotMatch(template, /\{\{race\}\}|\{\{species\}\}/, `${locale}:legacy lineage tokens`);
    const localizedSelections = {
      ...selections,
      appearance_and_body: [t(getCreateTraitTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0]))],
      sexual_personality: [t(getCreateTraitTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0]))],
      role_and_fantasy: [t(getCreateTraitTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0]))],
      kinks_and_play: [t(getCreateTraitTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0]))],
      archetype: t('create.preset.archetype.shared-archetype-01.name'),
    };
    const prompt = buildCreateCharacterImagePrompt(locale, t, localizedSelections);
    assert.match(prompt, new RegExp(t('create.prompt.style.anime')));
    assert.ok(prompt.includes(getCreateCharacterOptionLabel(locale, 'female', 'race', 'east_asian')));
    assert.ok(!prompt.includes(t('create.preset.species.succubus.name')));
    assert.ok(prompt.includes('Yunxi'));
    assert.ok(prompt.includes('22'));
    assert.ok(prompt.includes(localizedSelections.appearance_and_body[0]));
    assert.ok(prompt.includes(localizedSelections.sexual_personality[0]));
    assert.ok(prompt.includes(localizedSelections.role_and_fantasy[0]));
    assert.ok(prompt.includes(localizedSelections.kinks_and_play[0]));
    assert.ok(prompt.includes(localizedSelections.archetype));
    assert.ok(prompt.includes(t('create.preset.hairColor.black.label')));
    assert.ok(prompt.includes(t('create.prompt.quality')));
    assert.doesNotMatch(prompt, /create\.prompt\.|create\.preset\./);

    const document = buildCreateCharacterImagePromptDocument(locale, t, localizedSelections);
    assert.equal(document.segments.map((segment) => segment.text).join(''), document.text);
    for (const tone of ['identity', 'lineage', 'appearance', 'body', 'profile', 'story']) {
      assert.ok(document.segments.some((segment) => segment.tone === tone), `${locale}:${tone}`);
    }
  }
});

test('builds a fantasy-only lineage prompt without carrying the previous human heritage', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const t = (key: string) => translate(locale, key);
    const prompt = buildCreateCharacterImagePrompt(locale, t, {
      ...selections,
      race: '',
      species: 'succubus',
    });
    assert.ok(prompt.includes(t('create.preset.species.succubus.name')));
    assert.ok(!prompt.includes(getCreateCharacterOptionLabel(locale, 'female', 'race', 'east_asian')));
  }
});

test('localizes known create-flow error codes and hides unknown backend messages', () => {
  const codes = [
    'NAME_TAKEN',
    'VALIDATION_ERROR',
    'CHARACTER_UNAVAILABLE',
    'SOURCE_GENERATION_UNAVAILABLE',
    'SOURCE_MEDIA_UNAVAILABLE',
    'SOURCE_MEDIA_TOO_SMALL',
    'CONFLICT',
    'UPSTREAM_TIMEOUT',
    'UPSTREAM_UNAVAILABLE',
    'UPSTREAM_INVALID_RESPONSE',
    'UPSTREAM_REJECTED',
    'UPSTREAM_GENERATION_FAILED',
    'UPSTREAM_MEDIA_UNAVAILABLE',
    'UPSTREAM_SENSITIVE_CONTENT',
  ];

  for (const locale of SUPPORTED_LOCALES) {
    const t = (key: string) => translate(locale, key);
    for (const code of codes) {
      const message = localizeCreateFlowErrorCode(code, t, 'create.generationError');
      assert.ok(message.trim(), `${locale}:${code}`);
      assert.notEqual(message, code, `${locale}:${code}`);
    }
    assert.equal(
      localizeCreateFlowError({ code: 'UNKNOWN', message: 'raw backend message' }, t, 'create.saveError'),
      t('create.saveError'),
    );
  }
});

test('rebuilds showcase tags in the active locale instead of exposing canonical values', () => {
  const creationSelections = {
    race: 'caucasian',
    species: 'human',
    chestSize: 'flat',
    hipSize: 'compact',
    appearance_and_body: [SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical],
    sexual_personality: [SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0].canonical],
    role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].canonical],
    kinks_and_play: [SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0].canonical],
    adultStyles: ['强势掌控（Dominant）'],
  };
  const rawTags = ['realistic', 'White', 'flat chest', 'small hips', ...Object.values(creationSelections).flatMap((value) => Array.isArray(value) ? value : [])];

  for (const locale of SUPPORTED_LOCALES) {
    const t = (key: string) => translate(locale, key);
    const tags = getCreateCharacterShowcaseTags({
      locale,
      gender: 'female',
      artStyle: 'realistic',
      race: 'caucasian',
      species: 'human',
      chest: 'flat',
      hip: 'compact',
      creationSelections,
      rawTags,
    }, t);
    assert.equal(tags.length, 7, `${locale}: tag count`);
    assert.ok(tags.every((tag) => tag.trim()), `${locale}: non-empty tags`);
    const localizedAppearance = t(getCreateTraitTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0]));
    assert.ok(tags.includes(localizedAppearance), `${locale}: localized appearance`);
    assert.ok(tags.some((tag) => tag !== SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical), `${locale}: localized preset`);
    if (localizedAppearance !== SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical) assert.ok(!tags.includes(SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical), `${locale}: canonical appearance hidden`);
  }
});

test('showcase tag helper falls back to current selections when raw tags are unavailable', () => {
  const locale = 'en' as const;
  const t = (key: string) => translate(locale, key);
  const tags = getCreateCharacterShowcaseTags({
    locale,
    gender: 'female',
    artStyle: 'anime',
    race: 'caucasian',
    species: 'human',
    chest: 'flat',
    hip: 'compact',
    creationSelections: {
      race: 'caucasian',
      species: 'human',
      chestSize: 'flat',
      hipSize: 'compact',
      appearance_and_body: [SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical],
      sexual_personality: [SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0].canonical],
      role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].canonical],
      kinks_and_play: [SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0].canonical],
      adultStyles: ['Dominant'],
    },
  }, t, [SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical]);
  assert.deepEqual(tags.slice(0, 4), [t('create.prompt.style.anime'), 'European', 'Small (A cup)', 'Compact and lifted']);
  assert.equal(tags.length, 7);
});
