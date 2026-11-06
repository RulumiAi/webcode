import {useState} from 'react';
import {Instagram,Youtube,MessageCircle} from 'lucide-react';
import {useLocale} from '../i18n';
import {hubCopy} from '../discoveryCatalog';
import {SOCIAL_LINKS} from '../socialLinks';
export function SocialLinks(){const {locale}=useLocale();const c=hubCopy(locale);const [pending,setPending]=useState(false);return <div className="mio-social"><div className="mio-social-row" aria-label={c.community}>{SOCIAL_LINKS.map((item,index)=>{const Icon=[MessageCircle,null,Instagram,Youtube][index];const content=Icon?<Icon size={18}/>:<span className="mio-x-mark">𝕏</span>;return item.url?<a key={item.name} href={item.url} aria-label={item.name} title={item.name} target="_blank" rel="noopener noreferrer">{content}</a>:<button key={item.name} aria-label={item.name} title={item.name} onClick={()=>setPending(p=>!p)} aria-expanded={pending}>{content}</button>})}</div>{pending&&<p role="status">{c.socialPending}</p>}</div>}
