import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const feed = fs.readFileSync(path.join(import.meta.dirname, 'CharacterFeedView.tsx'), 'utf8');
const community = fs.readFileSync(path.join(import.meta.dirname, 'CommunityPlazaView.tsx'), 'utf8');

test('feed requests pages and mounts only active video source', () => {
  assert.match(feed, /const FEED_PAGE_SIZE = 10/);
  assert.match(feed, /limit: FEED_PAGE_SIZE/);
  assert.doesNotMatch(feed, /limit: 100/);
  assert.match(feed, /src=\{currentFeedItem\.post\.media\.url\}/);
  assert.match(feed, /preload="metadata"/);
});

test('community lists thumbnails first and expands a video only after intent', () => {
  assert.match(community, /limit: 20/);
  assert.match(community, /new IntersectionObserver/);
  assert.match(community, /expandedVideoId === item\.id/);
  assert.match(community, /src=\{item\.media\.url\}/);
  assert.match(community, /loading="lazy"/);
  assert.doesNotMatch(community, /onError=\{\(event\) => \{\s*if \(event\.currentTarget\.src !== item\.media\.url\)/);
});
