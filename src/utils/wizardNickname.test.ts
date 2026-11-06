import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalWizardNickname, getLocalWizardNicknameCandidates } from './wizardNickname';

test('local nickname fallback is localized for every supported locale', () => {
  for (const locale of ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'] as const) {
    const candidates = getLocalWizardNicknameCandidates(locale);
    assert.ok(candidates.length > 0);
    assert.equal(getLocalWizardNickname(locale, 0), candidates[0]);
    assert.equal(getLocalWizardNickname(locale, 0.999), candidates[candidates.length - 1]);
  }
});
