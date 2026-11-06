import { useState } from 'react';
import { DiscoveryDialog } from './DiscoveryDialog';
import { AGE_DEMO_BANDS, type AgeDemoBand } from '../ageDemo';
import { useLocale } from '../i18n';

const labels: Record<AgeDemoBand, string> = {
  under18: '未満18',
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45+': '45+',
};

export function AgeDemoDialog({ onClose, onChoose }: { onClose: () => void; onChoose: (band: AgeDemoBand) => void }) {
  const { locale } = useLocale();
  const ja = locale === 'ja';
  const zh = locale === 'zh-CN';
  const [band, setBand] = useState<AgeDemoBand | ''>('');
  const title = ja ? '年齢確認（示意・非検証）' : zh ? '年龄确认（示意，非验证）' : 'Age check (demo, not verification)';
  return (
    <DiscoveryDialog title={title} onClose={onClose} className="demo-age-dialog">
      <h2>{title}</h2>
      <p>{ja ? '表示の切替だけのデモです。実年齢や身分は確認せず、成年証明にもなりません。' : zh ? '只控制演示内容是否可见，不收集真实身份，也不验证年龄。' : 'This only changes the demo catalog. It does not collect identity or verify age.'}</p>
      <div className="demo-age-options" role="group" aria-label={title}>
        {AGE_DEMO_BANDS.map((value) => (
          <button key={value} type="button" aria-pressed={band === value} className={band === value ? 'selected' : ''} onClick={() => setBand(value)}>
            {ja || zh ? (value === 'under18' ? (ja ? '未満18' : '未满18') : labels[value]) : (value === 'under18' ? 'Under 18' : value)}
          </button>
        ))}
      </div>
      <footer>
        <button type="button" onClick={onClose}>{ja ? 'あとで' : zh ? '稍后再说' : 'Not now'}</button>
        <button type="button" className="demo-age-confirm" disabled={!band} onClick={() => band && onChoose(band)}>{ja ? '確認（示意）' : zh ? '确认（示意）' : 'Confirm (demo)'}</button>
      </footer>
    </DiscoveryDialog>
  );
}
