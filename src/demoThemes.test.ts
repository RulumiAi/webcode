import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_THEMES,
  parseThemeSelection,
  selectionMatches,
  splitThemeChips,
  stripNsfwThemes,
  toggleThemeSelection,
  visibleDemoThemes,
} from './demoThemes';

test('theme selection is OR inside one dimension and All clears specifics', () => {
  assert.equal(toggleThemeSelection('all', 'romance'), 'romance');
  assert.equal(toggleThemeSelection('romance', 'fantasy'), 'romance,fantasy');
  assert.equal(toggleThemeSelection('romance,fantasy', 'romance'), 'fantasy');
  assert.equal(toggleThemeSelection('romance,fantasy', 'all'), 'all');
  assert.deepEqual(parseThemeSelection('all'), []);
  const themes = DEMO_THEMES.stories;
  assert.equal(selectionMatches(['comedy'], 'romance,comedy', themes), true);
  assert.equal(selectionMatches(['scifi'], 'romance,comedy', themes), false);
  assert.equal(selectionMatches(['daily'], 'urban_daily', themes), true);
  assert.equal(selectionMatches(['scifi'], 'all', themes), true);
});

test('featured chips stay within 6–8 and adult themes hide while the mode is off', () => {
  for (const kind of ['characters', 'stories', 'comics', 'photos', 'videos'] as const) {
    const visible = visibleDemoThemes(kind, { mature: false, hasContent: (item) => !item.nsfwOnly });
    const { primary } = splitThemeChips(visible);
    assert.ok(primary.length >= 6 && primary.length <= 8, kind);
    assert.equal(visible.some((item) => item.nsfwOnly), false);
  }
  const withAdult = visibleDemoThemes('characters', { mature: true, hasContent: () => true });
  assert.ok(withAdult.some((item) => item.id === 'demo_adult'));
  assert.equal(stripNsfwThemes('demo_sweet,demo_adult'), 'demo_sweet');
  assert.equal(stripNsfwThemes('demo_adult'), 'all');
});
