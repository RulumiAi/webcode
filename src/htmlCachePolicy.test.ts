import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getHtmlCacheControl,
  PRIVATE_HTML_CACHE_CONTROL,
  PUBLIC_HTML_CACHE_CONTROL,
} from './htmlCachePolicy';

test('public document routes use short CDN revalidation', () => {
  for (const pathname of ['/', '/feed', '/community/', '/help?utm=test', '/safety', '/characters/demo', '/characters/demo/']) {
    assert.equal(getHtmlCacheControl(pathname), PUBLIC_HTML_CACHE_CONTROL, pathname);
  }
});

test('private, unknown, and workspace routes are never publicly cached', () => {
  for (const pathname of ['/chat', '/create', '/generate', '/my-ai', '/referral', '/upgrade', '/unknown', '/characters/']) {
    assert.equal(getHtmlCacheControl(pathname), PRIVATE_HTML_CACHE_CONTROL, pathname);
  }
});
