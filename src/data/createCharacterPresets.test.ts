import assert from 'node:assert/strict';
import test from 'node:test';
import type { Locale } from '../types';
import {
  CREATE_CHARACTER_PRESET_MESSAGES,
  FEMALE_CREATE_CHARACTER_PRESETS,
  MALE_CREATE_CHARACTER_PRESETS,
  SHARED_CREATE_CHARACTER_PRESETS,
  getCreateArchetypeTranslationKey,
  getCreateCharacterPresets,
  getCreateStepFourDisplayTags,
  getCreateTraitTranslationKey,
  getDefaultCreateCharacterPresetSelections,
  getRandomCreateCharacterAge,
  serializeCreateCharacterPresetSelections,
  shouldResetCreateCharacterPresetSelections,
  summarizeCreateStepFourDisplayTags,
} from './createCharacterPresets';
import { CREATE_TAG_GROUPS } from './createCharacterTagCatalog';
import { getDefaultCreateCharacterScenario, isDefaultCreateCharacterScenario } from './createCharacterScenarios';

test('defines one complete shared step 4 and step 5 preset set', () => {
  assert.deepEqual(CREATE_TAG_GROUPS, ['appearance_and_body', 'sexual_personality', 'role_and_fantasy', 'kinks_and_play']);
  for (const group of CREATE_TAG_GROUPS) {
    assert.ok(SHARED_CREATE_CHARACTER_PRESETS[group].length > 0, group);
  }
  assert.equal(SHARED_CREATE_CHARACTER_PRESETS.archetypes[0].canonical, '强势掌控（Dominant）');
});

test('all genders share presets and preserve their selections when switching', () => {
  assert.equal(FEMALE_CREATE_CHARACTER_PRESETS, SHARED_CREATE_CHARACTER_PRESETS);
  assert.equal(MALE_CREATE_CHARACTER_PRESETS, SHARED_CREATE_CHARACTER_PRESETS);
  assert.equal(getCreateCharacterPresets('female'), SHARED_CREATE_CHARACTER_PRESETS);
  assert.equal(getCreateCharacterPresets('nonbinary'), SHARED_CREATE_CHARACTER_PRESETS);
  assert.equal(getCreateCharacterPresets('male'), SHARED_CREATE_CHARACTER_PRESETS);
  assert.equal(shouldResetCreateCharacterPresetSelections('female', 'nonbinary'), false);
  assert.equal(shouldResetCreateCharacterPresetSelections('nonbinary', 'female'), false);
  assert.equal(shouldResetCreateCharacterPresetSelections('female', 'male'), false);
  assert.equal(shouldResetCreateCharacterPresetSelections('male', 'nonbinary'), false);
});

test('defaults select first option from every active group', () => {
  const femaleDefaults = getDefaultCreateCharacterPresetSelections('female');
  const maleDefaults = getDefaultCreateCharacterPresetSelections('male');
  assert.deepEqual(femaleDefaults, {
    appearance_and_body: ['shared-appearance_and_body-01'],
    sexual_personality: ['shared-sexual_personality-01'],
    role_and_fantasy: ['shared-role_and_fantasy-01'],
    kinks_and_play: ['shared-kinks_and_play-01'],
    adultStyle: 'shared-archetype-01',
  });
  assert.deepEqual(maleDefaults, femaleDefaults);
});

test('new character ages are integers from 18 through 35', () => {
  assert.equal(getRandomCreateCharacterAge(() => 0), 18);
  assert.equal(getRandomCreateCharacterAge(() => 1), 35);
  assert.equal(getRandomCreateCharacterAge(() => 0.5), 27);
  for (let index = 0; index <= 100; index += 1) {
    const age = getRandomCreateCharacterAge(() => index / 100);
    assert.equal(Number.isInteger(age), true);
    assert.ok(age >= 18 && age <= 35, String(age));
  }
});

test('serializes only canonical Chinese values without internal ids or hobbies', () => {
  const serialized = serializeCreateCharacterPresetSelections('male', {
    appearance_and_body: ['shared-appearance_and_body-01'],
    sexual_personality: ['shared-sexual_personality-01'],
    role_and_fantasy: ['shared-role_and_fantasy-01'],
    kinks_and_play: ['shared-kinks_and_play-01'],
    adultStyle: 'shared-archetype-01',
  });
  assert.deepEqual(serialized, {
    appearance_and_body: [SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical],
    sexual_personality: [SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0].canonical],
    role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].canonical],
    kinks_and_play: [SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0].canonical],
    adultStyles: ['强势掌控（Dominant）'],
  });
  assert.equal('hobbies' in serialized, false);
  assert.doesNotMatch(JSON.stringify(serialized), /shared-(appearance_and_body|sexual_personality|role_and_fantasy|kinks_and_play|archetype)-/);
});

test('every new trait and archetype has localized text in every supported locale', () => {
  const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko'];
  for (const locale of locales) {
    for (const presets of [SHARED_CREATE_CHARACTER_PRESETS]) {
      for (const group of CREATE_TAG_GROUPS) {
        for (const preset of presets[group]) {
          const key = getCreateTraitTranslationKey(preset);
          assert.ok(CREATE_CHARACTER_PRESET_MESSAGES[locale][key]?.trim(), `${locale}/${key}`);
        }
      }
      for (const preset of presets.archetypes) {
        for (const field of ['name', 'desc'] as const) {
          const key = getCreateArchetypeTranslationKey(preset, field);
          assert.ok(CREATE_CHARACTER_PRESET_MESSAGES[locale][key]?.trim(), `${locale}/${key}`);
        }
      }
    }
  }
});

test('restores localized step 4 tags from current group values and preset ids', () => {
  const selections = {
    appearance_and_body: ['shared-appearance_and_body-01'],
    sexual_personality: [{ id: 'shared-sexual_personality-01' }],
    role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].canonical],
    kinks_and_play: [{ canonical: SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0].canonical }],
  };
  const translate = (key: string) => CREATE_CHARACTER_PRESET_MESSAGES.en[key] || key;

  assert.deepEqual(getCreateStepFourDisplayTags(selections, translate).map((tag) => tag.id), CREATE_TAG_GROUPS.map((group) => SHARED_CREATE_CHARACTER_PRESETS[group][0].id));
});

test('localizes created card step 4 tags in every supported locale without old defaults', () => {
  const selections = {
    appearance_and_body: [SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body[0].canonical],
    sexual_personality: [SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0].canonical],
    role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].canonical],
    kinks_and_play: [SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play[0].canonical],
  };
  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    const translate = (key: string) => CREATE_CHARACTER_PRESET_MESSAGES[locale][key] || key;
    const labels = getCreateStepFourDisplayTags(selections, translate).map((tag) => tag.label);
    assert.equal(labels.length, CREATE_TAG_GROUPS.length);
    assert.ok(labels.every((label) => label.trim()));
  }
  assert.deepEqual(getCreateStepFourDisplayTags(undefined, (key) => key), []);
});

test('limits list cards to four step 4 tags and reports the hidden count', () => {
  const tags = getCreateStepFourDisplayTags({
    appearance_and_body: SHARED_CREATE_CHARACTER_PRESETS.appearance_and_body.slice(0, 2).map((preset) => preset.id),
    sexual_personality: [SHARED_CREATE_CHARACTER_PRESETS.sexual_personality[0].id],
    role_and_fantasy: [SHARED_CREATE_CHARACTER_PRESETS.role_and_fantasy[0].id],
    kinks_and_play: SHARED_CREATE_CHARACTER_PRESETS.kinks_and_play.slice(0, 2).map((preset) => preset.id),
  }, (key) => CREATE_CHARACTER_PRESET_MESSAGES['zh-CN'][key] || key);

  const summary = summarizeCreateStepFourDisplayTags(tags);
  assert.equal(summary.visible.length, 4);
  assert.equal(summary.remaining, 2);
});

test('localizes the default step 5 scenario and recognizes only untouched defaults', () => {
  const english = getDefaultCreateCharacterScenario('en');
  const spanish = getDefaultCreateCharacterScenario('es');
  const portuguese = getDefaultCreateCharacterScenario('pt');
  assert.equal(english.id, 'sc-default-1');
  assert.doesNotMatch(`${english.title}\n${english.description}\n${english.openingLine}`, /[\u4e00-\u9fff]/);
  assert.ok(spanish.title.trim());
  assert.ok(portuguese.title.trim());
  assert.equal(isDefaultCreateCharacterScenario(english), true);
  assert.equal(isDefaultCreateCharacterScenario({ ...english, description: 'User-written scene' }), false);
});
