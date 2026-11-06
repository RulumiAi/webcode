import assert from 'node:assert/strict';
import test from 'node:test';
import { getDisplayTagLabels, isDisplayTagId } from './displayTags';
import { translate } from './i18n';
import { DISPLAY_TAG_IDS, type Locale } from './types';

const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko'];

test('localizes every stable display tag in every supported locale', () => {
  for (const locale of locales) {
    for (const displayTag of DISPLAY_TAG_IDS) {
      assert.equal(
        getDisplayTagLabels([displayTag], (key) => translate(locale, key))[0],
        translate(locale, `tags.display.${displayTag}`),
      );
    }
  }
});

test('keeps unknown display tags visible', () => {
  assert.deepEqual(getDisplayTagLabels(['future-tag'], () => 'translated'), ['future-tag']);
  assert.equal(isDisplayTagId('future-tag'), false);
});

test('localizes every tag while preserving order and unknown values', () => {
  assert.deepEqual(
    getDisplayTagLabels(['domme', 'future-tag', 'ntr'], (key) => key),
    ['tags.display.domme', 'future-tag', 'tags.display.ntr'],
  );
  assert.deepEqual(getDisplayTagLabels([], (key) => key), []);
});
