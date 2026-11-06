// Add owned official URLs here or through the equivalent VITE_SOCIAL_* variables.
// Blank values render an unavailable community entrance; never point to another account.
const env:Record<string,string>=(import.meta as ImportMeta & {env?:Record<string,string>}).env||{};
export const SOCIAL_LINKS=[{name:'Discord',url:env.VITE_SOCIAL_DISCORD||''},{name:'X',url:env.VITE_SOCIAL_X||''},{name:'Instagram',url:env.VITE_SOCIAL_INSTAGRAM||''},{name:'YouTube',url:env.VITE_SOCIAL_YOUTUBE||''}].map(item=>({...item,url:/^https:\/\//.test(item.url)?item.url:''}));
