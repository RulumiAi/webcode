import type { InteractiveScenario, Locale } from '../types';

type ScenarioCopy = Pick<InteractiveScenario, 'title' | 'description' | 'openingLine'>;

const DEFAULT_SCENARIO: Record<Locale, ScenarioCopy> = {
  en: {
    title: 'A private contract at midnight',
    description: 'A locked room and a secret agreement turn the late hour into a charged beginning.',
    openingLine: '*Quietly locks the bedroom door and brushes a hand across your collar* "Tonight, stay with me a little longer."',
  },
  'zh-CN': {
    title: '深夜卧室的主仆契约',
    description: '房间门被悄然锁上，秘密约定让深夜成为故事的开始。',
    openingLine: '*轻将卧室大门反锁，纤细的手指缓缓滑过你的衣领* “主人，今晚再陪我一会儿，好吗？”',
  },
  ja: {
    title: '深夜の部屋で交わす秘密の契約',
    description: '静かに鍵のかかった部屋で、秘密の約束が二人の夜を動かし始める。',
    openingLine: '*そっと寝室の鍵をかけ、指先であなたの襟元に触れる*「今夜は、もう少しだけそばにいてくれますか？」',
  },
  ko: {
    title: '한밤중 방 안의 비밀 계약',
    description: '조용히 잠긴 방과 비밀스러운 약속이 늦은 밤의 이야기를 시작하게 한다.',
    openingLine: '*조용히 침실 문을 잠그고 손끝으로 당신의 옷깃을 스친다* “오늘 밤은 조금만 더 내 곁에 있어 줄래요?”',
  },
  es: {
    title: 'Un contrato secreto a medianoche',
    description: 'Una habitación cerrada y un acuerdo secreto convierten la noche en un comienzo cargado de tensión.',
    openingLine: '*Cierra la puerta del dormitorio en silencio y roza tu cuello con los dedos* «Esta noche, quédate conmigo un poco más.»',
  },
  pt: {
    title: 'Um contrato secreto à meia-noite',
    description: 'Um quarto trancado e um acordo secreto fazem da noite o começo de algo intenso.',
    openingLine: '*Tranca a porta do quarto em silêncio e desliza os dedos pela sua gola* “Esta noite, fique comigo mais um pouco.”',
  },
};

export const getDefaultCreateCharacterScenario = (locale: Locale): InteractiveScenario => ({
  id: 'sc-default-1',
  ...DEFAULT_SCENARIO[locale],
  isLocked: false,
});

export const isDefaultCreateCharacterScenario = (scenario: InteractiveScenario) =>
  scenario.id === 'sc-default-1' && Object.values(DEFAULT_SCENARIO).some((copy) =>
    scenario.title === copy.title && scenario.description === copy.description && scenario.openingLine === copy.openingLine,
  );
