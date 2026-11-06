export const EDITORIAL_LOOKS=[
 {id:'velvet',age:29,gender:'female',tags:['portrait','fashion','night','cafe','romantic']},
 {id:'moonlit',age:30,gender:'female',tags:['portrait','fashion','night','flowers','romantic']},
 {id:'sakura',age:28,gender:'female',tags:['portrait','kimono','spring','flowers','historical']},
 {id:'noir',age:32,gender:'male',tags:['portrait','fashion','night','cafe','noir']},
 {id:'coast',age:29,gender:'male',tags:['portrait','fashion','travel','nature','romantic']},
 {id:'starlight',age:31,gender:'female',tags:['portrait','fashion','urban','night','romantic']},
] as const;
export const editorialImage=(i:number)=>`/rulumi/editorial/${EDITORIAL_LOOKS[((i%EDITORIAL_LOOKS.length)+EDITORIAL_LOOKS.length)%EDITORIAL_LOOKS.length].id}.webp`;
export const isMaturePreviewCharacter=(id:string)=>/^mio-(18|19|20|21|22|23)$/.test(id);
