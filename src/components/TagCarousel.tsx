import React, { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '../i18n';
import type { CharacterFilterTag } from '../types';
import { getCharacterFilterTagLabel } from '../filterTags';
import { parseThemeSelection, toggleThemeSelection } from '../demoThemes';

interface Props {
  selectedCategory: string;
  onSelectCategory: (s: string) => void;
  tags: CharacterFilterTag[];
  labelForTag?: (tag: CharacterFilterTag) => string;
  primaryCount?: number;
  resetKey?: string;
}

export const TagCarousel: React.FC<Props> = ({ selectedCategory, onSelectCategory, tags, labelForTag, primaryCount = 6, resetKey }) => {
  const { locale, t } = useLocale();
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [resetKey]);
  const label = (tag: CharacterFilterTag) => labelForTag ? labelForTag(tag) : getCharacterFilterTagLabel(tag, locale, t);
  const selected = parseThemeSelection(selectedCategory);
  const count = Math.max(0, Math.min(8, primaryCount));
  const primary = tags.slice(0, Math.min(tags.length, count));
  const extra = tags.slice(primary.length);
  const shown = expanded ? tags : primary;
  const hiddenSelected = selected.filter((slug) => !shown.some((tag) => tag.slug === slug));
  const moreLabel = locale === 'ja' ? (expanded ? '閉じる' : 'もっと') : locale === 'zh-CN' ? (expanded ? '收起' : '更多') : (expanded ? 'Less' : 'More');
  const selectedLabel = locale === 'ja' ? `選択 ${selected.length}` : locale === 'zh-CN' ? `已选 ${selected.length}` : `${selected.length} selected`;
  const chip = (slug: string, title: string, pressed: boolean) => (
    <button key={slug} type="button" aria-pressed={pressed} className={pressed ? 'active' : ''} onClick={() => onSelectCategory(toggleThemeSelection(selectedCategory, slug))}>{title}</button>
  );
  return (
    <div className={`mio-tagbar r12-tagbar r14-tagbar ${expanded ? 'expanded' : ''}`}>
      <div className="mio-tagstrip" id={id} role="group" aria-label={t('tags.all')}>
        {chip('all', t('tags.all'), selected.length === 0)}
        {shown.map((tag) => chip(tag.slug, label(tag), selected.includes(tag.slug)))}
        {extra.length > 0 && (
          <button className="r14-tags-toggle" type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>
            {moreLabel}<ChevronDown size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {selected.length > 0 && <p className="demo-selected-count">{selectedLabel}</p>}
      {hiddenSelected.length > 0 && (
        <div className="demo-selected-summary">
          {hiddenSelected.map((slug) => {
            const tag = tags.find((item) => item.slug === slug);
            const title = tag ? label(tag) : slug;
            return <button key={slug} type="button" onClick={() => onSelectCategory(toggleThemeSelection(selectedCategory, slug))}>{title} ×</button>;
          })}
        </div>
      )}
    </div>
  );
};
