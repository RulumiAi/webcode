import { api } from './api';
import type { Character } from './types';

export async function loadAllFavoriteCharacters(signal?: AbortSignal): Promise<Character[]> {
  const items: Character[] = [];
  let page = 1;
  while (true) {
    const result = await api.characters.favorites(page, 100, signal);
    items.push(...result.items);
    if (items.length >= result.total || result.items.length === 0) return items;
    page += 1;
  }
}