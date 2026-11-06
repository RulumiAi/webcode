import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {RuntimeBoundary} from './RuntimeBoundary';
import type {Locale} from '../types';
import {LocaleProvider,LOCALE_STORAGE_KEY} from '../i18n';
import {DiscoveryHub} from './DiscoveryHub';
import type {ContentKind} from '../discoveryCatalog';
import type {FilterState} from '../types';
function Harness(){const [kind,setKind]=useState<ContentKind>('characters');const [filters,setFilters]=useState({searchQuery:'',sortBy:'popular',gender:'all',artStyle:'all',ageGroup:'all',categoryTag:'all'} as FilterState);return <LocaleProvider><DiscoveryHub kind={kind} onKindChange={setKind} filters={filters} setFilters={setFilters} characters={[]} onSelectCharacter={()=>{}}><p>Characters</p></DiscoveryHub></LocaleProvider>}
async function exercise(first:'stories'|'comics',translated:boolean,locale:Locale='en'){
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://runtime.test/'});
 const win=dom.window;Object.assign(globalThis,{window:win,document:win.document,localStorage:win.localStorage,HTMLElement:win.HTMLElement,requestAnimationFrame:(fn:FrameRequestCallback)=>setTimeout(()=>fn(0),0),cancelAnimationFrame:clearTimeout,IS_REACT_ACT_ENVIRONMENT:true});
 win.localStorage.setItem(LOCALE_STORAGE_KEY,locale);
 const errors:unknown[]=[];const target=win.document.getElementById('root')!;const root=createRoot(target,{onUncaughtError:error=>errors.push(error)});
 const click=async(kind:ContentKind)=>{await act(async()=>{(win.document.getElementById(`hub-tab-${kind}`) as HTMLButtonElement)?.click()})};
 try{await act(async()=>root.render(<Harness/>));await click(first);
 if(translated){const count=win.document.querySelector('.mio-hub-count')!;const walker=win.document.createTreeWalker(count,4);const nodes:Node[]=[];while(walker.nextNode())nodes.push(walker.currentNode as unknown as Node);assert.ok(nodes.length>0,'translation simulation must change real text nodes');for(const node of nodes){const parent=node.parentNode!;const font=win.document.createElement('font');parent.replaceChild(font,node);font.appendChild(node)}}
 const second=first==='stories'?'comics':'stories';try{await click(second)}catch(error){errors.push(error)}
 assert.deepEqual(errors.map(String),[],`uncaught error after ${first} → ${second}`);
 assert.ok(win.document.getElementById(`hub-panel-${second}`),'requested panel must remain rendered');
 for(let i=0;i<4;i++){await click(i%2?second:first);assert.ok(win.document.querySelector('.mio-discovery-hub'),'discovery must stay mounted')}
 }finally{try{await act(async()=>root.unmount())}catch{}dom.window.close()}
}
for(const first of ['stories','comics'] as const){test(`${first} switches repeatedly without unmounting discovery`,()=>exercise(first,false));for(const locale of ['en','zh-CN','ja','ko'] as Locale[])test(`${first} switches after translated counter text (${locale})`,()=>exercise(first,true,locale))}

test('a render failure is isolated and the section can be retried',async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://runtime.test/'});const win=dom.window;Object.assign(globalThis,{window:win,document:win.document,localStorage:win.localStorage,HTMLElement:win.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});win.localStorage.setItem(LOCALE_STORAGE_KEY,'en');let fail=true;
 function Content(){if(fail)throw new Error('Injected render failure');return <p>Recovered content</p>}
 const root=createRoot(win.document.getElementById('root')!,{onCaughtError:()=>{}});
 try{await act(async()=>root.render(<LocaleProvider><nav>Navigation survives</nav><RuntimeBoundary scope="test"><Content/></RuntimeBoundary></LocaleProvider>));assert.ok(win.document.querySelector('[role="alert"]'));assert.equal(win.document.querySelector('nav')?.textContent,'Navigation survives');assert.match(win.localStorage.getItem('mio-last-render-error')||'',/Injected render failure/);fail=false;await act(async()=>(win.document.querySelector('[role="alert"]>button') as HTMLButtonElement).click());assert.equal(win.document.querySelector('[role="alert"]'),null);assert.ok(win.document.body.textContent?.includes('Recovered content'));}finally{await act(async()=>root.unmount());dom.window.close()}
});
