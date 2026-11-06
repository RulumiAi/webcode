import type { ReactNode } from 'react';

export type LegalDocumentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'code'; language: string; lines: string[] };

export function unescapeMarkdown(value: string): string {
  return value.replace(/\\([^\w\s])/g, '$1');
}

function isBlockStart(line: string): boolean {
  return /^(#{1,6})\s+/.test(line)
    || /^\s*[-*+]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line)
    || /^\s*>/.test(line)
    || /^\s*```/.test(line);
}

function isTextHeading(line: string): boolean {
  const text = line.trim();
  if (!text || text === 'LUDORIA STUDIO PTE. LTD.' || text.includes('@') || /^12 Marina Boulevard/i.test(text)) return false;
  if (/^Last Modified:/i.test(text) || /^(?:Official )?(?:Contact )?Email:/i.test(text)) return false;
  if (/^\d+\.\d+\s+/.test(text)) return true;
  if (/^\d+\.\s+/.test(text)) return true;
  if (text.length > 80 || /[.!?:;,]$/.test(text)) return false;

  const words = text.split(/\s+/);
  const connectors = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'use', 'with']);
  return words.length <= 10 && words.every((word, index) => index === 0 || connectors.has(word.toLowerCase()) || /^[A-Z0-9]/.test(word));
}

function isTextListItem(line: string): boolean {
  const text = line.trim();
  return /^(?:\([a-z0-9]+\)|[a-z0-9]+[.)])\s+/i.test(text) || /;$/.test(text);
}

function parseTextDocument(lines: string[]): LegalDocumentBlock[] {
  const blocks: LegalDocumentBlock[] = [];
  const listItems: string[] = [];

  const flushList = () => {
    if (listItems.length >= 2) {
      blocks.push({ type: 'unordered-list', items: [...listItems] });
    } else {
      listItems.forEach((text) => blocks.push({ type: 'paragraph', text }));
    }
    listItems.length = 0;
  };

  lines.forEach((line) => {
    const text = line.trim();
    if (!text) {
      flushList();
      return;
    }
    if (isTextHeading(text)) {
      flushList();
      blocks.push({ type: 'heading', level: /^\d+\.\d+\s+/.test(text) ? 3 : 2, text });
      return;
    }
    if (isTextListItem(text)) {
      listItems.push(text);
      return;
    }
    flushList();
    blocks.push({ type: 'paragraph', text });
  });

  flushList();
  return blocks;
}

export function parseLegalDocument(content: string, format: 'markdown' | 'text'): LegalDocumentBlock[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  if (format === 'text') return parseTextDocument(lines);

  const blocks: LegalDocumentBlock[] = [];
  let index = 0;

  const pushParagraph = (paragraphLines: string[]) => {
    const text = paragraphLines.join(' ');
    if (text.trim()) blocks.push({ type: 'paragraph', text: text.trim() });
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```(.*)$/);
    if (fence) {
      const codeLines: string[] = [];
      const language = fence[1].trim();
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', language, lines: codeLines });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(item[1].trim());
        index += 1;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^\d+[.)]\s+(.+)$/);
        if (!item) break;
        items.push(item[1].trim());
        index += 1;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    if (/^>/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    pushParagraph(paragraphLines);
  }

  return blocks;
}

function safeHref(value: string): string | null {
  const href = unescapeMarkdown(value.trim());
  if (/^(?:https?:\/\/|mailto:)/i.test(href)) return href;
  if (/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(href)) return `https://${href}`;
  return null;
}

export function renderInline(value: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push(unescapeMarkdown(value.slice(lastIndex, match.index)));
    const key = `inline-${match.index}`;
    if (match[2] && match[3]) {
      const href = safeHref(match[3]);
      const label = unescapeMarkdown(match[2]);
      parts.push(href ? <a key={key} href={href} target="_blank" rel="noreferrer" className="text-pink-300 underline decoration-pink-500/40 underline-offset-2 hover:text-pink-200">{label}</a> : label);
    } else if (match[4] || match[5]) {
      parts.push(<strong key={key} className="font-semibold text-zinc-100">{unescapeMarkdown(match[4] || match[5] || '')}</strong>);
    } else if (match[6]) {
      parts.push(<code key={key} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[0.9em] text-pink-200">{unescapeMarkdown(match[6])}</code>);
    } else {
      parts.push(<em key={key}>{unescapeMarkdown(match[7] || match[8] || '')}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) parts.push(unescapeMarkdown(value.slice(lastIndex)));
  return parts;
}
