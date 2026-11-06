import type { ApiChatVoice } from '../api';
import type { GenderType } from '../types';

const DISPLAY_NAME_KEYS: Record<string, string> = {
  eve: 'voice.style.femaleGirl',
  ara: 'voice.style.femaleWarm',
  d18jlf6v: 'voice.style.femaleCoolLady',
  '33g9t0jl': 'voice.style.femaleDeepCeo',
  leo: 'voice.style.maleWarm',
  rex: 'voice.style.maleCalm',
  sal: 'voice.style.maleTipsy',
  jpi39icg: 'voice.style.maleMagnetic',
};

export function getVoiceDisplayNameKey(voiceId: string): string | undefined {
  return DISPLAY_NAME_KEYS[voiceId];
}

export interface CreateCharacterVoice extends ApiChatVoice {
  displayNameKey: string;
}

export function getCreateCharacterVoices(_gender: GenderType, voices: ApiChatVoice[]): CreateCharacterVoice[] {
  const toCreateVoice = (voice: ApiChatVoice | undefined): CreateCharacterVoice[] => {
    if (!voice) return [];
    const displayNameKey = getVoiceDisplayNameKey(voice.voiceId);
    return displayNameKey ? [{ ...voice, displayNameKey }] : [];
  };
  return voices.flatMap(toCreateVoice);
}
