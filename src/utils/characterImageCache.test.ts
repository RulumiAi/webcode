import assert from 'node:assert/strict';
import test from 'node:test';
import {publicApiTagsForUrl} from '../apiCachePolicy';

test('only public catalog routes expose persistent cache tags', () => {
  assert.deepEqual(publicApiTagsForUrl('/api/env1/v1/characters/?page=1'), ['characters']);
  assert.deepEqual(publicApiTagsForUrl('/api/env1/v1/feed/posts/?channel=dynamic'), ['feed']);
  assert.deepEqual(publicApiTagsForUrl('/api/env1/v1/meta/character-filter-tags/'), ['catalog']);
  assert.equal(publicApiTagsForUrl('/api/env1/v1/users/me/favorites/'), null);
  assert.equal(publicApiTagsForUrl('/api/env1/v1/chat/threads/'), null);
});
