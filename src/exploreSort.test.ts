import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = fs.readFileSync(path.join(import.meta.dirname, 'App.tsx'), 'utf8');

test('Explore defaults and resets to newest publishing order', () => {
  assert.equal((app.match(/sortBy: 'newest'/g) || []).length, 2);
  assert.doesNotMatch(app, /sortBy: 'trending'/);
  assert.match(app, /filterState\.sortBy !== 'newest'/);
});

test('Explore caches each private filter and sort snapshot', () => {
  assert.match(app, /pageDataCacheKey\(\s*'discovery'/);
  assert.match(app, /JSON\.stringify\(\{ \.\.\.filters, pageSize: discoveryPageSize \}\)/);
  assert.match(app, /readPageDataSnapshot<DiscoverySnapshot>\(discoveryCacheKey\)/);
  assert.match(app, /writePageDataSnapshot\(discoveryCacheKey/);
});

test('sort changes start immediately while other filters keep debounce', () => {
  assert.match(app, /const isSortChange = discoverySortRef\.current !== null/);
  assert.match(app, /const delay = initialDiscoveryLoadRef\.current \|\| isSortChange \? 0 : 300/);
  assert.match(app, /discoveryRequestRef\.current !== requestId/);
  assert.match(app, /controller\.abort\(\)/);
});
