import {MEDIA_ACCESS_KEY,readMediaAccess,type AccessState} from './mediaAccess';
export const WALLET_EVENT='mio-wallet-change';
export type Activity={lastDay?:string;streak:number;earned:number;purchased:number;purchases:number;gifts:string[];chatDay?:string;chatClaim?:string};
export function activity(state:AccessState):Activity{const a=state.activity;return {streak:0,earned:0,purchased:0,purchases:0,gifts:[],...a}}
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export const CHECKIN_REWARDS=[50,60,80,50,50,50,100];
export function checkIn(state:AccessState,today:string){const a=activity(state);if(a.lastDay===today)return state;const prior=new Date(`${today}T12:00:00`);prior.setDate(prior.getDate()-1);const streak=a.lastDay===localDay(prior)?a.streak%7+1:1;const reward=CHECKIN_REWARDS[streak-1];return {...state,balance:state.balance+reward,activity:{...a,lastDay:today,streak,earned:a.earned+reward}}}
export function gift(state:AccessState,code:string){const a=activity(state);if(code.trim().toUpperCase()!=='DEMO50'||a.gifts.includes('DEMO50'))return null;return {...state,balance:state.balance+50,activity:{...a,earned:a.earned+50,gifts:[...a.gifts,'DEMO50']}}}
export function recharge(state:AccessState,amount:number){if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Invalid amount');const a=activity(state);const bonus=a.purchases===0&&amount===1500?1500:0;return {...state,balance:state.balance+amount+bonus,activity:{...a,purchased:a.purchased+amount+bonus,purchases:a.purchases+1}}}
export function saveWallet(state:AccessState){localStorage.setItem(MEDIA_ACCESS_KEY,JSON.stringify(state));window.dispatchEvent(new Event(WALLET_EVENT));return state}
export function currentWallet(){return readMediaAccess(localStorage)}
export function markChat(){const state=currentWallet();saveWallet({...state,activity:{...activity(state),chatDay:localDay()}})}
export function claimChat(state:AccessState){const a=activity(state),today=localDay();if(a.chatDay!==today||a.chatClaim===today)return state;return {...state,balance:state.balance+5,activity:{...a,chatClaim:today,earned:a.earned+5}}}
