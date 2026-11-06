export type RoleplaySegmentType = 'dialogue' | 'narration';

export interface RoleplaySegment {
  type: RoleplaySegmentType;
  text: string;
}

function isSingleAsterisk(text: string, index: number) {
  return text[index] === '*'
    && text[index - 1] !== '*'
    && text[index + 1] !== '*';
}

const PARENTHESIS_PAIRS: Record<string, string> = {
  '(': ')',
  '（': '）',
};

const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  '“': '”',
  '‘': '’',
};

function findBalancedClosing(text: string, start: number) {
  const first = PARENTHESIS_PAIRS[text[start]];
  if (!first) return -1;

  const expectedClosings = [first];
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index];
    const nestedClosing = PARENTHESIS_PAIRS[character];
    if (nestedClosing) {
      expectedClosings.push(nestedClosing);
      continue;
    }
    if (character !== expectedClosings[expectedClosings.length - 1]) continue;
    expectedClosings.pop();
    if (expectedClosings.length === 0) return index;
  }
  return -1;
}

function findSingleAsteriskClosing(text: string, start: number) {
  for (let index = start + 1; index < text.length; index += 1) {
    if (isSingleAsterisk(text, index)) return index;
  }
  return -1;
}

function findNarrationEnd(text: string, start: number) {
  return text[start] === '*'
    ? findSingleAsteriskClosing(text, start)
    : findBalancedClosing(text, start);
}

function isEscaped(text: string, index: number) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

function findQuoteClosing(text: string, start: number) {
  const closing = QUOTE_PAIRS[text[start]];
  if (!closing) return -1;

  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === closing && (text[start] !== '"' || !isEscaped(text, index))) return index;
  }
  return -1;
}

function quoteState(text: string) {
  let hasPair = false;
  for (let index = 0; index < text.length; index += 1) {
    if (!QUOTE_PAIRS[text[index]]) continue;
    const closing = findQuoteClosing(text, index);
    if (closing === -1) return { hasPair, hasUnclosed: true };
    hasPair = true;
    index = closing;
  }
  return { hasPair, hasUnclosed: false };
}

function hasExplicitNarration(text: string) {
  for (let index = 0; index < text.length; index += 1) {
    const isNarrationStart = isSingleAsterisk(text, index) || Boolean(PARENTHESIS_PAIRS[text[index]]);
    if (!isNarrationStart) continue;
    const closing = findNarrationEnd(text, index);
    if (closing !== -1 && text.slice(index + 1, closing).trim()) return true;
  }
  return false;
}

function appendSegment(segments: RoleplaySegment[], type: RoleplaySegmentType, text: string) {
  if (text) segments.push({ type, text });
}

/** Split roleplay narration and quoted dialogue without interpreting text as HTML or Markdown. */
export function parseRoleplayText(text: string): RoleplaySegment[] {
  if (!text) return [];

  const quotes = quoteState(text);
  const hasNarration = hasExplicitNarration(text);
  if (quotes.hasUnclosed || (!quotes.hasPair && !hasNarration)) return [{ type: 'dialogue', text }];

  const segments: RoleplaySegment[] = [];
  const outsideType: RoleplaySegmentType = quotes.hasPair ? 'narration' : 'dialogue';
  let outsideStart = 0;
  let cursor = 0;

  while (cursor < text.length) {
    const isNarrationStart = isSingleAsterisk(text, cursor) || Boolean(PARENTHESIS_PAIRS[text[cursor]]);
    if (isNarrationStart) {
      const closing = findNarrationEnd(text, cursor);
      if (closing !== -1 && text.slice(cursor + 1, closing).trim()) {
        appendSegment(segments, outsideType, text.slice(outsideStart, cursor));
        appendSegment(segments, 'narration', text.slice(cursor, closing + 1));
        outsideStart = closing + 1;
        cursor = outsideStart;
        continue;
      }
    }

    if (QUOTE_PAIRS[text[cursor]]) {
      const closing = findQuoteClosing(text, cursor);
      if (closing === -1) return [{ type: 'dialogue', text }];
      appendSegment(segments, outsideType, text.slice(outsideStart, cursor));
      appendSegment(segments, 'dialogue', text.slice(cursor, closing + 1));
      outsideStart = closing + 1;
      cursor = outsideStart;
      continue;
    }

    cursor += 1;
  }

  appendSegment(segments, outsideType, text.slice(outsideStart));

  return segments;
}
