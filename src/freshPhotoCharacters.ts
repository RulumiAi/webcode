import {EDITORIAL_LOOKS,editorialImage} from './matureCatalog';
import type {Locale} from './types';
export const FRESH_PHOTOS=[
 {file:'nao',age:27,gender:'female',heat:38600},
 {file:'hina',age:28,gender:'female',heat:28500},
 {file:'sora',age:29,gender:'male',heat:47800},
 {file:'aoi',age:26,gender:'female',heat:23400},
 {file:'yuna',age:30,gender:'female',heat:52600},
 {file:'itsuki',age:31,gender:'male',heat:31900},
 ...EDITORIAL_LOOKS.map((look,i)=>({file:look.id,age:look.age,gender:look.gender,heat:0})),
] as const;
const names:Record<Locale,string[]>={
 en:['Nao · Hydrangea Walk','Hina · A Seat by the Window','Sora · The Seaside Ride','Aoi · A Page of Sunshine','Yuna · Morning at the Flower Shop','Itsuki · A Slow Afternoon'],
 'zh-CN':['奈绪 · 紫阳花小路','阳菜 · 窗边的座位','空 · 海边骑行','葵 · 书页里的阳光','优奈 · 花店的清晨','树 · 慢下来的午后'],
 ja:['菜緒 ― 紫陽花の小道','陽菜 ― 窓辺の指定席','空 ― 海沿いの帰り道','葵 ― 木漏れ日の書店','優奈 ― 花屋の朝','樹 ― ゆっくり流れる午後'],
 ko:['나오 · 수국 산책길','히나 · 창가의 자리','소라 · 바닷가 자전거','아오이 · 햇살 속 책장','유나 · 꽃집의 아침','이츠키 · 느긋한 오후'],
 es:['Nao · Paseo entre hortensias','Hina · Junto a la ventana','Sora · Paseo junto al mar','Aoi · Páginas de sol','Yuna · Mañana en la florería','Itsuki · Una tarde sin prisa'],
 pt:['Nao · Caminho de hortênsias','Hina · Um lugar à janela','Sora · Passeio à beira-mar','Aoi · Páginas ao sol','Yuna · Manhã na floricultura','Itsuki · Uma tarde tranquila']};
export const freshPhotoName=(index:number,locale:Locale)=>index<6?(names[locale]||names.en)[index]:(locale==='ja'?['茜 ― 夜のカフェ','澪 ― 月のテラス','紫乃 ― 花灯り','悠真 ― ジャズの夜','蒼 ― 黄昏の海','玲 ― 星のギャラリー']:['Akane · Velvet Evening','Mio · Moonlit Terrace','Shino · Lantern Walk','Yuma · Midnight Jazz','Ao · Sunset Coast','Rei · Starlit Gallery'])[index-6];
export function previewCoverUrl(i:number){return i>=18?editorialImage(i-18):i>=12?`/mio/fresh-anime/${FRESH_PHOTOS[i-12].file}.webp`:i<4?`/mio/anime/${['ren','mizuki','kai','rin'][i]}.webp`:`/mio/portrait${i}.svg`}
