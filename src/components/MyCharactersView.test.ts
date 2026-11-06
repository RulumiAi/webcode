import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { translate } from '../i18n';
import type { Locale } from '../types';

const componentsDir = import.meta.dirname;
const view = fs.readFileSync(path.join(componentsDir, 'MyCharactersView.tsx'), 'utf8');
const app = fs.readFileSync(path.join(componentsDir, '..', 'App.tsx'), 'utf8');

test('my characters view keeps only created and favorite tabs', () => {
  assert.equal(view.match(/setActiveSubTab\('/g)?.length, 2);
  assert.match(view, /setActiveSubTab\('created'\)/);
  assert.match(view, /setActiveSubTab\('favorite'\)/);
  assert.doesNotMatch(view, /chatting|searchQuery|<Search|onClearRecentChat|recentChatIds|recentChatsMap/);
  assert.match(view, /t\('my\.create'\)/);
  assert.match(view, /t\('my\.generate'\)/);
});

test('app does not pass removed chatting module props to my characters view', () => {
  const usage = app.match(/<MyCharactersView[\s\S]*?\/>/)?.[0] || '';
  assert.doesNotMatch(usage, /recentChatIds|recentChatsMap|onClearRecentChat/);
});

test('my characters page copy is localized in every supported locale', () => {
  const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'];
  const keys = [
    'my.eyebrow', 'my.title', 'my.description', 'my.create', 'my.created',
    'my.favorites', 'my.emptyCreated', 'my.emptyFavorites', 'my.hintCreated',
    'my.hintFavorites', 'my.generate', 'my.explore', 'my.deleteCreated',
    'my.confirmDelete', 'my.warning', 'my.cancel', 'my.confirmDeleteButton',
  ];
  for (const locale of locales) {
    for (const key of keys) {
      const value = translate(locale, key);
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
});
