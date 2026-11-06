import type { GeneratorPreset } from '../data/generatorPresets';
import { localizedPresetName } from './generatorPresetLocalization';

export interface GeneratorPromptInput {
  imageStyle: 'anime' | 'realistic';
  pose?: GeneratorPreset;
  outfit?: GeneratorPreset;
  scene?: GeneratorPreset;
  locale?: string;
  dialogueText?: string;
  customPrompt?: string;
}

export interface GeneratorPrompts {
  visiblePrompt: string;
  generationPrompt: string;
}

export interface GeneratorApiPromptPayload {
  style: 'anime' | 'realistic';
  pose?: string;
  outfit?: string;
  scene?: string;
  prompt?: string;
}

export const DEFAULT_CUSTOM_PROMPT = '水汪汪蔚蓝眼神，微风打湿发梢，眼神对视光影，4K超精细细节';

const stylePrefix = (imageStyle: GeneratorPromptInput['imageStyle']) =>
  imageStyle === 'anime'
    ? 'anime style, 2d illustration, vibrant color'
    : 'photorealistic, realistic portrait, cinematic raw photograph, 8k uhd';

const generationPresetPrompt = (label: string, preset: GeneratorPreset | undefined, locale: string) => {
  if (!preset) return '';
  return `${label}: ${localizedPresetName(preset.name, locale)}`;
};

export const buildGeneratorPrompts = ({
  imageStyle,
  pose,
  outfit,
  scene,
  locale = 'zh-CN',
  dialogueText = '',
  customPrompt = '',
}: GeneratorPromptInput): GeneratorPrompts => {
  const dialogue = dialogueText.trim();
  const custom = customPrompt.trim();
  const visibleParts = [
    stylePrefix(imageStyle),
    pose && localizedPresetName(pose.name, locale),
    outfit && localizedPresetName(outfit.name, locale),
    scene && localizedPresetName(scene.name, locale),
    dialogue,
    custom,
  ].filter(Boolean);

  const generationParts = [
    stylePrefix(imageStyle),
    generationPresetPrompt('pose', pose, locale),
    generationPresetPrompt('outfit', outfit, locale),
    generationPresetPrompt('scene', scene, locale),
    dialogue ? `Dialogue and lip-sync: ${dialogue}` : '',
    custom,
  ].filter(Boolean);

  return {
    visiblePrompt: visibleParts.join(', '),
    generationPrompt: generationParts.join(', '),
  };
};

/** Map the currently displayed preset names to the Django generation contract. */
export const buildGeneratorApiPrompt = ({
  imageStyle,
  pose,
  outfit,
  scene,
  locale = 'zh-CN',
  customPrompt = '',
}: GeneratorPromptInput): GeneratorApiPromptPayload => {
  const payload: GeneratorApiPromptPayload = { style: imageStyle };
  if (pose) payload.pose = localizedPresetName(pose.name, locale);
  if (outfit) payload.outfit = localizedPresetName(outfit.name, locale);
  if (scene) payload.scene = localizedPresetName(scene.name, locale);
  const custom = customPrompt.trim();
  // Dialogue has its own API field. The backend owns final prompt ordering,
  // so this field must contain only the user's custom direction.
  if (custom) payload.prompt = custom;
  return payload;
};
