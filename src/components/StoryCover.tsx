import {STORY_CARDS} from '../discoveryCatalog';
export function StoryCover({index,className=''}:{index:number;className?:string}){return <div role="img" aria-label={STORY_CARDS.find(s=>s.cover===index)?.title} className={`mio-story-cover ${className}`} style={{backgroundPosition:`${[0,50,100][index%3]}% ${index<3?0:100}%`}}/>}
