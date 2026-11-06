export const ENTRY_KEY='mio-entry-preferences-v1';
export const AGE_OPTIONS=['under18','18-24','25-34','35-44','45+'] as const;
export const GENDER_OPTIONS=['female','male','nonbinary','private'] as const;
export type EntryPreferences={age:typeof AGE_OPTIONS[number];gender:typeof GENDER_OPTIONS[number]};
export function validPreferences(value:unknown):value is EntryPreferences{if(!value||typeof value!=='object')return false;const v=value as EntryPreferences;return AGE_OPTIONS.includes(v.age)&&v.age!=='under18'&&GENDER_OPTIONS.includes(v.gender)}
export function readPreferences():EntryPreferences|null{try{const value=JSON.parse(localStorage.getItem(ENTRY_KEY)||'null');return validPreferences(value)?value:null}catch{return null}}
export function savePreferences(value:EntryPreferences){if(!validPreferences(value))throw Error('Invalid preferences');localStorage.setItem(ENTRY_KEY,JSON.stringify(value));window.dispatchEvent(new Event('mio-preferences-change'))}
