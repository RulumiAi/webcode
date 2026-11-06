import {useState} from 'react';
import {Check,ArrowUpRight} from 'lucide-react';
import {EDITORIAL_LOOKS,editorialImage} from '../matureCatalog';
import {useLocale} from '../i18n';
import {contentTagLabel} from '../contentTags';
export function EditorialGallery({onSelect}:{onSelect:(image:string)=>void}){const {locale}=useLocale();const [selected,setSelected]=useState<number|null>(null);const title=locale==='ja'?'大人のスタイルから選ぶ':locale==='zh-CN'?'从成熟风格中寻找灵感':locale==='ko'?'성숙한 스타일에서 영감 찾기':'Find your next look';return <section className="rulumi-lookbook"><header><div><small>RULUMI EDITORIAL · 28—32</small><h3>{title}</h3></div><ArrowUpRight size={17}/></header><div>{EDITORIAL_LOOKS.map((look,i)=><button type="button" key={look.id} aria-pressed={selected===i} onClick={()=>{setSelected(i);onSelect(editorialImage(i))}}><img src={editorialImage(i)} alt={`${look.id} · ${look.age}`} loading="lazy"/><span>{contentTagLabel(['cafe','night','kimono','noir','travel','urban'][i],locale)}</span>{selected===i&&<Check size={15}/>}</button>)}</div></section>}
