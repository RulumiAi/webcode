import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';
import { readPreferences } from '../entryPreferences';
import { AGE_DEMO_EVENT, isAdultAgeBand, readAgeDemo, saveAgeDemo, type AgeDemoBand } from '../ageDemo';
import { AgeDemoDialog } from './AgeDemoDialog';

export const MATURE_KEY = 'rulumi-mature-content-v1';
export const MATURE_EVENT = 'rulumi-mature-change';

export function readMature() {
  try {
    const age = readAgeDemo();
    if (age === 'under18') return false;
    if (localStorage.getItem(MATURE_KEY) !== 'true') return false;
    if (isAdultAgeBand(age)) return true;
    return !!readPreferences();
  } catch {
    return false;
  }
}

function writeMature(enabled: boolean) {
  localStorage.setItem(MATURE_KEY, String(enabled));
  window.dispatchEvent(new Event(MATURE_EVENT));
  window.dispatchEvent(new CustomEvent('rulumi-adult-visibility', { detail: { enabled } }));
}

export function useMature() {
  const [enabled, setEnabled] = useState(readMature);
  useEffect(() => {
    const sync = () => setEnabled(readMature());
    window.addEventListener(MATURE_EVENT, sync);
    window.addEventListener(AGE_DEMO_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(MATURE_EVENT, sync);
      window.removeEventListener(AGE_DEMO_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return enabled;
}

export function MatureToggle() {
  const { locale } = useLocale();
  const enabled = useMature();
  const [age, setAge] = useState(readAgeDemo);
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState('');
  const ja = locale === 'ja';
  const zh = locale === 'zh-CN';
  useEffect(() => {
    const sync = () => setAge(readAgeDemo());
    window.addEventListener(AGE_DEMO_EVENT, sync);
    return () => window.removeEventListener(AGE_DEMO_EVENT, sync);
  }, []);
  const locked = age === 'under18';
  const stateLabel = enabled ? (ja ? 'オン' : zh ? '开启' : 'On') : (ja ? 'オフ' : zh ? '关闭' : 'Off');
  const caption = ja ? '成人向けコンテンツ' : zh ? '成人内容' : 'Adult content';
  const choose = (band: AgeDemoBand) => {
    saveAgeDemo(band);
    setSheet(false);
    if (band === 'under18') {
      writeMature(false);
      setNote(ja ? '未満18のデモでは成人向けコンテンツを表示できません。' : zh ? '未满18的演示会强制关闭成人内容，且没有改选年龄的入口。' : 'The under-18 demo keeps adult content off.');
      return;
    }
    writeMature(true);
    setNote('');
  };
  const toggle = () => {
    if (locked) return;
    if (!isAdultAgeBand(age)) {
      setSheet(true);
      return;
    }
    writeMature(!enabled);
    setNote('');
  };
  return (
    <div className="rulumi-mature-control">
      <span id="adult-content-label">{caption}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby="adult-content-label"
        aria-disabled={locked}
        disabled={locked}
        title={locked ? (ja ? '未満18のデモでは切り替えできません' : 'Unavailable in the under-18 demo') : caption}
        onClick={toggle}
        className={enabled ? 'enabled' : ''}
      >
        <i aria-hidden="true" />
        <b>{stateLabel}</b>
      </button>
      {note && <p role="status">{note}</p>}
      {sheet && <AgeDemoDialog onClose={() => setSheet(false)} onChoose={choose} />}
    </div>
  );
}
