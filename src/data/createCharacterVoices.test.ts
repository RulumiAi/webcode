import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ApiChatVoice } from '../api';
import { translate } from '../i18n';
import type { Locale } from '../types';
import { getCreateCharacterVoices, getVoiceDisplayNameKey } from './createCharacterVoices';

const catalog: ApiChatVoice[] = [
  ['eve', 'female'],
  ['ara', 'female'],
  ['leo', 'male'],
  ['rex', 'male'],
  ['sal', 'male'],
  ['jpi39icg', 'male'],
  ['d18jlf6v', 'female'],
  ['33g9t0jl', 'female'],
].map(([voiceId, gender]) => ({
  voiceId,
  name: voiceId,
  gender: gender as ApiChatVoice['gender'],
  language: 'multilingual',
  previewUrl: `https://voice.example/${voiceId}.mp3`,
  previewText: `${voiceId} preview`,
}));

const femaleDisplayNameKeys = [
  'voice.style.femaleWarm',
  'voice.style.femaleGirl',
  'voice.style.femaleCoolLady',
  'voice.style.femaleDeepCeo',
];

const maleDisplayNameKeys = [
  'voice.style.maleWarm',
  'voice.style.maleCalm',
  'voice.style.maleTipsy',
  'voice.style.maleMagnetic',
];

const localizedFemaleNames: Record<Locale, string[]> = {
  en: ['Warm Voice', 'Girl Voice', 'Cool Lady', 'Deep CEO'],
  'zh-CN': ['温柔暖声', '少女音', '高冷御姐音', '深沉霸总音'],
  ja: ['優しい声', '少女ボイス', 'クールお姉さん', '低音社長'],
  ko: ['따뜻한 목소리', '소녀 보이스', '시크한 언니', '중후한 CEO'],
  es: ['Voz cálida', 'Voz juvenil', 'Dama fría', 'CEO de voz grave'],
  pt: ['Voz calorosa', 'Voz jovem', 'Dama fria', 'CEO de voz grave'],
};

const localizedMaleNames: Record<Locale, string[]> = {
  en: ['Warm Voice', 'Calm Voice', 'Tipsy Voice', 'Magnetic Voice'],
  'zh-CN': ['温暖音', '沉稳音', '微醺音', '磁性音'],
  ja: ['温もりボイス', '落ち着いた声', 'ほろ酔いボイス', '魅惑の声'],
  ko: ['따뜻한 목소리', '차분한 목소리', '살짝 취한 목소리', '매력적인 목소리'],
  es: ['Voz cálida', 'Voz serena', 'Voz embriagada', 'Voz magnética'],
  pt: ['Voz calorosa', 'Voz serena', 'Voz embriagada', 'Voz magnética'],
};

test('keeps server-controlled female and male creation voice order', () => {
  const femaleCatalog = [catalog[1], catalog[0], catalog[6], catalog[7]];
  const maleCatalog = catalog.slice(2, 6);
  const female = getCreateCharacterVoices('female', femaleCatalog);
  const male = getCreateCharacterVoices('male', maleCatalog);

  assert.deepEqual(female.map((voice) => voice.voiceId), ['ara', 'eve', 'd18jlf6v', '33g9t0jl']);
  assert.deepEqual(male.map((voice) => voice.voiceId), ['leo', 'rex', 'sal', 'jpi39icg']);
  assert.deepEqual(female.map((voice) => voice.displayNameKey), femaleDisplayNameKeys);
  assert.deepEqual(male.map((voice) => voice.displayNameKey), maleDisplayNameKeys);
  for (const locale of Object.keys(localizedFemaleNames) as Locale[]) {
    assert.deepEqual(female.map((voice) => translate(locale, voice.displayNameKey)), localizedFemaleNames[locale]);
    assert.deepEqual(male.map((voice) => translate(locale, voice.displayNameKey)), localizedMaleNames[locale]);
  }
});

test('keeps server-controlled nonbinary order and saved preview URLs', () => {
  const serverCatalog = [catalog[1], catalog[0], ...catalog.slice(2)];
  const voices = getCreateCharacterVoices('nonbinary', serverCatalog);

  assert.deepEqual(voices.map((voice) => voice.voiceId), ['ara', 'eve', 'leo', 'rex', 'sal', 'jpi39icg', 'd18jlf6v', '33g9t0jl']);
  assert.deepEqual(voices.map((voice) => voice.displayNameKey), [
    femaleDisplayNameKeys[0], femaleDisplayNameKeys[1], maleDisplayNameKeys[0], maleDisplayNameKeys[1],
    maleDisplayNameKeys[2], maleDisplayNameKeys[3], femaleDisplayNameKeys[2], femaleDisplayNameKeys[3],
  ]);
  assert.deepEqual(voices.map((voice) => voice.previewUrl), [
    ...serverCatalog.map((voice) => voice.previewUrl),
  ]);
});

test('maps all known provider voice ids and leaves unknown ids as fallbacks', () => {
  assert.deepEqual(catalog.map((voice) => getVoiceDisplayNameKey(voice.voiceId)), [
    femaleDisplayNameKeys[1], femaleDisplayNameKeys[0], ...maleDisplayNameKeys,
    femaleDisplayNameKeys[2], femaleDisplayNameKeys[3],
  ]);
  assert.equal(getVoiceDisplayNameKey('unknown-provider-voice'), undefined);
});

test('both creation flows load the server-controlled creation voice catalog', () => {
  const source = readFileSync(new URL('../components/CreateCharacterModal.tsx', import.meta.url), 'utf8');
  const requestIndex = source.indexOf('void api.createdCharacters.voices(normalizedGender, locale)');
  const effectEnd = source.indexOf(']);', source.indexOf('  }, [', requestIndex));
  const requestEffect = source.slice(requestIndex, effectEnd + 3);

  assert.ok(requestIndex >= 0, 'creation voice catalog request must exist');
  assert.match(requestEffect, /normalizedGender/);
  assert.doesNotMatch(source, /prototypeVoices/);
  assert.doesNotMatch(source, /api\.chat\.voices/);
});

test('visible voice selectors use localized names for known ids', () => {
  const generator = readFileSync(new URL('../components/AIGeneratorModal.tsx', import.meta.url), 'utf8');
  const panel = readFileSync(new URL('../components/CharacterDetailPanel.tsx', import.meta.url), 'utf8');
  const modal = readFileSync(new URL('../components/CreateCharacterModal.tsx', import.meta.url), 'utf8');
  assert.match(generator, /getVoiceDisplayNameKey\(voice\.voiceId\)/);
  assert.match(panel, /getCreateCharacterVoices\(character\.gender/);
  assert.match(modal, /localizedVoiceName\(createdCharacter\.voiceStyle/);
});
