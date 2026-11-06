import {useRef,useState} from 'react';
import {ArrowLeft,BookOpen,ChevronDown,Heart,MessageCircle,Sparkles,Users,X,ArrowRight} from 'lucide-react';
import {useLocale} from '../i18n';
import type {Character} from '../types';
import {formatHeat,genreLabel,hubCopy,storyBlurb,storyGoal,type StoryCard} from '../discoveryCatalog';
import {STORY_WORLDS,estimatedWorldTokens,worldCopy,worldEntryCount,worldText} from '../storyWorlds';
import {DiscoveryDialog} from './DiscoveryDialog';
import {StoryCover} from './StoryCover';
export function StoryWorldbookDetail({story,characters,saved,onSave,onClose,onChat}:{story:StoryCard;characters:Character[];saved:boolean;onSave:()=>void;onClose:()=>void;onChat:(character:Character)=>void}){
 const {locale}=useLocale();const c=worldCopy(locale);const hub=hubCopy(locale);const world=STORY_WORLDS[story.id];
 const cast=story.cast.map((id,i)=>({character:characters.find(p=>p.id===`mio-${id}`),role:worldText(world.roles[i],locale)})).filter((p):p is {character:Character;role:string}=>!!p.character);
 const [expanded,setExpanded]=useState(false);const [selected,setSelected]=useState(cast[0]?.character.id);const [choosing,setChoosing]=useState(false);const [npcOpened,setNpcOpened]=useState(false);const chooserRef=useRef<HTMLDivElement>(null);
 const active=cast.find(p=>p.character.id===selected)||cast[0];
 const showChooser=()=>{setChoosing(true);requestAnimationFrame(()=>chooserRef.current?.querySelector<HTMLButtonElement>('button')?.focus())};
 return <DiscoveryDialog title={story.title} onClose={()=>choosing?setChoosing(false):onClose()} className="mio-worldbook-page" workspace>
  <div className="mio-worldbook-content" inert={choosing||undefined}>
   <button className="mio-worldbook-back" onClick={onClose}><ArrowLeft size={20}/>{c.back}</button>
   <div className="mio-worldbook-layout">
    <aside className="mio-worldbook-poster"><StoryCover index={story.cover}/><button className="mio-worldbook-start" onClick={showChooser}>{c.start}<ArrowRight size={18}/></button></aside>
    <div className="mio-worldbook-main">
     <header className="mio-worldbook-heading"><div><h1>{story.title}</h1><p>{c.author} <span>mio studio</span></p></div><button className={`mio-worldbook-save ${saved?'saved':''}`} aria-label={c.saved} aria-pressed={saved} onClick={onSave}><Heart size={21}/></button></header>
     <div className="mio-worldbook-metrics">{[[MessageCircle,formatHeat(story.heat,locale),c.messages],[Users,cast.length,c.characters],[BookOpen,worldEntryCount(story),c.entries],[Sparkles,formatHeat(estimatedWorldTokens(story,locale),locale),c.tokens]].map(([Icon,value,label])=>{const MetricIcon=Icon as typeof Users;return <div key={String(label)}><strong><MetricIcon size={22}/>{String(value)}</strong><span>{String(label)}</span></div>})}</div>
     <section className={`mio-worldbook-intro ${expanded?'expanded':''}`}><p>{storyBlurb(story.cover,locale)} {storyGoal(story.cover,locale)} {expanded&&c.ruleBody}</p><div><span>{genreLabel(story.genres[0],locale)}</span><button aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?c.less:c.more}<ChevronDown size={15}/></button></div></section>
     <div className="mio-worldbook-info">{c.info}</div>
     <details open className="mio-worldbook-section"><summary><ChevronDown size={17}/><b>1</b><h2>NPC</h2><span>{cast.length}</span></summary><p className="mio-worldbook-npc-hint">{c.npcHint}</p><div className="mio-worldbook-npcs">{cast.map(({character,role})=><button className={npcOpened&&selected===character.id?'selected':''} aria-pressed={npcOpened&&selected===character.id} key={character.id} onClick={()=>{setSelected(character.id);setNpcOpened(true)}}><img src={character.avatar} alt=""/><strong>{character.name.split(/ [·―] /)[0]}</strong><span>{role}</span></button>)}</div>{npcOpened&&active&&<div className="mio-worldbook-npc-info"><img src={active.character.avatar} alt=""/><div><strong>{active.character.name}</strong><p>{active.role} · {story.title}</p><small>{worldText(world.scenes[0].title,locale)} · {worldText(world.events[1].title,locale)}</small></div><button onClick={showChooser}>{c.start}<ArrowRight size={15}/></button></div>}</details>
     <details open className="mio-worldbook-section"><summary><ChevronDown size={17}/><b>2</b><h2>{c.scenes}</h2><span>{world.scenes.length}</span></summary><div className="mio-worldbook-scenes">{world.scenes.map((entry,i)=><details className="mio-worldbook-scene" key={i}><summary><img src={entry.image} alt={worldText(entry.title,locale)} style={{objectPosition:entry.position}}/><div><h3>{worldText(entry.title,locale)}</h3><ChevronDown size={16}/></div></summary><p>{worldText(entry.body,locale)}</p></details>)}</div></details>
     <details open className="mio-worldbook-section"><summary><ChevronDown size={17}/><b>3</b><h2>{c.events}</h2><span>{world.events.length}</span></summary><div className="mio-worldbook-events">{world.events.map((entry,i)=><details key={i} open={entry.phase==='now'}><summary><span className={`mio-worldbook-event-dot ${entry.phase}`}/><div><small>{c[entry.phase]}</small><h3>{worldText(entry.title,locale)}</h3></div><ChevronDown size={16}/></summary><p>{worldText(entry.body,locale)}</p></details>)}</div></details>
     <details className="mio-worldbook-section"><summary><ChevronDown size={17}/><b>4</b><h2>{c.rules}</h2><span>2</span></summary><div className="mio-worldbook-rules"><h3>{c.objective}</h3><p>{storyGoal(story.cover,locale)}</p><h3>{c.ruleTitle}</h3><p>{c.ruleBody}</p></div></details>
     
    </div>
   </div>
  </div>
  {choosing&&<div className="mio-worldbook-chooser-shade"><div className="mio-worldbook-chooser" data-dialog-focus-root ref={chooserRef} role="region" aria-label={c.choose}><button className="mio-worldbook-chooser-close" onClick={()=>setChoosing(false)} aria-label={c.cancel}><X size={20}/></button><h2>{c.choose}</h2><p>{story.title}</p><div className="mio-worldbook-choose-grid">{cast.map(({character,role})=><button key={character.id} aria-pressed={selected===character.id} className={selected===character.id?'selected':''} onClick={()=>setSelected(character.id)}><img src={character.avatar} alt=""/><strong>{character.name.split(/ [·―] /)[0]}</strong><small>{role}</small></button>)}</div><small className="mio-worldbook-chat-note">{c.chatNote}</small><button className="mio-worldbook-start" disabled={!active} onClick={()=>{if(active){onClose();onChat(active.character)}}}>{c.start}<ArrowRight size={17}/></button></div></div>}
 </DiscoveryDialog>
}
