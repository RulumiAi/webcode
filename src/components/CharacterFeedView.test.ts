import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const feed = fs.readFileSync(path.join(import.meta.dirname, 'CharacterFeedView.tsx'), 'utf8');
const app = fs.readFileSync(path.join(import.meta.dirname, '..', 'App.tsx'), 'utf8');

test('video overlay keeps creator profile, follow, and like actions', () => {
  assert.match(feed, /const authorAvatar = currentFeedItem\?\.post\.author\.avatar\?\.url \|\| ''/);
  assert.match(feed, /onClick=\{\(\) => onOpenCreatorProfile\(authorName, creatorId\)\}/);
  assert.match(feed, /onClick=\{\(\) => onToggleFollowAuthor\(authorName, creatorId\)\}/);
  assert.match(feed, /handleToggleLike\(currentFeedItem\.post\)/);
  assert.match(feed, /<video[\s\S]*?\n\s+muted\n[\s\S]*?playsInline/);
});

test('video navigation uses vertical touch, wheel, and keyboard input', () => {
  assert.match(feed, /targetTouches\[0\]\.clientY/);
  assert.match(feed, /const distance = touchStartY - touchEndY/);
  assert.match(feed, /frame\.addEventListener\('wheel', handleWheel, \{ passive: false \}\)/);
  assert.match(feed, /ref=\{videoFrameRef\}/);
  assert.match(feed, /now - lastWheelAtRef\.current < 450/);
  assert.match(feed, /e\.key === 'ArrowDown'/);
  assert.match(feed, /e\.key === 'ArrowUp'/);
  assert.doesNotMatch(feed, /clientX|touchStartX|touchEndX|ArrowLeft|ArrowRight|ChevronLeft|ChevronRight/);
});

test('hot, following, and latest tabs load their complete feed variants', () => {
  assert.match(feed, /sort: activeTab === 'hot' \? 'trending' : 'newest'/);
  assert.match(feed, /following: activeTab === 'following' \? true : undefined/);
  assert.match(feed, /activeTab === 'following' && !isAuthenticated/);
  assert.match(feed, /followingRefreshKey = activeTab === 'following'/);
  assert.match(feed, /onRequireAuth\?\.\(\)/);
  assert.match(feed, /role="tablist"/);
  assert.match(feed, /aria-selected=\{activeTab === 'hot'\}/);
  assert.match(feed, /aria-selected=\{activeTab === 'following'\}/);
  assert.match(feed, /aria-selected=\{activeTab === 'new'\}/);
});

test('video overlay omits sound, sharing, details, chat, and metadata', () => {
  for (const removed of [
    'Volume2',
    'VolumeX',
    'Share2',
    'handleShare',
    'copiedShareId',
    "t('feed.soundOn')",
    "t('feed.soundOff')",
    "t('feed.share')",
    "t('feed.openDetails')",
    "t('feed.openChat')",
    "t('feed.swipe')",
    "t('feed.previous')",
    "t('feed.next')",
    'Video Index Counter',
    'Slide Navigation Indicator',
    'Bottom Left Character Bio',
    'Bottom Ambient Dark Gradient',
  ]) {
    assert.doesNotMatch(feed, new RegExp(removed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('feed route no longer passes chat or character detail callbacks', () => {
  const mount = app.match(/<CharacterFeedView[\s\S]*?\/>/)?.[0];
  assert.ok(mount);
  assert.doesNotMatch(mount, /onSelectCharacterToChat/);
  assert.doesNotMatch(mount, /onOpenCharacterDetail/);
  assert.match(mount, /isAuthenticated=\{Boolean\(currentUser\)\}/);
  assert.match(mount, /onOpenCreatorProfile=\{handleOpenCreatorProfile\}/);
});
