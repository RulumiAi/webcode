import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from './api';
import { loadAllFavoriteCharacters } from './favorites';
import type { Character } from './types';

function favorite(id: string): Character {
  return {
    id,
    name: id,
    age: null,
    subtitle: '',
    description: '',
    avatar: '',
    author: '@creator',
    likes: 0,
    chatCount: 0,
    commentCount: 0,
    tags: [],
    gender: 'female',
    artStyle: 'anime',
    category: '',
    systemInstruction: '',
    greeting: '',
    source: 'api',
  };
}

test('loads every page of favorite characters for the My Characters view', async () => {
  const originalFavorites = api.characters.favorites;
  const pages = [favorite('first'), favorite('second')];
  const requestedPages: number[] = [];
  api.characters.favorites = async (page) => {
    requestedPages.push(page);
    return page === 1
      ? { items: [pages[0]], total: 2, page, pageSize: 100 }
      : { items: [pages[1]], total: 2, page, pageSize: 100 };
  };

  try {
    const items = await loadAllFavoriteCharacters();
    assert.deepEqual(items.map((item) => item.id), ['first', 'second']);
    assert.deepEqual(requestedPages, [1, 2]);
  } finally {
    api.characters.favorites = originalFavorites;
  }
});
