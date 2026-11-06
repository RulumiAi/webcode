import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { Locale } from '../types';
import {
  CREATE_CHARACTER_ASSET_MANIFEST,
  CREATE_CHARACTER_ASSET_COPY_PLAN,
  CREATE_CHARACTER_MISSING_ASSETS,
  CREATE_CHARACTER_FANTASY_SPECIES_IDS,
  CREATE_CHARACTER_OPTION_IDS,
  getCreateCharacterMainPreviewAsset,
  getCreateCharacterFantasySpeciesAsset,
  getCreateCharacterOptionAsset,
  getCreateCharacterOptionIds,
  getCreateCharacterOptionLabel,
  normalizeCreateCharacterAssetUrl,
  type CreateCharacterArtStyle,
  type CreateCharacterGender,
  type CreateCharacterOptionCategory,
} from './createCharacterAssets';

const genders: CreateCharacterGender[] = ['female', 'male', 'nonbinary'];
const artStyles: CreateCharacterArtStyle[] = ['anime', 'realistic'];
const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'];
const categories = Object.keys(CREATE_CHARACTER_OPTION_IDS) as CreateCharacterOptionCategory[];
const copySourceByTarget = new Map(CREATE_CHARACTER_ASSET_COPY_PLAN.map(({source, target}) => [target, source]));

function publicAssetExists(src: string) {
  return existsSync(join(process.cwd(), 'public', src.replace(/^\//, '')));
}

function assetSourceExists(src: string) {
  return publicAssetExists(copySourceByTarget.get(src) || src);
}

function assertAsciiUrl(src: string) {
  assert.doesNotMatch(src, /[^\x00-\x7f]/, src);
}

test('every main preview and available option points to a local asset', () => {
  const fallbackPaths: string[] = [];

  for (const gender of genders) {
    for (const artStyle of artStyles) {
      const assets = CREATE_CHARACTER_ASSET_MANIFEST[gender];
      assert.equal(assetSourceExists(assets.main[artStyle].poster), true, assets.main[artStyle].poster);
      assert.equal(assetSourceExists(assets.main[artStyle].video), true, assets.main[artStyle].video);
      assert.match(assets.main[artStyle].poster, /^\/create-character\/assets\/v5\/main\//);
      assert.match(assets.main[artStyle].posterSrcSet, /480w, .* 768w$/);
      assert.match(assets.main[artStyle].video, /^\/create-character\/assets\/v5\/main\//);
      assertAsciiUrl(assets.main[artStyle].poster);
      assertAsciiUrl(assets.main[artStyle].video);

      for (const category of categories) {
        for (const id of getCreateCharacterOptionIds(gender, category)) {
          const asset = (assets.options[artStyle][category] as Record<string, { src: string; video?: string; fallback: boolean }>)[id];
          assert.ok(asset, `${gender}/${artStyle}/${category}/${id}`);
          if (asset.fallback) {
            fallbackPaths.push(`${gender}/${artStyle}/${category}/${id}`);
            assert.match(asset.src, /^https:\/\//);
          } else {
            assert.equal(assetSourceExists(asset.src), true, asset.src);
            assertAsciiUrl(asset.src);
          }
          if (asset.video) {
            assert.equal(assetSourceExists(asset.video), true, asset.video);
            assertAsciiUrl(asset.video);
          }

          if (gender === 'nonbinary') assert.match(asset.src, /\/options\/nonbinary\//);
        }
      }
    }
  }

  assert.deepEqual(fallbackPaths.sort(), [...CREATE_CHARACTER_MISSING_ASSETS].sort());
  assert.equal(fallbackPaths.length, 0);
});

test('main preview media exposes poster and video fields for the preview component', () => {
  for (const gender of genders) {
    for (const artStyle of artStyles) {
      const media = CREATE_CHARACTER_ASSET_MANIFEST[gender].main[artStyle];
      assert.equal(typeof media.poster, 'string');
      assert.equal(typeof media.video, 'string');
      assert.ok(media.poster.length > 0);
      assert.ok(media.video.length > 0);
    }
  }
});

test('main preview adapter maps poster to the preview src field', () => {
  const asset = getCreateCharacterMainPreviewAsset('female', 'anime');
  assert.equal(asset.src, CREATE_CHARACTER_ASSET_MANIFEST.female.main.anime.poster);
  assert.equal(asset.video, CREATE_CHARACTER_ASSET_MANIFEST.female.main.anime.video);
  assert.equal(asset.fallback, false);
});

test('asset URL normalization encodes local Unicode paths once', () => {
  const encoded = normalizeCreateCharacterAssetUrl('/create-character/v2/创建女角色/二次元.jpg');
  assert.match(encoded, /%E5%88%9B%E5%BB%BA%E5%A5%B3%E8%A7%92/);
  assert.equal(normalizeCreateCharacterAssetUrl(encoded), encoded);
  assert.equal(normalizeCreateCharacterAssetUrl('https://cdn.example.test/a.jpg'), 'https://cdn.example.test/a.jpg');
});

test('versioned asset copy plan has unique ASCII targets backed by source files', () => {
  assert.equal(copySourceByTarget.size, CREATE_CHARACTER_ASSET_COPY_PLAN.length);
  for (const {source, target} of CREATE_CHARACTER_ASSET_COPY_PLAN) {
    assert.match(source, /^\/create-character\/(?!assets\/v5\/)/);
    assert.match(target, /^\/create-character\/assets\/v5\//);
    assertAsciiUrl(target);
    assert.equal(publicAssetExists(source), true, source);
  }
});

test('fantasy species previews use local gender/style-specific image and video assets', () => {
  for (const gender of ['female', 'male'] as const) {
    for (const artStyle of artStyles) {
      for (const speciesId of CREATE_CHARACTER_FANTASY_SPECIES_IDS) {
        const asset = getCreateCharacterFantasySpeciesAsset(gender, artStyle, speciesId);
        assert.equal(asset.fallback, false);
        assert.equal(assetSourceExists(asset.src), true, asset.src);
        assert.ok(asset.video);
        assert.equal(assetSourceExists(asset.video), true, asset.video);
        assert.match(asset.src, new RegExp(`/assets/v5/fantasy/${gender}/${artStyle}/`));
        assertAsciiUrl(asset.src);
        assertAsciiUrl(asset.video);
      }
    }
  }
});

test('all visual option names exist in every supported locale', () => {
  for (const locale of locales) {
    for (const gender of genders) {
      for (const category of categories) {
        for (const id of getCreateCharacterOptionIds(gender, category)) {
          const label = getCreateCharacterOptionLabel(locale, gender, category, id);
          assert.ok(label.trim(), `${locale}/${gender}/${category}/${id}`);
          assert.notEqual(label, id, `${locale}/${gender}/${category}/${id}`);
        }
      }
    }
  }

  assert.equal(getCreateCharacterOptionLabel('zh-CN', 'male', 'hair', 'twin_tails'), '低马尾');
  assert.equal(getCreateCharacterOptionLabel('ja', 'female', 'hair', 'twin_tails'), 'ツインブレイド');
  assert.equal(getCreateCharacterOptionLabel('ko', 'male', 'body', 'tall_model'), '넓은 어깨의 근육질');
  assert.equal(getCreateCharacterOptionLabel('es', 'male', 'hair', 'twin_tails'), 'Coleta baja');
  assert.equal(getCreateCharacterOptionLabel('pt', 'female', 'eye', 'heterochromia'), 'Heterocromia');
  assert.deepEqual(getCreateCharacterOptionIds('female', 'hair'), ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'classic_bob', 'bangs', 'high_ponytail', 'half_up', 'wool_curls']);
  assert.deepEqual(getCreateCharacterOptionIds('male', 'hair'), ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'afro', 'buzz_cut', 'mohawk', 'slick_back']);
  assert.deepEqual(getCreateCharacterOptionIds('nonbinary', 'hair'), ['waves', 'bob', 'twin_tails', 'hime_cut', 'wolf_cut', 'classic_bob', 'bangs', 'high_ponytail', 'half_up', 'wool_curls']);
  assert.deepEqual(getCreateCharacterOptionIds('nonbinary', 'eye'), []);
  assert.match(CREATE_CHARACTER_ASSET_MANIFEST.nonbinary.main.anime.poster, /\/assets\/v5\/main\/nonbinary\/anime\/poster-768\.webp$/);
  assert.match(getCreateCharacterOptionAsset('nonbinary', 'anime', 'hair', 'waves').src, /\/options\/nonbinary\/anime\/hair\/waves-384\.webp$/);
  assert.match(getCreateCharacterOptionAsset('nonbinary', 'anime', 'hip', 'peach').src, /\/options\/nonbinary\/anime\/hip\/peach-384\.webp$/);
  assert.match(getCreateCharacterOptionAsset('nonbinary', 'anime', 'chest', 'full').video || '', /\/options\/nonbinary\/anime\/chest\/full\.mp4$/);
  assert.match(getCreateCharacterOptionAsset('nonbinary', 'realistic', 'body', 'athletic').video || '', /\/options\/nonbinary\/realistic\/body\/athletic\.mp4$/);
});
