export interface GeneratorPreset {
  id: string;
  /** Canonical image basename, without extension. */
  name: string;
  imageUrl: string;
  imageSrcSet: string;
}

export interface GeneratorPresetAsset {
  source: string;
  target: string;
  maxWidth: number;
}

export const GENERATOR_DEFAULT_IMAGE = '/generator/generator-default.webp';

export const GENERATOR_PRESET_ASSET_PLAN: GeneratorPresetAsset[] = [];

const preset = (id: string, name: string, source: string): GeneratorPreset => {
  const targetStem = source.replace('/generator/new-assets/', '/generator/assets/v4/').replace(/\.(?:jpe?g|png|webp)$/i, '');
  const targets = [384, 640].map((maxWidth) => ({
    source,
    target: `${targetStem}-${maxWidth}.webp`,
    maxWidth,
  }));
  GENERATOR_PRESET_ASSET_PLAN.push(...targets);
  return {
    id,
    name,
    imageUrl: targets[1].target,
    imageSrcSet: targets.map(({target, maxWidth}) => `${target} ${maxWidth}w`).join(', '),
  };
};

export const posePresets: GeneratorPreset[] = [
  preset('pose-01', '站立后入', '/generator/new-assets/poses/pose-01.png'),
  preset('pose-02', '口交', '/generator/new-assets/poses/pose-02.png'),
  preset('pose-03', '肛交', '/generator/new-assets/poses/pose-03.png'),
  preset('pose-04', '骑乘式（牛仔）', '/generator/new-assets/poses/pose-04.png'),
  preset('pose-05', '深折交配按压', '/generator/new-assets/poses/pose-05.png'),
  preset('pose-06', '座椅式 : 椅子骑乘', '/generator/new-assets/poses/pose-06.jpeg'),
  preset('pose-07', '蝴蝶式', '/generator/new-assets/poses/pose-07.png'),
  preset('pose-08', '俯卧后入', '/generator/new-assets/poses/pose-08.png'),
  preset('pose-09', '站立壁裂', '/generator/new-assets/poses/pose-09.png'),
  preset('pose-10', '主导侧站立狗爬', '/generator/new-assets/poses/pose-10.png'),
  preset('pose-11', '抬腿传教士', '/generator/new-assets/poses/pose-11.jpg'),
  preset('pose-12', '站立', '/generator/new-assets/poses/pose-12.png'),
  preset('pose-13', '主导站立跨骑', '/generator/new-assets/poses/pose-13.png'),
  preset('pose-14', '后入式 : 狗爬式', '/generator/new-assets/poses/pose-14.png'),
  preset('pose-15', '双人穿透 : 双插', '/generator/new-assets/poses/pose-15.png'),
  preset('pose-16', '全尼尔森悬挂', '/generator/new-assets/poses/pose-16.png'),
  preset('pose-17', '跪姿骑乘', '/generator/new-assets/poses/pose-17.jpeg'),
  preset('pose-18', '反向骑乘', '/generator/new-assets/poses/pose-18.png'),
  preset('pose-19', '亚马逊式', '/generator/new-assets/poses/pose-19.jpeg'),
  preset('pose-20', '汤匙式 : 侧卧', '/generator/new-assets/poses/pose-20.png'),
  preset('pose-21', '莲花式', '/generator/new-assets/poses/pose-21.png'),
  preset('pose-22', '桩式', '/generator/new-assets/poses/pose-22.png'),
  preset('pose-23', '传教士', '/generator/new-assets/poses/pose-23.png'),
  preset('pose-24', '桥式', '/generator/new-assets/poses/pose-24.png'),
];

export const outfitPresets: GeneratorPreset[] = [
  preset('outfit-01', '警察 : 女警装', '/generator/new-assets/outfits/outfit-01.jpg'),
  preset('outfit-02', 'OL职业装', '/generator/new-assets/outfits/outfit-02.jpg'),
  preset('outfit-03', '学生装 : 校服', '/generator/new-assets/outfits/outfit-03.jpg'),
  preset('outfit-04', '情趣马甲 : 紧身胸衣', '/generator/new-assets/outfits/outfit-04.jpg'),
  preset('outfit-05', '医生白大褂', '/generator/new-assets/outfits/outfit-05.jpg'),
  preset('outfit-06', '开档内裤', '/generator/new-assets/outfits/outfit-06.png'),
  preset('outfit-07', '丁字裤 : T裤', '/generator/new-assets/outfits/outfit-07.jpg'),
  preset('outfit-08', '透明蕾丝内衣', '/generator/new-assets/outfits/outfit-08.jpg'),
  preset('outfit-09', '男士囊袋内裤', '/generator/new-assets/outfits/outfit-09.jpg'),
  preset('outfit-10', '女仆装', '/generator/new-assets/outfits/outfit-10.jpg'),
  preset('outfit-11', '皮革束缚衣', '/generator/new-assets/outfits/outfit-11.jpg'),
  preset('outfit-12', '乳胶紧身衣', '/generator/new-assets/outfits/outfit-12.jpg'),
  preset('outfit-13', '吊带袜与吊袜带', '/generator/new-assets/outfits/outfit-13.jpg'),
  preset('outfit-14', '可撕破内裤', '/generator/new-assets/outfits/outfit-14.jpg'),
  preset('outfit-15', '军装 : 迷彩', '/generator/new-assets/outfits/outfit-15.jpg'),
  preset('outfit-16', '空姐装', '/generator/new-assets/outfits/outfit-16.jpg'),
  preset('outfit-17', '体育教练 : 健身装', '/generator/new-assets/outfits/outfit-17.jpg'),
  preset('outfit-18', '护士装', '/generator/new-assets/outfits/outfit-18.jpg'),
  preset('outfit-19', '乳贴 : 乳头贴', '/generator/new-assets/outfits/outfit-19.jpg'),
  preset('outfit-20', '珍珠内裤', '/generator/new-assets/outfits/outfit-20.jpg'),
  preset('outfit-21', '连体网衣', '/generator/new-assets/outfits/outfit-21.jpg'),
  preset('outfit-22', '服务员 : 酒保装', '/generator/new-assets/outfits/outfit-22.jpg'),
];

export const scenePresets: GeneratorPreset[] = [
  preset('scene-01', '公共厕所隔间', '/generator/new-assets/scenes/scene-01.jpg'),
  preset('scene-02', '雨夜卧室', '/generator/new-assets/scenes/scene-02.jpg'),
  preset('scene-03', '只穿围裙厨房', '/generator/new-assets/scenes/scene-03.jpg'),
  preset('scene-04', '办公室', '/generator/new-assets/scenes/scene-04.jpg'),
  preset('scene-05', '豪华套房落地窗', '/generator/new-assets/scenes/scene-05.jpg'),
  preset('scene-06', '壁炉前', '/generator/new-assets/scenes/scene-06.jpg'),
  preset('scene-07', '网吧包间', '/generator/new-assets/scenes/scene-07.jpg'),
  preset('scene-08', '墓地', '/generator/new-assets/scenes/scene-08.jpg'),
  preset('scene-09', '试衣间', '/generator/new-assets/scenes/scene-09.jpg'),
  preset('scene-10', '酒店走廊', '/generator/new-assets/scenes/scene-10.jpg'),
  preset('scene-11', '酒房', '/generator/new-assets/scenes/scene-11.jpg'),
  preset('scene-12', '医院检查室', '/generator/new-assets/scenes/scene-12.jpg'),
  preset('scene-13', '卧室落地窗', '/generator/new-assets/scenes/scene-13.jpg'),
  preset('scene-14', '游乐场鬼屋', '/generator/new-assets/scenes/scene-14.jpg'),
  preset('scene-15', '图书馆', '/generator/new-assets/scenes/scene-15.jpg'),
  preset('scene-16', '电影院后排', '/generator/new-assets/scenes/scene-16.jpg'),
  preset('scene-17', '天文台穹顶', '/generator/new-assets/scenes/scene-17.jpg'),
  preset('scene-18', '浴室', '/generator/new-assets/scenes/scene-18.jpg'),
  preset('scene-19', '山顶观景台', '/generator/new-assets/scenes/scene-19.jpg'),
  preset('scene-20', '手术室', '/generator/new-assets/scenes/scene-20.jpg'),
  preset('scene-21', '剧院后台', '/generator/new-assets/scenes/scene-21.jpg'),
  preset('scene-22', '废弃工厂', '/generator/new-assets/scenes/scene-22.jpg'),
  preset('scene-23', '海边沙滩', '/generator/new-assets/scenes/scene-23.jpg'),
  preset('scene-24', '废墟教堂', '/generator/new-assets/scenes/scene-24.jpg'),
  preset('scene-25', '游泳池底部', '/generator/new-assets/scenes/scene-25.jpg'),
  preset('scene-26', '树林深处', '/generator/new-assets/scenes/scene-26.jpg'),
  preset('scene-27', '帐篷', '/generator/new-assets/scenes/scene-27.jpg'),
  preset('scene-28', '摩天轮座舱', '/generator/new-assets/scenes/scene-28.jpg'),
  preset('scene-29', '酒店镜房', '/generator/new-assets/scenes/scene-29.jpg'),
  preset('scene-30', '衣柜里', '/generator/new-assets/scenes/scene-30.jpg'),
  preset('scene-31', '飞机厕所', '/generator/new-assets/scenes/scene-31.jpg'),
  preset('scene-32', '厨房', '/generator/new-assets/scenes/scene-32.jpg'),
  preset('scene-33', '阳台', '/generator/new-assets/scenes/scene-33.jpg'),
  preset('scene-34', '玉米地', '/generator/new-assets/scenes/scene-34.jpg'),
  preset('scene-35', '动物园兽笼旁', '/generator/new-assets/scenes/scene-35.jpg'),
  preset('scene-36', '公共浴室:澡堂', '/generator/new-assets/scenes/scene-36.jpg'),
  preset('scene-37', '温室:植物园', '/generator/new-assets/scenes/scene-37.jpg'),
  preset('scene-38', '博物馆展厅角落', '/generator/new-assets/scenes/scene-38.jpg'),
  preset('scene-39', '教堂告解室', '/generator/new-assets/scenes/scene-39.jpg'),
  preset('scene-40', '瀑布后面', '/generator/new-assets/scenes/scene-40.jpg'),
  preset('scene-41', '公园长椅', '/generator/new-assets/scenes/scene-41.jpg'),
  preset('scene-42', '地下金库', '/generator/new-assets/scenes/scene-42.jpg'),
  preset('scene-43', '酒店浴缸', '/generator/new-assets/scenes/scene-43.jpg'),
  preset('scene-44', '泳池边', '/generator/new-assets/scenes/scene-44.jpg'),
  preset('scene-45', '医院病房', '/generator/new-assets/scenes/scene-45.jpg'),
  preset('scene-46', '公交:地铁末节车厢', '/generator/new-assets/scenes/scene-46.jpg'),
  preset('scene-47', '热气球吊篮', '/generator/new-assets/scenes/scene-47.jpg'),
  preset('scene-48', '潜水艇舱室', '/generator/new-assets/scenes/scene-48.jpg'),
  preset('scene-49', '会议室', '/generator/new-assets/scenes/scene-49.jpg'),
  preset('scene-50', '清晨床上', '/generator/new-assets/scenes/scene-50.jpg'),
  preset('scene-51', '天桥下', '/generator/new-assets/scenes/scene-51.jpg'),
  preset('scene-52', '公司茶水间', '/generator/new-assets/scenes/scene-52.jpg'),
  preset('scene-53', '桑拿房', '/generator/new-assets/scenes/scene-53.jpg'),
  preset('scene-54', '汽车引擎盖', '/generator/new-assets/scenes/scene-54.jpg'),
  preset('scene-55', '火车厕所', '/generator/new-assets/scenes/scene-55.jpg'),
  preset('scene-56', '广播电台录音室', '/generator/new-assets/scenes/scene-56.jpg'),
  preset('scene-57', '汽车后座', '/generator/new-assets/scenes/scene-57.jpg'),
  preset('scene-58', '餐厅包间', '/generator/new-assets/scenes/scene-58.jpg'),
  preset('scene-59', '派对洗手间', '/generator/new-assets/scenes/scene-59.jpg'),
  preset('scene-60', '游轮舱室', '/generator/new-assets/scenes/scene-60.jpg'),
  preset('scene-61', 'KTV包厢', '/generator/new-assets/scenes/scene-61.jpg'),
  preset('scene-62', '停尸间', '/generator/new-assets/scenes/scene-62.jpg'),
  preset('scene-63', '沙发', '/generator/new-assets/scenes/scene-63.jpg'),
];
