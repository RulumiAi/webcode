import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  GENERATOR_DEFAULT_IMAGE,
  outfitPresets,
  posePresets,
  scenePresets,
  type GeneratorPreset,
} from '../data/generatorPresets';
import { localizedPresetName, PRESET_NAME_TRANSLATIONS } from './generatorPresetLocalization';
import { buildGeneratorApiPrompt, buildGeneratorPrompts } from './generatorPrompt';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const allPresets = [...posePresets, ...outfitPresets, ...scenePresets];

const assertPresetCollection = (presets: GeneratorPreset[], expectedCount: number) => {
  assert.equal(presets.length, expectedCount);
  assert.equal(new Set(presets.map((preset) => preset.id)).size, expectedCount);
  assert.ok(presets.every((preset) => preset.name && !/\.(jpe?g|png|webp)$/i.test(preset.name)));
  assert.ok(presets.every((preset) => preset.imageUrl !== GENERATOR_DEFAULT_IMAGE));
  assert.ok(presets.every((preset) => preset.imageUrl.startsWith('/generator/assets/v4/')));
  assert.ok(presets.every((preset) => existsSync(path.join(projectRoot, 'public', preset.imageUrl))));
};

test('generator presets include every supplied image', () => {
  assertPresetCollection(posePresets, 24);
  assertPresetCollection(outfitPresets, 22);
  assertPresetCollection(scenePresets, 63);
  assert.equal(allPresets.length, 109);
});

test('special source basenames are normalized without changing intended names', () => {
  const names = new Set(allPresets.map((preset) => preset.name));
  assert.ok(names.has('骑乘式（牛仔）'));
  assert.ok(names.has('座椅式 : 椅子骑乘'));
  assert.ok(names.has('温室:植物园'));
  assert.ok(names.has('公交:地铁末节车厢'));
  assert.ok(names.has('停尸间'));
  assert.ok([...names].every((name) => !/[（(\s]+$/.test(name)));
});

test('every preset has distinct names in all supported locales', () => {
  for (const preset of allPresets) {
    const translations = PRESET_NAME_TRANSLATIONS[preset.name];
    assert.ok(translations, preset.name);
    for (const locale of ['en', 'ja', 'ko'] as const) {
      assert.ok(translations[locale]?.trim(), `${locale}/${preset.name}`);
      assert.equal(localizedPresetName(preset.name, locale), translations[locale]);
    }
    assert.equal(localizedPresetName(preset.name, 'zh-CN'), preset.name);
  }
});

test('visible prompt, generation prompt, and API payload share current locale names', () => {
  const input = {
    imageStyle: 'anime' as const,
    pose: posePresets[0],
    outfit: outfitPresets[0],
    scene: scenePresets[0],
    locale: 'ja',
    customPrompt: 'soft light',
  };
  const poseName = localizedPresetName(input.pose.name, input.locale);
  const outfitName = localizedPresetName(input.outfit.name, input.locale);
  const sceneName = localizedPresetName(input.scene.name, input.locale);
  const prompts = buildGeneratorPrompts(input);
  const payload = buildGeneratorApiPrompt(input);

  for (const name of [poseName, outfitName, sceneName]) {
    assert.ok(prompts.visiblePrompt.includes(name));
    assert.ok(prompts.generationPrompt.includes(name));
  }
  assert.equal(payload.pose, poseName);
  assert.equal(payload.outfit, outfitName);
  assert.equal(payload.scene, sceneName);
  assert.equal(payload.prompt, 'soft light');
});

test('Chinese remains the default locale for direct prompt calls', () => {
  const payload = buildGeneratorApiPrompt({
    imageStyle: 'realistic',
    pose: posePresets[0],
    outfit: outfitPresets[0],
    scene: scenePresets[0],
  });
  assert.equal(payload.pose, posePresets[0].name);
  assert.equal(payload.outfit, outfitPresets[0].name);
  assert.equal(payload.scene, scenePresets[0].name);
});

test('unselected optional presets are omitted from the API payload', () => {
  const payload = buildGeneratorApiPrompt({
    imageStyle: 'realistic',
    customPrompt: 'soft window light',
  });
  assert.deepEqual(payload, { style: 'realistic', prompt: 'soft window light' });
});

test('video dialogue stays visible and out of the custom API prompt field', () => {
  const prompts = buildGeneratorPrompts({
    imageStyle: 'realistic',
    pose: posePresets[0],
    dialogueText: 'Welcome home.',
    customPrompt: 'Keep the camera close.',
  });
  assert.ok(prompts.visiblePrompt.includes('Welcome home.'));
  assert.ok(prompts.generationPrompt.includes('Dialogue and lip-sync: Welcome home.'));

  const payload = buildGeneratorApiPrompt({
    imageStyle: 'realistic',
    pose: posePresets[0],
    dialogueText: 'Welcome home.',
    customPrompt: 'Keep the camera close.',
  });
  assert.equal(payload.prompt, 'Keep the camera close.');
  assert.ok(!JSON.stringify(payload).includes('Dialogue and lip-sync'));
});

test('old category filters and source-note fields are removed', () => {
  const component = readFileSync(path.join(projectRoot, 'src/components/AIGeneratorModal.tsx'), 'utf8');
  const presetSource = readFileSync(path.join(projectRoot, 'src/data/generatorPresets.ts'), 'utf8');
  assert.ok(!component.includes('Sub-Category Filter'));
  assert.ok(!component.includes('poseSubFilter'));
  assert.ok(!presetSource.includes('categoryEnglish'));
  assert.ok(!presetSource.includes('notes:'));
});

test('image generation is fixed to one output and keeps Seed in settings', () => {
  const component = readFileSync(path.join(projectRoot, 'src/components/AIGeneratorModal.tsx'), 'utf8');
  assert.ok(component.includes('count: 1'));
  assert.ok(component.includes("t('generator.fixedSeed')"));
  assert.ok(!component.includes('imageCounts'));
  assert.ok(!component.includes('setQuantity'));
});

test('generator presets can be cleared and every generate button shows diamond cost', () => {
  const component = readFileSync(path.join(projectRoot, 'src/components/AIGeneratorModal.tsx'), 'utf8');
  assert.ok(component.includes("setSelectedPose((current) => current === item.id ? null : item.id)"));
  assert.ok(component.includes("setSelectedOutfit((current) => current === item.id ? null : item.id)"));
  assert.ok(component.includes("setSelectedScene((current) => current === item.id ? null : item.id)"));
  assert.ok(!component.includes("isImageToVideo && (!selectedPose || !selectedOutfit || !selectedScene)"));
  assert.ok((component.match(/formatNumber\(generationDiamondCost\)/g)?.length ?? 0) >= 2);
  assert.ok(!component.includes('formatNumber(videoDiamondCost)'));
});
