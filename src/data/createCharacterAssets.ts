import type { ArtStyleType, GenderType, Locale } from '../types';

export type CreateCharacterGender = Exclude<GenderType, 'all'>;
export type CreateCharacterArtStyle = Exclude<ArtStyleType, 'all'>;

export const CREATE_CHARACTER_OPTION_IDS = {
  race: ['east_asian', 'caucasian', 'latina', 'black', 'middle_eastern', 'south_asian'],
  skin: ['porcelain', 'peach', 'olive_tan', 'ebony_black', 'anime_white'],
  face: ['v_line', 'oval', 'chubby', 'sculpted'],
  hair: ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'afro', 'buzz_cut', 'mohawk', 'slick_back', 'classic_bob', 'bangs', 'high_ponytail', 'half_up', 'wool_curls'],
  body: ['curvy', 'slim', 'athletic', 'tall_model'],
  chest: ['flat', 'natural', 'full', 'voluptuous'],
  hip: ['compact', 'peach', 'hourglass'],
  eye: ['ruby', 'sapphire', 'amethyst', 'amber', 'emerald', 'heterochromia'],
} as const;

const FEMALE_HAIR_OPTION_IDS = ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'classic_bob', 'bangs', 'high_ponytail', 'half_up', 'wool_curls'] as const;
const MALE_HAIR_OPTION_IDS = ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'afro', 'buzz_cut', 'mohawk', 'slick_back'] as const;
const NONBINARY_HAIR_OPTION_IDS = FEMALE_HAIR_OPTION_IDS;
const NO_NONBINARY_EYE_OPTION_IDS: [] = [];

export const CREATE_CHARACTER_FANTASY_SPECIES_IDS = [
  'succubus',
  'elf',
  'beastkin',
  'vampire',
  'angel',
  'slime_tentacle',
] as const;
export type CreateCharacterFantasySpeciesId = (typeof CREATE_CHARACTER_FANTASY_SPECIES_IDS)[number];

const FANTASY_SPECIES_STEMS = {
  female: {
    succubus: '魅魔',
    elf: '纯洁 : 堕落精灵',
    beastkin: '狐仙 : 猫娘兽人',
    vampire: '吸血鬼贵族',
    angel: '堕天圣天使',
    slime_tentacle: '触手 : 史莱姆异种姬',
  },
  male: {
    succubus: '魅魔',
    elf: '纯洁 : 堕落精灵',
    beastkin: '狐仙 : 猫娘兽人',
    vampire: '吸血鬼贵族',
    angel: '堕天圣天使',
    slime_tentacle: '触手 : 史莱姆异种',
  },
} as const;
const FANTASY_SPECIES_PREVIEW_RACES: Record<CreateCharacterFantasySpeciesId, CreateCharacterOptionId<'race'>> = {
  succubus: 'latina',
  elf: 'east_asian',
  beastkin: 'caucasian',
  vampire: 'middle_eastern',
  angel: 'south_asian',
  slime_tentacle: 'black',
};
const FANTASY_SPECIES_UNSTYLED_VIDEOS = {
  female: {
    beastkin: '狐仙 : 猫娘兽人',
    angel: '堕天圣天使',
    slime_tentacle: '触手 : 史莱姆异种姬',
  },
  male: {
    elf: '纯洁 : 堕落精灵',
  },
} as const;

export type CreateCharacterOptionCategory = keyof typeof CREATE_CHARACTER_OPTION_IDS;
export type CreateCharacterOptionId<C extends CreateCharacterOptionCategory> =
  (typeof CREATE_CHARACTER_OPTION_IDS)[C][number];

export interface CreateCharacterOptionAsset {
  src: string;
  srcSet?: string;
  video?: string;
  fallback: boolean;
}

export interface CreateCharacterMainMedia {
  poster: string;
  posterSrcSet: string;
  video: string;
}

type CreateCharacterOptionAssetMap = {
  [C in CreateCharacterOptionCategory]: Partial<Record<CreateCharacterOptionId<C>, CreateCharacterOptionAsset>>;
};

interface CreateCharacterGenderAssets {
  main: Record<CreateCharacterArtStyle, CreateCharacterMainMedia>;
  options: Record<CreateCharacterArtStyle, CreateCharacterOptionAssetMap>;
}

export interface CreateCharacterAssetCopy {
  source: string;
  target: string;
  kind: 'image' | 'video';
  maxWidth?: number;
  maxHeight?: number;
  maxBytes?: number;
}

const ASSET_ROOT = '/create-character';
const V2_ASSET_ROOT = `${ASSET_ROOT}/v2`;
const V5_ASSET_ROOT = `${ASSET_ROOT}/assets/v5`;
const GENDERS: CreateCharacterGender[] = ['female', 'male', 'nonbinary'];
const ART_STYLES: CreateCharacterArtStyle[] = ['anime', 'realistic'];
const assetCopies = new Map<string, CreateCharacterAssetCopy>();

function registerAsset(copy: CreateCharacterAssetCopy) {
  const {source, target} = copy;
  const existing = assetCopies.get(target);
  if (existing && existing.source !== source) {
    throw new Error(`Conflicting create-character asset target ${target}: ${existing.source} and ${source}`);
  }
  assetCopies.set(target, copy);
}

function responsiveImage(source: string, targetStem: string, widths: readonly number[]) {
  const targets = widths.map((width) => `${targetStem}-${width}.webp`);
  targets.forEach((target, index) => registerAsset({source, target, kind: 'image', maxWidth: widths[index]}));
  return {
    src: targets[targets.length - 1],
    srcSet: targets.map((target, index) => `${target} ${widths[index]}w`).join(', '),
  };
}

function optimizedVideo(source: string, target: string, maxHeight: number, maxBytes: number) {
  registerAsset({source, target, kind: 'video', maxHeight, maxBytes});
  return target;
}

const STYLE_SUFFIX = { anime: '二次元', realistic: '写实' } as const;
const MALE_STEMS = {
  race: { east_asian: '亚洲人', caucasian: '白人', latina: '拉丁裔', black: '黑人', middle_eastern: '阿拉伯人', south_asian: '印度人' },
  skin: { porcelain: '冷白皮 : 珍珠纯白', peach: '蜜桃粉白 : 微醺泛红', olive_tan: '小麦色 : 健康蜜糖', ebony_black: '巧克力黑曜皮 : 爆棚野性', anime_white: '月光冷白' },
  face: { v_line: '锋利V型下颌', oval: '经典温润鹅蛋脸', chubby: '软萌圆润少年感', sculpted: '立体雕塑高颧骨' },
  hair: { waves: '长卷发', bob: '中分短直', twin_tails: '低马尾', hime_cut: '侧分刘海', wolf_cut: '纹理短发', afro: '爆炸头', buzz_cut: '寸头', mohawk: '短莫霍克', slick_back: '复古背头' },
  body: { curvy: '圆润壮实软肉', slim: '修长清瘦骨感', athletic: '精瘦健美腹肌', tall_model: '厚实雄壮宽肩' },
  chest: { flat: '平坦清瘦胸', natural: '匀称结实胸肌', full: '厚实宽厚胸肌', voluptuous: '夸张发达胸肌' },
  hip: { compact: '紧致挺翘臀', peach: '圆润结实蜜桃臀', hourglass: '夸张宽厚翘臀' },
  eye: { ruby: '发情魅惑红瞳', sapphire: '深邃宝石蓝瞳', amethyst: '妖娆魅惑紫瞳', amber: '琥珀兽性金瞳', emerald: '翡翠清澈绿瞳', heterochromia: '异色双瞳' },
} as const;
const FEMALE_STEMS = {
  race: { east_asian: '东方-亚洲绝色', caucasian: '欧美-极致立体', latina: '拉丁-热情热辣', black: '黑人-巧克力黑耀美姬', middle_eastern: '中东-阿拉伯异域', south_asian: '南亚-异域古铜蜜姬' },
  skin: { porcelain: '冷白皮 : 珍珠纯白', peach: '蜜桃粉白 : 微醺泛红', olive_tan: '小麦色 : 健康蜜糖光泽', ebony_black: '巧克力黑曜皮 : 爆棚野性', anime_white: '二次元发光冷白' },
  face: { v_line: '精致瓜子脸', oval: '经典古典鹅蛋脸', chubby: '胶原蛋白婴儿肥', sculpted: '欧美超模立体高颧骨' },
  hair: { waves: '风情大波浪卷发', bob: '干练性感 Bob 短发', twin_tails: '双麻花辫', hime_cut: '姬发式黑长直人妻切', wolf_cut: '野性狼尾碎发', classic_bob: '复古波波头', bangs: '齐刘海', high_ponytail: '青春高马尾', half_up: '随性半扎发', wool_curls: '可爱羊毛卷' },
  body: { curvy: '丰满肉感s曲线', slim: '纤细苗条 骨感轻盈', athletic: '健美紧致 蜜桃腰腹', tall_model: '臃肿肥胖 可爱肉肉' },
  chest: { flat: '秀气可人', natural: '匀称挺拔', full: '傲人深沟', voluptuous: '爆乳巨乳' },
  hip: { compact: '紧致挺拔翘臀', peach: '性感饱满蜜桃臀', hourglass: '极致沙漏大观臀' },
  eye: { ruby: '发情魅惑红瞳', sapphire: '深邃宝石蓝瞳', amethyst: '妖娆魅惑紫瞳', amber: '琥珀兽性金瞳', emerald: '翡翠清澈绿瞳', heterochromia: '异色双瞳' },
} as const;

export function getCreateCharacterOptionIds<C extends CreateCharacterOptionCategory>(
  gender: CreateCharacterGender,
  category: C,
): readonly CreateCharacterOptionId<C>[] {
  if (gender === 'nonbinary' && category === 'eye') return NO_NONBINARY_EYE_OPTION_IDS as readonly CreateCharacterOptionId<C>[];
  if (category !== 'hair') return CREATE_CHARACTER_OPTION_IDS[category];
  const hairIds = gender === 'female'
    ? FEMALE_HAIR_OPTION_IDS
    : gender === 'male'
      ? MALE_HAIR_OPTION_IDS
      : NONBINARY_HAIR_OPTION_IDS;
  return hairIds as readonly CreateCharacterOptionId<C>[];
}

function v2OptionAsset<C extends CreateCharacterOptionCategory>(gender: CreateCharacterGender, artStyle: CreateCharacterArtStyle, category: C, id: CreateCharacterOptionId<C>): CreateCharacterOptionAsset {
  const stems = gender === 'male' ? MALE_STEMS : FEMALE_STEMS;
  const stem = (stems[category] as Record<string, string>)[id];
  if (!stem) throw new Error(`Missing create-character source mapping for ${gender}/${category}/${id}`);
  const categoryFolder = category === 'race' ? '种族' : category === 'skin' ? '肤色' : category === 'face' ? '脸型' : category === 'hair' ? '发型' : category === 'body' ? '身材' : category === 'chest' ? '胸部尺寸' : category === 'hip' ? '臀围' : '瞳色';
  const genderFolder = gender === 'female' ? '女' : gender === 'male' ? '男' : '非二元';
  const folder = `${V2_ASSET_ROOT}/${categoryFolder}${genderFolder}`;
  const singleStyleHair = category === 'hair' && (id === 'afro' || id === 'bob' && gender === 'male' || id === 'classic_bob' || id === 'bangs');
  const race = category === 'race';
  const nonMaleAnimePlain = gender !== 'male' && race;
  const nonMaleBodyAnimePlain = gender !== 'male' && category === 'body' && artStyle === 'anime';
  const suffix = singleStyleHair || nonMaleAnimePlain || nonMaleBodyAnimePlain ? '' : artStyle === 'anime' ? (race ? '二次元' : '_二次元') : (race ? '写实' : '_写实');
  const assetStem = stem.replaceAll(' : ', '-');
  const target = `${V5_ASSET_ROOT}/options/${gender}/${artStyle}/${category}/${id}`;
  const image = responsiveImage(`${folder}/${assetStem}${suffix}.jpg`, target, [256, 384]);
  const hasVideo = race || gender !== 'male' && ['body', 'chest', 'hip'].includes(category);
  if (!hasVideo) return { ...image, fallback: false };
  const videoSuffix = race
    ? artStyle === 'anime' ? gender === 'male' ? '二次元动效' : '动效' : gender === 'male' && id === 'black' ? '写实动效图' : '写实动效'
    : artStyle === 'anime' ? (category === 'body' ? '动效' : '_二次元动效') : '_写实动效';
  return {
    ...image,
    video: optimizedVideo(`${folder}/${assetStem}${videoSuffix}.mp4`, `${target}.mp4`, 540, 2 * 1024 * 1024),
    fallback: false,
  };
}

function createMainMedia(gender: CreateCharacterGender, artStyle: CreateCharacterArtStyle): CreateCharacterMainMedia {
  const source = gender === 'nonbinary'
    ? {
      poster: `${V2_ASSET_ROOT}/非二元性别/${artStyle === 'anime' ? '二次元' : '写实'}.jpg`,
      video: `${V2_ASSET_ROOT}/非二元性别/${artStyle === 'anime' ? '动效' : '写实动效'}.mp4`,
    }
    : {
      poster: `${V2_ASSET_ROOT}/${gender === 'female' ? '创建女角色' : '创建男角色'}/${gender === 'female' && artStyle === 'anime' ? '二次元动效' : artStyle === 'anime' ? '二次元' : '写实'}.jpg`,
      video: `${V2_ASSET_ROOT}/${gender === 'female' ? '创建女角色' : '创建男角色'}/${artStyle === 'anime' ? '二次元动效' : '写实动效'}.mp4`,
    };
  const target = `${V5_ASSET_ROOT}/main/${gender}/${artStyle}`;
  const poster = responsiveImage(source.poster, `${target}/poster`, [480, 768]);
  return {
    poster: poster.src,
    posterSrcSet: poster.srcSet,
    video: optimizedVideo(source.video, `${target}/preview.mp4`, 720, 3 * 1024 * 1024),
  };
}

function createCategoryAssets<C extends CreateCharacterOptionCategory>(
  gender: CreateCharacterGender,
  artStyle: CreateCharacterArtStyle,
  category: C,
): Partial<Record<CreateCharacterOptionId<C>, CreateCharacterOptionAsset>> {
  return Object.fromEntries(
    getCreateCharacterOptionIds(gender, category).map((id) => [
      id,
      v2OptionAsset(gender, artStyle, category, id),
    ]),
  ) as Partial<Record<CreateCharacterOptionId<C>, CreateCharacterOptionAsset>>;
}

function createOptionAssets(
  gender: CreateCharacterGender,
  artStyle: CreateCharacterArtStyle,
): CreateCharacterOptionAssetMap {
  return {
    race: createCategoryAssets(gender, artStyle, 'race'),
    skin: createCategoryAssets(gender, artStyle, 'skin'),
    face: createCategoryAssets(gender, artStyle, 'face'),
    hair: createCategoryAssets(gender, artStyle, 'hair'),
    body: createCategoryAssets(gender, artStyle, 'body'),
    chest: createCategoryAssets(gender, artStyle, 'chest'),
    hip: createCategoryAssets(gender, artStyle, 'hip'),
    eye: createCategoryAssets(gender, artStyle, 'eye'),
  };
}

export const CREATE_CHARACTER_ASSET_MANIFEST = Object.fromEntries(
  GENDERS.map((gender) => [
    gender,
    {
      main: Object.fromEntries(
        ART_STYLES.map((artStyle) => [
          artStyle,
          createMainMedia(gender, artStyle),
        ]),
      ),
      options: Object.fromEntries(
        ART_STYLES.map((artStyle) => [artStyle, createOptionAssets(gender, artStyle)]),
      ),
    },
  ]),
) as Record<CreateCharacterGender, CreateCharacterGenderAssets>;

const CREATE_CHARACTER_FANTASY_ASSET_MANIFEST = Object.fromEntries(
  (['female', 'male'] as const).map((gender) => [
    gender,
    Object.fromEntries(ART_STYLES.map((artStyle) => [
      artStyle,
      Object.fromEntries(CREATE_CHARACTER_FANTASY_SPECIES_IDS.map((speciesId) => {
        const stem = FANTASY_SPECIES_STEMS[gender][speciesId];
        const folder = `${V2_ASSET_ROOT}/种族${gender === 'female' ? '女' : '男'}`;
        const assetStem = stem.replaceAll(' : ', '-');
        const styleSuffix = artStyle === 'anime' ? '二次元' : '写实';
        const unstylizedVideoStem = (FANTASY_SPECIES_UNSTYLED_VIDEOS[gender] as Record<string, string>)[speciesId];
        const videoStem = unstylizedVideoStem ? unstylizedVideoStem.replaceAll(' : ', '-') : `${assetStem}${styleSuffix}`;
        const target = `${V5_ASSET_ROOT}/fantasy/${gender}/${artStyle}/${speciesId}`;
        const image = responsiveImage(`${folder}/${assetStem}${styleSuffix}.jpg`, target, [256, 384]);
        return [speciesId, {
          ...image,
          video: optimizedVideo(`${folder}/${videoStem}.mp4`, `${target}.mp4`, 540, 2 * 1024 * 1024),
          fallback: false,
        }];
      })),
    ])),
  ]),
) as Record<'female' | 'male', Record<CreateCharacterArtStyle, Record<CreateCharacterFantasySpeciesId, CreateCharacterOptionAsset>>>;

export const CREATE_CHARACTER_ASSET_COPY_PLAN: CreateCharacterAssetCopy[] = [...assetCopies.values()];

export const CREATE_CHARACTER_MISSING_ASSETS: string[] = [];

export function getCreateCharacterMainPreviewAsset(
  gender: GenderType,
  artStyle: ArtStyleType,
): CreateCharacterOptionAsset {
  const normalizedGender = normalizeCreateCharacterGender(gender);
  const normalizedArtStyle = normalizeCreateCharacterArtStyle(artStyle);
  const media = CREATE_CHARACTER_ASSET_MANIFEST[normalizedGender].main[normalizedArtStyle];
  return { src: media.poster, srcSet: media.posterSrcSet, video: media.video, fallback: false };
}

export function normalizeCreateCharacterAssetUrl(url: string): string {
  if (!url || /^https?:\/\//i.test(url) || /%[0-9a-f]{2}/i.test(url)) return url;
  return encodeURI(url);
}

export function normalizeCreateCharacterGender(gender: GenderType): CreateCharacterGender {
  return gender === 'all' ? 'female' : gender;
}

export function normalizeCreateCharacterArtStyle(artStyle: ArtStyleType): CreateCharacterArtStyle {
  return artStyle === 'all' ? 'anime' : artStyle;
}

export function getCreateCharacterOptionAsset<C extends CreateCharacterOptionCategory>(
  gender: GenderType,
  artStyle: ArtStyleType,
  category: C,
  id: string,
): CreateCharacterOptionAsset {
  const normalizedGender = normalizeCreateCharacterGender(gender);
  const normalizedArtStyle = normalizeCreateCharacterArtStyle(artStyle);
  const categoryAssets = CREATE_CHARACTER_ASSET_MANIFEST[normalizedGender].options[normalizedArtStyle][category] as Record<string, CreateCharacterOptionAsset>;
  const asset = categoryAssets[id];
  if (!asset) throw new Error(`No create-character asset for ${normalizedGender}/${normalizedArtStyle}/${category}/${id}`);
  return asset;
}

export function getCreateCharacterFantasySpeciesAsset(
  gender: GenderType,
  artStyle: ArtStyleType,
  speciesId: string,
): CreateCharacterOptionAsset {
  const normalizedGender = normalizeCreateCharacterGender(gender);
  const normalizedArtStyle = normalizeCreateCharacterArtStyle(artStyle);
  if (normalizedGender === 'nonbinary') {
    const previewRace = FANTASY_SPECIES_PREVIEW_RACES[speciesId as CreateCharacterFantasySpeciesId] || 'east_asian';
    return getCreateCharacterOptionAsset(gender, artStyle, 'race', previewRace);
  }
  const asset = CREATE_CHARACTER_FANTASY_ASSET_MANIFEST[normalizedGender][normalizedArtStyle][speciesId as CreateCharacterFantasySpeciesId];
  if (!asset) throw new Error(`No create-character fantasy species asset for ${normalizedGender}/${normalizedArtStyle}/${speciesId}`);
  return asset;
}

type CreateCharacterOptionLabelMap = {
  [C in CreateCharacterOptionCategory]: Record<CreateCharacterOptionId<C>, string>;
};

const BASE_OPTION_LABELS: Record<string, CreateCharacterOptionLabelMap> = {
  en: {
    race: { east_asian: 'East Asian', caucasian: 'European', latina: 'Latina', black: 'Black', middle_eastern: 'Middle Eastern', south_asian: 'South Asian' },
    skin: { porcelain: 'Porcelain white', peach: 'Peach blush', olive_tan: 'Olive tan', ebony_black: 'Ebony black', anime_white: 'Anime cool white' },
    face: { v_line: 'V-line', oval: 'Classic oval', chubby: 'Soft baby face', sculpted: 'Sculpted model' },
    hair: { waves: 'Long waves', bob: 'Confident bob', twin_tails: 'Double braids', hime_cut: 'Hime cut', wolf_cut: 'Wolf cut', afro: 'Afro', buzz_cut: 'Buzz cut', mohawk: 'Short mohawk', slick_back: 'Classic slick back', classic_bob: 'Classic bob', bangs: 'Straight bangs', high_ponytail: 'High ponytail', half_up: 'Half-up hair', wool_curls: 'Wool curls' },
    body: { curvy: 'Curvy S-shape', slim: 'Slim petite', athletic: 'Fit and athletic', tall_model: 'Soft plus-size' },
    chest: { flat: 'Small (A cup)', natural: 'Natural (B-C cup)', full: 'Full (D-E cup)', voluptuous: 'Voluptuous (G+ cup)' },
    hip: { compact: 'Compact and lifted', peach: 'Full peach shape', hourglass: 'Hourglass curve' },
    eye: { ruby: 'Alluring ruby red', sapphire: 'Deep sapphire blue', amethyst: 'Enchanting amethyst purple', amber: 'Amber gold', emerald: 'Clear emerald green', heterochromia: 'Heterochromia' },
  },
  'zh-CN': {
    race: { east_asian: '东方 / 亚洲', caucasian: '欧美', latina: '拉丁', black: '黑人', middle_eastern: '中东 / 阿拉伯', south_asian: '南亚 / 印度' },
    skin: { porcelain: '冷白皮 / 珍珠纯白', peach: '蜜桃粉白 / 微醺泛红', olive_tan: '小麦色 / 健康蜜糖', ebony_black: '巧克力黑曜皮', anime_white: '二次元发光冷白' },
    face: { v_line: '精致瓜子脸', oval: '经典鹅蛋脸', chubby: '胶原婴儿肥', sculpted: '立体高颧骨' },
    hair: { waves: '风情大波浪卷发', bob: '干练性感短发', twin_tails: '双麻花辫', hime_cut: '姬发式黑长直', wolf_cut: '野性狼尾碎发', afro: '爆炸头', buzz_cut: '寸头', mohawk: '短莫霍克', slick_back: '复古背头', classic_bob: '复古波波头', bangs: '齐刘海', high_ponytail: '青春高马尾', half_up: '随性半扎发', wool_curls: '可爱羊毛卷' },
    body: { curvy: '丰满肉感 S 曲线', slim: '纤细苗条', athletic: '健美紧致', tall_model: '丰满柔软体型' },
    chest: { flat: '秀气平胸', natural: '匀称挺拔', full: '傲人丰满', voluptuous: '丰盈曲线' },
    hip: { compact: '紧致挺拔翘臀', peach: '饱满蜜桃臀', hourglass: '沙漏曲线臀' },
    eye: { ruby: '发情魅惑红瞳', sapphire: '深邃宝石蓝瞳', amethyst: '妖娆魅惑紫瞳', amber: '琥珀兽性金瞳', emerald: '翡翠清澈绿瞳', heterochromia: '异色双瞳' },
  },
  ja: {
    race: { east_asian: '東アジア系', caucasian: '欧米系', latina: 'ラテン系', black: '黒人', middle_eastern: '中東系', south_asian: '南アジア系' },
    skin: { porcelain: '透き通る白肌', peach: 'ピーチブラッシュ', olive_tan: '小麦色', ebony_black: 'エボニーブラック', anime_white: 'アニメ調クールホワイト' },
    face: { v_line: 'シャープなVライン', oval: 'クラシックな卵型', chubby: '柔らかな丸顔', sculpted: '立体的なハイチーク' },
    hair: { waves: 'ロングウェーブ', bob: 'シャープなボブ', twin_tails: 'ツインブレイド', hime_cut: '姫カット', wolf_cut: 'ウルフカット', afro: 'アフロ', buzz_cut: '丸刈り', mohawk: 'ショートモヒカン', slick_back: 'クラシックなオールバック', classic_bob: 'クラシックボブ', bangs: 'ストレートバング', high_ponytail: '高めポニーテール', half_up: 'ハーフアップ', wool_curls: 'ふわふわカーリーヘア' },
    body: { curvy: '豊かなSライン', slim: 'スリム体型', athletic: '引き締まった体型', tall_model: 'ふくよかな体型' },
    chest: { flat: '小さめ（Aカップ）', natural: '自然（B-Cカップ）', full: '豊か（D-Eカップ）', voluptuous: 'ボリューム（Gカップ以上）' },
    hip: { compact: '引き締まったヒップ', peach: 'ピーチヒップ', hourglass: '砂時計型カーブ' },
    eye: { ruby: '魅惑のルビーレッド', sapphire: '深いサファイアブルー', amethyst: '妖艶なアメジストパープル', amber: '琥珀のゴールド', emerald: '澄んだエメラルドグリーン', heterochromia: 'オッドアイ' },
  },
  ko: {
    race: { east_asian: '동아시아계', caucasian: '유럽계', latina: '라틴계', black: '흑인', middle_eastern: '중동계', south_asian: '남아시아계' },
    skin: { porcelain: '도자기빛 흰 피부', peach: '복숭아빛 피부', olive_tan: '올리브 태닝', ebony_black: '에보니 블랙', anime_white: '애니메이션 쿨 화이트' },
    face: { v_line: '날렵한 V라인', oval: '클래식 타원형', chubby: '부드러운 동안형', sculpted: '입체적인 광대형' },
    hair: { waves: '긴 웨이브', bob: '세련된 보브컷', twin_tails: '양갈래 땋은 머리', hime_cut: '히메컷', wolf_cut: '울프컷', afro: '아프로', buzz_cut: '삭발', mohawk: '짧은 모히칸', slick_back: '클래식 올백', classic_bob: '클래식 보브', bangs: '스트레이트 앞머리', high_ponytail: '높은 포니테일', half_up: '하프업', wool_curls: '폭신한 곱슬머리' },
    body: { curvy: '풍만한 S라인', slim: '슬림 체형', athletic: '탄탄한 체형', tall_model: '포근한 플러스 사이즈' },
    chest: { flat: '작은 사이즈(A컵)', natural: '내추럴(B-C컵)', full: '볼륨(D-E컵)', voluptuous: '글래머러스(G컵 이상)' },
    hip: { compact: '탄탄하게 올라간 힙', peach: '풍만한 피치 힙', hourglass: '모래시계형 힙' },
    eye: { ruby: '매혹적인 루비 레드', sapphire: '깊은 사파이어 블루', amethyst: '요염한 자수정 퍼플', amber: '호박빛 골드', emerald: '맑은 에메랄드 그린', heterochromia: '오드아이' },
  },
  es: {
    race: { east_asian: 'Asia oriental', caucasian: 'Europeo', latina: 'Latina', black: 'Negro', middle_eastern: 'Oriente Medio', south_asian: 'Asia del Sur' },
    skin: { porcelain: 'Blanco porcelana', peach: 'Rubor melocotón', olive_tan: 'Bronceado oliva', ebony_black: 'Ébano oscuro', anime_white: 'Blanco frío anime' },
    face: { v_line: 'Mandíbula en V', oval: 'Óvalo clásico', chubby: 'Rostro juvenil y suave', sculpted: 'Rostro de modelo esculpido' },
    hair: { waves: 'Ondas largas', bob: 'Bob definido', twin_tails: 'Dos trenzas', hime_cut: 'Corte hime', wolf_cut: 'Corte wolf', afro: 'Afro', buzz_cut: 'Rapado', mohawk: 'Mohicano corto', slick_back: 'Peinado hacia atrás clásico', classic_bob: 'Bob clásico', bangs: 'Flequillo recto', high_ponytail: 'Coleta alta', half_up: 'Semirrecogido', wool_curls: 'Rizos suaves' },
    body: { curvy: 'Curvas en S', slim: 'Delgado y pequeño', athletic: 'Atlético y tonificado', tall_model: 'Curvas suaves de talla grande' },
    chest: { flat: 'Pequeño (copa A)', natural: 'Natural (copa B-C)', full: 'Voluminoso (copa D-E)', voluptuous: 'Muy voluminoso (copa G+)' },
    hip: { compact: 'Compacto y elevado', peach: 'Forma de melocotón', hourglass: 'Curva de reloj de arena' },
    eye: { ruby: 'Rojo rubí seductor', sapphire: 'Azul zafiro profundo', amethyst: 'Violeta amatista', amber: 'Dorado ámbar', emerald: 'Verde esmeralda claro', heterochromia: 'Heterocromía' },
  },
  pt: {
    race: { east_asian: 'Leste asiático', caucasian: 'Europeu', latina: 'Latino', black: 'Negro', middle_eastern: 'Oriente Médio', south_asian: 'Sul asiático' },
    skin: { porcelain: 'Branco porcelana', peach: 'Rubor pêssego', olive_tan: 'Bronzeado oliva', ebony_black: 'Ébano escuro', anime_white: 'Branco frio de anime' },
    face: { v_line: 'Mandíbula em V', oval: 'Oval clássico', chubby: 'Rosto jovem e suave', sculpted: 'Rosto de modelo esculpido' },
    hair: { waves: 'Ondas longas', bob: 'Bob marcante', twin_tails: 'Duas tranças', hime_cut: 'Corte hime', wolf_cut: 'Corte wolf', afro: 'Afro', buzz_cut: 'Raspado', mohawk: 'Moicano curto', slick_back: 'Penteado clássico para trás', classic_bob: 'Bob clássico', bangs: 'Franja reta', high_ponytail: 'Rabo de cavalo alto', half_up: 'Meio preso', wool_curls: 'Cachos macios' },
    body: { curvy: 'Curvas em S', slim: 'Magro e delicado', athletic: 'Atlético e definido', tall_model: 'Curvas suaves de tamanho grande' },
    chest: { flat: 'Pequeno (taça A)', natural: 'Natural (taça B-C)', full: 'Volumoso (taça D-E)', voluptuous: 'Muito volumoso (taça G+)' },
    hip: { compact: 'Compacto e elevado', peach: 'Formato pêssego', hourglass: 'Curva ampulheta' },
    eye: { ruby: 'Vermelho rubi sedutor', sapphire: 'Azul safira profundo', amethyst: 'Violeta ametista', amber: 'Dourado âmbar', emerald: 'Verde esmeralda claro', heterochromia: 'Heterocromia' },
  },};

type MaleOptionLabelOverrides = {
  [C in CreateCharacterOptionCategory]?: Partial<Record<CreateCharacterOptionId<C>, string>>;
};

const MALE_OPTION_LABEL_OVERRIDES: Record<string, MaleOptionLabelOverrides> = {
  en: {
    race: { caucasian: 'White', south_asian: 'South Asian / Indian' },
    skin: { anime_white: 'Moonlight cool white' },
    face: { v_line: 'Sharp V-shaped jaw', oval: 'Classic soft oval', chubby: 'Soft round youthful face', sculpted: 'Sculpted high cheekbones' },
    hair: { waves: 'Long curls', bob: 'Center-parted straight crop', twin_tails: 'Low ponytail', hime_cut: 'Side-swept fringe', wolf_cut: 'Textured short cut', afro: 'Afro', buzz_cut: 'Buzz cut', mohawk: 'Short mohawk', slick_back: 'Classic slick back' },
    body: { curvy: 'Rounded sturdy build', slim: 'Tall and lean', athletic: 'Lean muscular abs', tall_model: 'Broad-shouldered muscular' },
    chest: { flat: 'Flat lean chest', natural: 'Balanced firm chest', full: 'Thick broad chest', voluptuous: 'Developed muscular chest' },
    hip: { compact: 'Tight lifted hips', peach: 'Rounded peach shape', hourglass: 'Broad pronounced hips' },
  },
  'zh-CN': {
    race: { caucasian: '白人', south_asian: '南亚 / 印度' },
    skin: { anime_white: '月光冷白' },
    face: { v_line: '锋利 V 型下颌', oval: '经典温润鹅蛋脸', chubby: '软萌圆润少年感', sculpted: '立体雕塑高颧骨' },
    hair: { waves: '长卷发', bob: '中分短直发', twin_tails: '低马尾', hime_cut: '侧分刘海', wolf_cut: '纹理短发', afro: '爆炸头', buzz_cut: '寸头', mohawk: '短莫霍克', slick_back: '复古背头' },
    body: { curvy: '圆润壮实软肉', slim: '修长清瘦骨感', athletic: '精瘦健美腹肌', tall_model: '厚实雄壮宽肩' },
    chest: { flat: '平坦清瘦胸肌', natural: '匀称结实胸肌', full: '厚实宽厚胸肌', voluptuous: '夸张发达胸肌' },
    hip: { compact: '紧致挺翘臀', peach: '圆润结实蜜桃臀', hourglass: '夸张宽厚翘臀' },
  },
  ja: {
    race: { caucasian: '白人', south_asian: '南アジア / インド系' },
    skin: { anime_white: '月光のような白肌' },
    face: { v_line: '鋭いV型の顎', oval: '穏やかな卵型', chubby: '柔らかな少年顔', sculpted: '彫刻的なハイチーク' },
    hair: { waves: 'ロングカール', bob: 'センターパートのショート', twin_tails: 'ローポニーテール', hime_cut: 'サイドバング', wolf_cut: 'テクスチャーショート', afro: 'アフロ', buzz_cut: '丸刈り', mohawk: 'ショートモヒカン', slick_back: 'オールバック' },
    body: { curvy: '丸みのあるがっしり体型', slim: 'すらりと細身', athletic: '細身の筋肉質', tall_model: '厚みのある広い肩' },
    chest: { flat: '細身でフラットな胸板', natural: '均整の取れた胸板', full: '厚く広い胸板', voluptuous: '発達した胸筋' },
    hip: { compact: '引き締まったヒップ', peach: '丸みのあるヒップ', hourglass: '幅広く力強いヒップ' },
  },
  ko: {
    race: { caucasian: '백인', south_asian: '남아시아 / 인도계' },
    skin: { anime_white: '달빛처럼 차가운 흰 피부' },
    face: { v_line: '날카로운 V형 턱선', oval: '부드러운 타원형', chubby: '둥글고 앳된 얼굴', sculpted: '조각 같은 광대형' },
    hair: { waves: '긴 곱슬머리', bob: '가르마 짧은 생머리', twin_tails: '낮은 포니테일', hime_cut: '사이드뱅', wolf_cut: '텍스처 쇼트컷', afro: '아프로', buzz_cut: '삭발', mohawk: '짧은 모히칸', slick_back: '올백 헤어' },
    body: { curvy: '둥글고 탄탄한 체형', slim: '길고 마른 체형', athletic: '마른 근육질 복근', tall_model: '넓은 어깨의 근육질' },
    chest: { flat: '평평하고 마른 가슴', natural: '균형 잡힌 단단한 가슴', full: '두껍고 넓은 가슴', voluptuous: '발달한 가슴 근육' },
    hip: { compact: '탄탄하게 올라간 힙', peach: '둥근 피치 힙', hourglass: '넓고 힘 있는 힙' },
  },
  es: {
    race: { caucasian: 'Blanco', south_asian: 'Asia del Sur / India' },
    skin: { anime_white: 'Blanco frío de luz lunar' },
    face: { v_line: 'Mandíbula afilada en V', oval: 'Óvalo clásico y suave', chubby: 'Rostro redondo y juvenil', sculpted: 'Pómulos altos esculpidos' },
    hair: { waves: 'Rizos largos', bob: 'Corte corto con raya al medio', twin_tails: 'Coleta baja', hime_cut: 'Flequillo lateral', wolf_cut: 'Corte corto texturizado', afro: 'Afro', buzz_cut: 'Rapado', mohawk: 'Mohicano corto', slick_back: 'Peinado hacia atrás clásico' },
    body: { curvy: 'Complexión robusta y redondeada', slim: 'Alto y delgado', athletic: 'Musculatura definida', tall_model: 'Musculoso de hombros anchos' },
    chest: { flat: 'Pecho plano y delgado', natural: 'Pecho firme y equilibrado', full: 'Pecho ancho y fuerte', voluptuous: 'Pectorales muy desarrollados' },
    hip: { compact: 'Caderas firmes y elevadas', peach: 'Forma redondeada', hourglass: 'Caderas anchas y marcadas' },
  },
  pt: {
    race: { caucasian: 'Branco', south_asian: 'Sul asiático / indiano' },
    skin: { anime_white: 'Branco frio de luar' },
    face: { v_line: 'Mandíbula afiada em V', oval: 'Oval clássico e suave', chubby: 'Rosto redondo e jovem', sculpted: 'Maçãs do rosto altas e esculpidas' },
    hair: { waves: 'Cachos longos', bob: 'Corte curto repartido ao meio', twin_tails: 'Rabo de cavalo baixo', hime_cut: 'Franja lateral', wolf_cut: 'Corte curto texturizado', afro: 'Afro', buzz_cut: 'Raspado', mohawk: 'Moicano curto', slick_back: 'Penteado clássico para trás' },
    body: { curvy: 'Corpo robusto e arredondado', slim: 'Alto e magro', athletic: 'Musculatura definida', tall_model: 'Musculoso de ombros largos' },
    chest: { flat: 'Peito plano e magro', natural: 'Peito firme e equilibrado', full: 'Peito largo e forte', voluptuous: 'Peitorais muito desenvolvidos' },
    hip: { compact: 'Quadris firmes e elevados', peach: 'Formato arredondado', hourglass: 'Quadris largos e marcantes' },
  },};

export function getCreateCharacterOptionLabel<C extends CreateCharacterOptionCategory>(
  locale: Locale,
  gender: GenderType,
  category: C,
  id: string,
): string {
  const normalizedGender = normalizeCreateCharacterGender(gender);
  const maleOverrides = MALE_OPTION_LABEL_OVERRIDES[locale]?.[category] as Record<string, string> | undefined;
  if (normalizedGender === 'male' && maleOverrides?.[id]) return maleOverrides[id];
  const categoryLabels = BASE_OPTION_LABELS[locale]?.[category] || BASE_OPTION_LABELS.en[category] as Record<string, string>;
  return categoryLabels[id] ?? id;
}
