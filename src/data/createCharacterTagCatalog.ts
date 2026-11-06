import type { Locale } from '../types';

export const CREATE_TAG_GROUPS = [
  'appearance_and_body',
  'sexual_personality',
  'role_and_fantasy',
  'kinks_and_play',
] as const;

export type CreateTagGroup = (typeof CREATE_TAG_GROUPS)[number];

export const CREATE_TAG_VALUES: Record<CreateTagGroup, string[]> = {
  appearance_and_body: [
    'Busty', 'Huge Tits', 'Thick Ass', 'Curvy', 'Hourglass', 'Petite', 'Slim Thick', 'Milf Body',
    'Fit', 'Soft Belly', 'Blonde', 'Redhead', 'Brunette', 'Black Hair', 'Asian', 'Latina', 'Goth',
    'Pale', 'Tanned', 'Tattooed', 'Pierced', 'Stockings', 'Lingerie', 'Naked Ready',
  ],
  sexual_personality: [
    'Flirty', 'Teasing', 'Slutty', 'Innocent Act', 'Dominant', 'Submissive', 'Switch', 'Sadistic',
    'Masochistic', 'Possessive', 'Jealous', 'Yandere', 'Tsundere', 'Bratty', 'Needy', 'Horny',
    'Dirty Talker', 'Quiet Moaner', 'Loud', 'Shy Then Slutty',
  ],
  role_and_fantasy: [
    'MILF', 'Step-Mom', 'Step-Sister', 'College Slut', 'Teacher', 'Student 18+', 'Maid', 'Secretary',
    'Boss', 'CEO', 'Mafia Wife', 'Sugar Baby', 'Sugar Mommy', 'Nurse', 'Idol', 'Camgirl', 'Succubus',
    'Vampire', 'Monster Girl', 'Demon', 'Witch', 'Princess Corrupted',
  ],
  kinks_and_play: [
    'BDSM', 'Bondage', 'Spanking', 'Choking', 'Rough Sex', 'Gentle Sex', 'Slow Burn', 'Quick Hookup',
    'Edging', 'Denial', 'Praise', 'Degradation', 'Breeding', 'Creampie', 'Oral Fixation', 'Anal',
    'Threesome', 'Exhibition', 'Public Risk', 'Free Use', 'Corruption', 'Mind Break', 'Aftercare',
    'Filthy Talk',
  ],
};

type LocalizedTagValues = Record<CreateTagGroup, string[]>;

export const CREATE_TAG_TRANSLATIONS: Record<Locale, LocalizedTagValues> = {
  en: CREATE_TAG_VALUES,
  'zh-CN': {
    appearance_and_body: ['丰满', '巨乳', '丰满臀部', '曲线丰满', '沙漏身材', '娇小', '纤细丰腴', '熟妇身材', '健美', '柔软腹部', '金发', '红发', '棕发', '黑发', '亚洲人', '拉丁裔', '哥特', '苍白', '小麦色', '纹身', '穿孔', '长筒袜', '情趣内衣', '随时裸露'],
    sexual_personality: ['调情', '挑逗', '淫荡', '装纯', '主导', '顺从', '双向', '施虐', '受虐', '占有欲强', '善妒', '病娇', '傲娇', '任性', '依赖', '好色', '脏话挑逗', '低声呻吟', '大声', '害羞后放荡'],
    role_and_fantasy: ['熟母', '继母', '继姐/妹', '大学荡妇', '教师', '18+学生', '女仆', '秘书', '老板', '首席执行官', '黑手党妻子', '甜心宝贝', '甜心妈妈', '护士', '偶像', '网络女主播', '魅魔', '吸血鬼', '怪物娘', '恶魔', '女巫', '堕落公主'],
    kinks_and_play: ['BDSM', '束缚', '打屁股', '窒息', '粗暴性爱', '温柔性爱', '慢热', '快速约炮', '边缘控制', '禁欲', '赞美', '贬低', '繁育', '内射', '口交癖', '肛交', '三人行', '暴露癖', '公开场所冒险', '随意使用', '腐化', '精神崩坏', '事后照顾', '淫秽谈话'],
  },
  ja: {
    appearance_and_body: ['豊満', '巨乳', '豊かなヒップ', '曲線美', '砂時計型', '小柄', 'スリムで豊満', '熟女ボディ', '引き締まった', '柔らかいお腹', '金髪', '赤毛', 'ブルネット', '黒髪', 'アジア系', 'ラテン系', 'ゴス', '色白', '日焼け肌', 'タトゥー', 'ピアス', 'ストッキング', 'ランジェリー', 'すぐ脱げる'],
    sexual_personality: ['色っぽい', 'からかい', '淫ら', '無垢なふり', '支配的', '従順', 'スイッチ', 'サディスティック', 'マゾヒスティック', '独占欲が強い', '嫉妬深い', 'ヤンデレ', 'ツンデレ', '生意気', '甘えん坊', 'ムラムラ', 'きわどい話好き', '静かな喘ぎ', '声が大きい', '恥ずかしがりから淫らに'],
    role_and_fantasy: ['熟女', '継母', '義姉妹', '女子大生ビッチ', '教師', '18歳以上の学生', 'メイド', '秘書', '上司', 'CEO', 'マフィアの妻', 'シュガーベイビー', 'シュガーマミー', '看護師', 'アイドル', 'キャムガール', 'サキュバス', 'ヴァンパイア', 'モンスター娘', '悪魔', '魔女', '堕落した王女'],
    kinks_and_play: ['BDSM', '拘束', 'スパンキング', '首絞め', '激しいセックス', '優しいセックス', 'スローバーン', 'すぐの出会い', 'エッジング', '禁欲', '褒め言葉', '貶し', '子作り', '中出し', 'オーラル嗜好', 'アナル', '3P', '露出', '公共の場のリスク', 'フリー使用', '堕落', 'マインドブレイク', 'アフターケア', '卑猥な会話'],
  },
  ko: {
    appearance_and_body: ['풍만한', '큰 가슴', '볼륨 있는 엉덩이', '굴곡진', '모래시계형', '아담한', '슬림 글래머', '밀프 체형', '탄탄한', '부드러운 배', '금발', '빨간 머리', '갈색 머리', '검은 머리', '아시아인', '라티나', '고스', '창백한', '태닝한', '문신', '피어싱', '스타킹', '란제리', '벗을 준비 완료'],
    sexual_personality: ['플러티한', '도발적인', '음탕한', '순진한 척', '지배적인', '순종적인', '스위치', '가학적인', '피학적인', '소유욕 강한', '질투심 많은', '얀데레', '츤데레', '버릇없는', '의존적인', '흥분한', '야한 말을 하는', '조용히 신음하는', '소리가 큰', '수줍다가 음탕해지는'],
    role_and_fantasy: ['밀프', '계모', '의붓자매', '대학 창녀', '교사', '18세 이상 학생', '메이드', '비서', '상사', 'CEO', '마피아 아내', '슈거 베이비', '슈거 마미', '간호사', '아이돌', '캠걸', '서큐버스', '뱀파이어', '몬스터 소녀', '악마', '마녀', '타락한 공주'],
    kinks_and_play: ['BDSM', '속박', '스팽킹', '목 조르기', '거친 섹스', '부드러운 섹스', '슬로우 번', '빠른 만남', '엣징', '거부와 금지', '칭찬', '굴욕', '임신시키기', '질내사정', '오럴 집착', '애널', '쓰리섬', '노출', '공공장소 위험', '프리 유즈', '타락', '정신 붕괴', '애프터케어', '음란한 대화'],
  },
  es: {
    appearance_and_body: ['Voluptuosa', 'Pechos enormes', 'Trasero grande', 'Con curvas', 'Reloj de arena', 'Menuda', 'Delgada y curvilínea', 'Cuerpo MILF', 'En forma', 'Barriga suave', 'Rubia', 'Pelirroja', 'Morena', 'Cabello negro', 'Asiática', 'Latina', 'Gótica', 'Pálida', 'Bronceada', 'Tatuada', 'Con piercings', 'Medias', 'Lencería', 'Lista para desnudarse'],
    sexual_personality: ['Coqueta', 'Provocadora', 'Promiscua', 'Fingida inocente', 'Dominante', 'Sumisa', 'Versátil', 'Sádica', 'Masoquista', 'Posesiva', 'Celosa', 'Yandere', 'Tsundere', 'Caprichosa', 'Necesitada', 'Cachonda', 'Habla sucio', 'Gime bajito', 'Ruidosa', 'Tímida y luego atrevida'],
    role_and_fantasy: ['MILF', 'Madrastra', 'Hermanastra', 'Universitaria promiscua', 'Profesora', 'Estudiante 18+', 'Doncella', 'Secretaria', 'Jefa', 'CEO', 'Esposa de mafioso', 'Sugar baby', 'Sugar mommy', 'Enfermera', 'Ídolo', 'Camgirl', 'Súcubo', 'Vampira', 'Chica monstruo', 'Demonio', 'Bruja', 'Princesa corrompida'],
    kinks_and_play: ['BDSM', 'Ataduras', 'Azotes', 'Estrangulación', 'Sexo brusco', 'Sexo tierno', 'Romance lento', 'Encuentro rápido', 'Edging', 'Negación', 'Elogios', 'Degradación', 'Fecundación', 'Corrida interna', 'Fijación oral', 'Anal', 'Trío', 'Exhibicionismo', 'Riesgo público', 'Uso libre', 'Corrupción', 'Ruptura mental', 'Cuidados posteriores', 'Habla obscena'],
  },
  pt: {
    appearance_and_body: ['Voluptuosa', 'Seios enormes', 'Bumbum volumoso', 'Curvilínea', 'Corpo ampulheta', 'Pequena', 'Esguia e curvilínea', 'Corpo de MILF', 'Em forma', 'Barriga macia', 'Loira', 'Ruiva', 'Morena', 'Cabelo preto', 'Asiática', 'Latina', 'Gótica', 'Pálida', 'Bronzeada', 'Tatuada', 'Piercings', 'Meias', 'Lingerie', 'Pronta para ficar nua'],
    sexual_personality: ['Sedutora', 'Provocante', 'Safada', 'Finge inocência', 'Dominante', 'Submissa', 'Versátil', 'Sádica', 'Masoquista', 'Possessiva', 'Ciumenta', 'Yandere', 'Tsundere', 'Mimada', 'Carente', 'Excitada', 'Fala sacana', 'Geme baixinho', 'Barulhenta', 'Tímida e depois safada'],
    role_and_fantasy: ['MILF', 'Madrasta', 'Meia-irmã', 'Universitária safada', 'Professora', 'Estudante 18+', 'Empregada', 'Secretária', 'Chefe', 'CEO', 'Esposa de mafioso', 'Sugar baby', 'Sugar mommy', 'Enfermeira', 'Ídolo', 'Camgirl', 'Súcubo', 'Vampira', 'Garota monstro', 'Demônio', 'Bruxa', 'Princesa corrompida'],
    kinks_and_play: ['BDSM', 'Bondage', 'Palmadas', 'Estrangulamento', 'Sexo bruto', 'Sexo gentil', 'Romance lento', 'Encontro rápido', 'Edging', 'Negação', 'Elogios', 'Degradação', 'Fertilização', 'Ejaculação interna', 'Fixação oral', 'Anal', 'Trio', 'Exibicionismo', 'Risco em público', 'Uso livre', 'Corrupção', 'Colapso mental', 'Cuidados posteriores', 'Fala imunda'],
  },
};

export const CREATE_TAG_GROUP_LABELS: Record<Locale, Record<CreateTagGroup, string>> = {
  en: { appearance_and_body: 'Appearance & Body', sexual_personality: 'Sexual Personality', role_and_fantasy: 'Role & Fantasy', kinks_and_play: 'Kinks & Play' },
  'zh-CN': { appearance_and_body: '外观与身材', sexual_personality: '性格与性魅力', role_and_fantasy: '角色与幻想', kinks_and_play: '癖好与玩法' },
  ja: { appearance_and_body: '外見とボディ', sexual_personality: 'セクシャルな性格', role_and_fantasy: '役割とファンタジー', kinks_and_play: '嗜好とプレイ' },
  ko: { appearance_and_body: '외모와 몸매', sexual_personality: '성적 성격', role_and_fantasy: '역할과 판타지', kinks_and_play: '취향과 플레이' },
  es: { appearance_and_body: 'Apariencia y cuerpo', sexual_personality: 'Personalidad sexual', role_and_fantasy: 'Rol y fantasía', kinks_and_play: 'Preferencias y juegos' },
  pt: { appearance_and_body: 'Aparência e corpo', sexual_personality: 'Personalidade sexual', role_and_fantasy: 'Papel e fantasia', kinks_and_play: 'Preferências e práticas' },
};

export const CREATE_TAG_DEFINITIONS = CREATE_TAG_GROUPS.flatMap((group) =>
  CREATE_TAG_VALUES[group].map((canonical, index) => ({
    group,
    canonical,
    slug: `${group}_${canonical.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    index,
  })),
);

export const createTagTranslationKey = (group: CreateTagGroup, index: number) =>
  `tags.catalog.${group}.${String(index + 1).padStart(2, '0')}`;
