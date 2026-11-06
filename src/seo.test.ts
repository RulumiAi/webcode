import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  SITE_ORIGIN,
  createSeoMetadata,
  getCanonicalUrl,
  getPathForCharacter,
  getRouteFromPath,
  getServerSeoMetadata,
} from './seo';

test('maps public navigation paths and trailing slashes to stable routes', () => {
  assert.deepEqual(getRouteFromPath('/'), { kind: 'tab', tab: 'explore' });
  assert.deepEqual(getRouteFromPath('/feed/'), { kind: 'tab', tab: 'feed' });
  assert.deepEqual(getRouteFromPath('/community'), { kind: 'tab', tab: 'community' });
  assert.deepEqual(getRouteFromPath('/unknown'), { kind: 'tab', tab: 'explore' });
});

test('maps character paths and canonical URLs without query strings', () => {
  assert.deepEqual(getRouteFromPath('/characters/abc-123/'), { kind: 'character', characterId: 'abc-123' });
  assert.equal(getPathForCharacter('hello world'), '/characters/hello%20world');
  assert.equal(getCanonicalUrl('/feed?sort=newest'), `${SITE_ORIGIN}/feed`);
  assert.equal(getCanonicalUrl('/characters/abc-123?from=feed'), `${SITE_ORIGIN}/characters/abc-123`);
});

test('marks private tabs noindex and public tabs indexable', () => {
  const publicMetadata = createSeoMetadata({
    route: { kind: 'tab', tab: 'community' },
    title: 'Community | Lurova.AI',
    description: 'Community creations',
  });
  const privateMetadata = createSeoMetadata({
    route: { kind: 'tab', tab: 'chat' },
    title: 'Chat | Lurova.AI',
    description: 'Private chat',
  });
  assert.equal(publicMetadata.robots, 'index,follow');
  assert.equal(privateMetadata.robots, 'noindex,follow');
});

test('server metadata has route-specific initial HTML copy', () => {
  const feed = getServerSeoMetadata('/feed');
  const safety = getServerSeoMetadata('/safety');
  assert.notEqual(feed.title, safety.title);
  assert.equal(feed.canonicalPath, '/feed');
  assert.equal(safety.canonicalPath, '/safety');
  assert.match(feed.heading, /feed/i);
  assert.match(safety.body, /safety/i);
});

test('index shell exposes static SEO metadata, fallback heading, and structured data', () => {
  const index = fs.readFileSync(path.join(import.meta.dirname, '..', 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(import.meta.dirname, '..', 'public', 'sitemap.xml'), 'utf8');
  assert.match(index, /<h1[^>]*data-lurova-seo="fallback-heading"/);
  assert.match(index, /data-lurova-seo="description"/);
  assert.match(index, /data-lurova-seo="og:title"/);
  assert.match(index, /data-lurova-seo="twitter:card"/);
  assert.match(index, /application\/ld\+json/);
  assert.match(sitemap, /https:\/\/lurova\.ai\/feed/);
  assert.match(sitemap, /https:\/\/lurova\.ai\/community/);
  assert.match(sitemap, /https:\/\/lurova\.ai\/help/);
  assert.match(sitemap, /https:\/\/lurova\.ai\/safety/);
});
