import type { Locale } from '../types';

const LOCAL_NICKNAMES: Record<Locale, readonly string[]> = {
  en: ['Avery Vale', 'Mira Rowan', 'Nora Quinn', 'Luna Hart', 'Iris Wren'],
  'zh-CN': ['沈星遥', '顾清妍', '林晚棠', '苏念安', '叶知微'],
  ja: ['月島ユナ', '白石レイ', '桜井ミオ', '高橋ルナ', '青木ナナ'],
  ko: ['서윤아', '한유리', '김하늘', '박서연', '윤나래'],
  es: ['Lucía Vega', 'Sofía Luna', 'Valeria Cruz', 'Alma Reyes', 'Clara Sol'],
  pt: ['Lívia Costa', 'Sofia Luz', 'Valentina Rosa', 'Clara Alves', 'Isabela Sol'],
};

export function getLocalWizardNickname(locale: Locale, random = Math.random()) {
  const candidates = LOCAL_NICKNAMES[locale];
  const index = Math.min(candidates.length - 1, Math.max(0, Math.floor(random * candidates.length)));
  return candidates[index];
}

export function getLocalWizardNicknameCandidates(locale: Locale) {
  return LOCAL_NICKNAMES[locale];
}
