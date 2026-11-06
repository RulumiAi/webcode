import assert from 'node:assert/strict';
import test from 'node:test';
import { type ApiCharacter, type ApiCreatedCharacter, type ApiMedia, mapCharacter, mapCreatedCharacter, patchCharacterPersonalization } from './api';

function makeApiCharacter(overrides: Partial<ApiCharacter> = {}): ApiCharacter {
  return {
    id: 'character-1',
    slug: 'character-1',
    name: 'Nyx',
    age: 24,
    image: null,
    style: 'anime',
    gender: 'female',
    relationship: null,
    heritage: '',
    complexion: '',
    hair: '',
    personality: [],
    interests: [],
    bio: 'Legacy biography',
    displayDescription: 'Frontend display description',
    scenario: '',
    firstMes: '',
    voice: '',
    contentLocale: 'en',
    tags: [],
    displayTags: [],
    filterTags: [],
    creator: { id: 'creator-1', displayName: 'Creator', handle: 'creator', avatar: null, privateProfile: false },
    favoriteCount: 0,
    chatCount: 0,
    commentCount: 0,
    favoritedByMe: false,
    cardPreview: { image: null, video: null },
    visibility: 'public',
    moderationStatus: 'approved',
    featured: false,
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

test('keeps the public display description distinct from the legacy biography', () => {
  const character = mapCharacter(makeApiCharacter());
  assert.equal(character.displayDescription, 'Frontend display description');
  assert.equal(character.description, 'Legacy biography');
});

test('does not use the legacy biography when the public display description is empty', () => {
  const character = mapCharacter(makeApiCharacter({ displayDescription: '' }));
  assert.equal(character.displayDescription, '');
  assert.equal(character.description, 'Legacy biography');
});

test('maps filter tags separately from display tags', () => {
  const filterTags = [{ slug: 'theme_horror', label: '恐怖' }];
  const character = mapCharacter(makeApiCharacter({
    tags: ['legacy-tag'],
    displayTags: ['domme'],
    filterTags,
  }));
  assert.deepEqual(character.tags, ['domme']);
  assert.deepEqual(character.filterTags, filterTags);
});

test('maps the environment one comment count', () => {
  assert.equal(mapCharacter(makeApiCharacter({ commentCount: 8 })).commentCount, 8);
});

test('maps card preview image to the character avatar', () => {
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image: media('avatar-cover', 'image'), video: null },
  }));

  assert.equal(character.avatar, '/api/env1/v1/media/avatar-cover/');
});

test('keeps API content and locked preview URLs same-origin', () => {
  const image = {
    ...media('content-avatar', 'image'),
    url: 'http://127.0.0.1:8000/api/env1/v1/characters/character-1/media/content-avatar/content/',
  };
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image, video: null },
    showcase: [{
      media: { ...image, url: '' },
      sortOrder: 0,
      isCover: false,
      locked: true,
      unlockCost: 10,
      previewUrl: 'http://127.0.0.1:8000/api/env1/v1/characters/character-1/media/content-avatar/preview/',
    }],
  }), true);

  assert.equal(character.avatar, '/api/env1/v1/characters/character-1/media/content-avatar/content/');
  assert.equal(character.photos?.[0]?.url, '/api/env1/v1/characters/character-1/media/content-avatar/preview/');
});

test('maps S3 media URLs to same-origin media endpoints', () => {
  const image = {
    ...media('s3-avatar', 'image'),
    url: 'https://soulmingle-media-b-silly.s3.us-east-1.amazonaws.com/app/prod/public/media/avatar.webp',
    thumbnailUrl: 'https://soulmingle-media-b-silly.s3.us-east-1.amazonaws.com/app/prod/public/media/avatar-320.webp',
    thumbnailLargeUrl: 'https://soulmingle-media-b-silly.s3.us-east-1.amazonaws.com/app/prod/public/media/avatar-640.webp',
  };
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image, video: null },
    showcase: [{ media: image, sortOrder: 0, isCover: false }],
  }), true);

  assert.equal(character.avatar, '/api/env1/v1/media/s3-avatar/');
  assert.equal(character.avatarThumbnail, '/api/env1/v1/media/s3-avatar/thumbnail/320/');
  assert.equal(character.avatarThumbnailLarge, '/api/env1/v1/media/s3-avatar/thumbnail/640/');
  assert.equal(character.photos?.[0]?.url, '/api/env1/v1/media/s3-avatar/');
  assert.equal(character.photos?.[0]?.thumbnailUrl, '/api/env1/v1/media/s3-avatar/thumbnail/320/');
  assert.equal(character.photos?.[0]?.thumbnailLargeUrl, '/api/env1/v1/media/s3-avatar/thumbnail/640/');
});

test('preserves non-storage external media URLs', () => {
  const image = {
    ...media('external-image', 'image'),
    url: 'https://cdn.example.com/avatar.webp',
  };
  const character = mapCharacter(makeApiCharacter({ cardPreview: { image, video: null } }));

  assert.equal(character.avatar, 'https://cdn.example.com/avatar.webp');
});

test('merges discovery personalization without reloading the role card', () => {
  const character = mapCharacter(makeApiCharacter());
  const patched = patchCharacterPersonalization(character, {
    id: character.id,
    favoritedByMe: true,
    cardPreview: { image: media('personal-cover', 'image'), video: null },
  });

  assert.equal(patched.isFavorite, true);
  assert.equal(patched.avatar, '/api/env1/v1/media/personal-cover/');
  assert.equal(patched.displayDescription, character.displayDescription);
  assert.equal(patched.id, character.id);
});

function makeApiCreatedCharacter(overrides: Partial<ApiCreatedCharacter> = {}): ApiCreatedCharacter {
  return {
    id: 'created-1',
    name: 'Mira',
    age: 23,
    creationMode: 'manual',
    style: 'realistic',
    gender: 'female',
    relationship: 'friendship',
    relationshipDetail: '',
    heritage: '',
    complexion: '',
    hair: '',
    personality: [],
    interests: [],
    subtitle: '',
    backgroundStory: '',
    bio: '',
    scenario: '',
    voice: '',
    tags: [],
    filterTags: [],
    systemPrompt: '',
    firstMessage: '',
    exampleDialogue: '',
    appearanceProfile: {},
    creationSelections: {},
    occupation: '',
    intimacyPreferences: [],
    advancedDetails: '',
    autoComplete: false,
    writingModel: '',
    contentLocale: 'zh-CN',
    image: null,
    gallery: [],
    designJob: null,
    generationPrompt: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

test('maps created character filter tags and preserves blank labels for slug fallback', () => {
  const filterTags = [
    { slug: 'theme_daily_life', label: '日常生活' },
    { slug: 'identity_student', label: '' },
  ];
  const character = mapCreatedCharacter(makeApiCreatedCharacter({ filterTags }));

  assert.deepEqual(character.filterTags, filterTags);
  assert.equal(character.filterTags?.[1]?.label || character.filterTags?.[1]?.slug, 'identity_student');
  assert.deepEqual(mapCreatedCharacter(makeApiCreatedCharacter()).filterTags, []);
});

test('maps created character background story to the detail description', () => {
  const character = mapCreatedCharacter(makeApiCreatedCharacter({
    subtitle: 'A short hook',
    backgroundStory: 'A complete background story.',
  }));

  assert.equal(character.description, 'A complete background story.');
  assert.equal(character.displayDescription, 'A complete background story.');
  assert.equal(character.subtitle, 'A short hook');
});

test('preserves created character step 4 selections for card tags', () => {
  const creationSelections = {
    personality: ['调情'],
    occupation: ['首席执行官'],
    relationship: ['恋人'],
    fetishes: ['日常'],
  };
  const character = mapCreatedCharacter(makeApiCreatedCharacter({ creationSelections }));

  assert.deepEqual(character.creationSelections, creationSelections);
  assert.equal(character.source, 'created');
});

function media(id: string, mediaType: 'image' | 'video'): ApiMedia {
  return {
    id, url: '/api/env1/v1/media/' + id + '/', mediaType, mimeType: mediaType + '/test',
    width: null, height: null, durationSeconds: mediaType === 'video' ? 5 : null,
    sizeBytes: 0, moderationStatus: 'approved', likeCount: 0, likedByMe: false, createdAt: '',
  };
}

test('maps detail media thumbnails separately from original media URLs', () => {
  const photo = {
    ...media('photo', 'image'),
    thumbnailUrl: '/api/env1/v1/media/photo/thumbnail/320/',
    thumbnailLargeUrl: '/api/env1/v1/media/photo/thumbnail/640/',
  };
  const character = mapCharacter(makeApiCharacter({
    showcase: [{ media: photo, sortOrder: 0, isCover: false }],
  }), true);

  assert.equal(character.photos?.[0]?.url, '/api/env1/v1/media/photo/');
  assert.equal(character.photos?.[0]?.thumbnailUrl, '/api/env1/v1/media/photo/thumbnail/320/');
  assert.equal(character.photos?.[0]?.thumbnailLargeUrl, '/api/env1/v1/media/photo/thumbnail/640/');
});

test('maps Showcase images and videos only in character detail mode', () => {
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image: media('cover', 'image'), video: null },
    showcase: [
      { media: media('photo', 'image'), sortOrder: 0, isCover: false },
      { media: media('clip', 'video'), sortOrder: 1, isCover: true },
    ],
  }), true);
  assert.deepEqual(character.photos?.map((item) => item.id), ['photo']);
  assert.deepEqual(character.videos?.map((item) => item.id), ['clip']);
  assert.equal(character.videos?.[0]?.coverUrl, '/api/env1/v1/media/cover/');
  assert.deepEqual(mapCharacter(makeApiCharacter({ showcase: [{ media: media('photo', 'image'), sortOrder: 0, isCover: false }] })).photos, []);
});

test('keeps env1 detail media limited to Showcase and preserves access state', () => {
  const shared = media('shared-photo', 'image');
  const character = mapCharacter(makeApiCharacter({
    showcase: [{
      media: { ...shared, url: null }, sortOrder: 0, isCover: false,
      locked: true, unlockCost: 10, previewUrl: '/api/env1/v1/characters/character/media/shared-photo/preview/',
    }],
    gallery: [
      { media: shared, sortOrder: 0, videoThumbnail: null, isCover: false },
      { media: media('chat-photo', 'image'), sortOrder: 1, videoThumbnail: null, isCover: false },
    ],
  }), true);

  assert.deepEqual(character.photos?.map((item) => item.id), ['shared-photo']);
  assert.equal(character.photos?.[0]?.locked, true);
  assert.equal(character.photos?.[0]?.unlockCost, 10);
  assert.match(character.photos?.[0]?.url || '', /preview/);
});

test('ignores stale blurred previews for free Showcase media', () => {
  const clearPhoto = media('free-photo', 'image');
  const clearVideo = media('free-video', 'video');
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image: media('clear-cover', 'image'), video: clearVideo },
    showcase: [
      {
        media: clearPhoto, sortOrder: 0, isCover: false,
        locked: false, unlockCost: 0, previewUrl: '/api/env1/v1/characters/character/media/free-photo/preview/',
      },
      {
        media: clearVideo, sortOrder: 1, isCover: true,
        locked: false, unlockCost: 0, previewUrl: '/api/env1/v1/characters/character/media/free-video/preview/',
      },
    ],
  }), true);

  assert.equal(character.photos?.[0]?.url, '/api/env1/v1/media/free-photo/');
  assert.equal(character.photos?.[0]?.previewUrl, undefined);
  assert.equal(character.videos?.[0]?.coverUrl, '/api/env1/v1/media/clear-cover/');
});

test('uses blurred previews only for locked Showcase media', () => {
  const lockedPhoto = { ...media('locked-photo', 'image'), url: '' };
  const lockedVideo = { ...media('locked-video', 'video'), url: '' };
  const photoPreview = '/api/env1/v1/characters/character/media/locked-photo/preview/';
  const videoPreview = '/api/env1/v1/characters/character/media/locked-video/preview/';
  const character = mapCharacter(makeApiCharacter({
    cardPreview: { image: media('clear-cover', 'image'), video: null },
    showcase: [
      { media: lockedPhoto, sortOrder: 0, isCover: false, locked: true, unlockCost: 10, previewUrl: photoPreview },
      { media: lockedVideo, sortOrder: 1, isCover: true, locked: true, unlockCost: 10, previewUrl: videoPreview },
    ],
  }), true);

  assert.equal(character.photos?.[0]?.url, photoPreview);
  assert.equal(character.photos?.[0]?.previewUrl, photoPreview);
  assert.equal(character.videos?.[0]?.coverUrl, videoPreview);
});
