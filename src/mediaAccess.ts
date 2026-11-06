export type AccessState={balance:number;unlocked:string[];activity?:{lastDay?:string;streak:number;earned:number;purchased:number;purchases:number;gifts:string[];chatDay?:string;chatClaim?:string}};
export const MEDIA_ACCESS_KEY='mio-demo-media-access-v1';
export const INITIAL_MEDIA_ACCESS:AccessState={balance:100,unlocked:[]};
export function readMediaAccess(storage:Pick<Storage,'getItem'>):AccessState{try{const v=JSON.parse(storage.getItem(MEDIA_ACCESS_KEY)||'null');if(v&&Number.isSafeInteger(v.balance)&&v.balance>=0&&Array.isArray(v.unlocked)&&v.unlocked.every((x:unknown)=>typeof x==='string'))return v}catch{}return {...INITIAL_MEDIA_ACCESS,unlocked:[]}}
export function purchaseMedia(state:AccessState,key:string,cost:number):{state:AccessState;error?:'insufficient'|'invalid'}{if(!Number.isSafeInteger(cost)||cost<=0||!key)return {state,error:'invalid'};if(state.unlocked.includes(key))return {state};if(state.balance<cost)return {state,error:'insufficient'};return {state:{...state,balance:state.balance-cost,unlocked:[...state.unlocked,key]}}}
export function freeMediaCount(kind:'comics'|'photos'|'videos'){return kind==='photos'?2:1}
export function canViewMedia(kind:'comics'|'photos'|'videos',index:number,key:string,state:AccessState){return index<freeMediaCount(kind)||state.unlocked.includes(key)}
