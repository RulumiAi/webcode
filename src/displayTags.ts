import { DISPLAY_TAG_IDS, type DisplayTagId } from './types';

const displayTagIdSet = new Set<string>(DISPLAY_TAG_IDS);

export function isDisplayTagId(value: string): value is DisplayTagId {
  return displayTagIdSet.has(value);
}

export function getDisplayTagLabels(
  tags: string[],
  translate: (key: string) => string,
): string[] {
  return tags.map((tag) => (
    isDisplayTagId(tag) ? translate(`tags.display.${tag}`) : tag
  ));
}
