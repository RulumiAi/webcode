export type EventEntry={joinedAt:string;stamp?:boolean};
export type EventEntries=Record<string,EventEntry>;
export const EVENT_KEY='mio-events-v1';
export function readEventEntries():EventEntries{try{const data=JSON.parse(localStorage.getItem(EVENT_KEY)||'{}');if(!data||typeof data!=='object'||Array.isArray(data))return {};return Object.fromEntries(Object.entries(data).filter(([,v])=>v&&typeof v==='object'&&typeof (v as EventEntry).joinedAt==='string')) as EventEntries}catch{return {}}}
export function saveEventEntry(id:string,entry:EventEntry){const next={...readEventEntries(),[id]:entry};localStorage.setItem(EVENT_KEY,JSON.stringify(next));return next}
export function eventComplete(id:string,progress:{hasArt:boolean;hasComic:boolean;hasChat:boolean}){return id==='autumn'?progress.hasArt&&progress.hasChat:id==='club'?progress.hasComic:false}
