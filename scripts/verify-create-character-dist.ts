import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {
  CREATE_CHARACTER_ASSET_COPY_PLAN,
  CREATE_CHARACTER_ASSET_MANIFEST,
  CREATE_CHARACTER_FANTASY_SPECIES_IDS,
  CREATE_CHARACTER_OPTION_IDS,
  getCreateCharacterFantasySpeciesAsset,
  getCreateCharacterOptionIds,
  type CreateCharacterArtStyle,
  type CreateCharacterGender,
  type CreateCharacterOptionCategory,
} from '../src/data/createCharacterAssets';

const root = join(process.cwd(), 'dist');
const genders: CreateCharacterGender[] = ['female', 'male', 'nonbinary'];
const artStyles: CreateCharacterArtStyle[] = ['anime', 'realistic'];
const categories = Object.keys(CREATE_CHARACTER_OPTION_IDS) as CreateCharacterOptionCategory[];
const expected = new Set<string>();
for (const {target} of CREATE_CHARACTER_ASSET_COPY_PLAN) expected.add(target);

for (const gender of genders) {
  for (const artStyle of artStyles) {
    const assets = CREATE_CHARACTER_ASSET_MANIFEST[gender];
    expected.add(assets.main[artStyle].poster);
    expected.add(assets.main[artStyle].video);
    for (const category of categories) {
      const categoryAssets = assets.options[artStyle][category] as Record<string, {src: string; video?: string}>;
      for (const id of getCreateCharacterOptionIds(gender, category)) {
        expected.add(categoryAssets[id].src);
        if (categoryAssets[id].video) expected.add(categoryAssets[id].video as string);
      }
    }
  }
}

for (const gender of ['female', 'male'] as const) {
  for (const artStyle of artStyles) {
    for (const speciesId of CREATE_CHARACTER_FANTASY_SPECIES_IDS) {
      const asset = getCreateCharacterFantasySpeciesAsset(gender, artStyle, speciesId);
      expected.add(asset.src);
      expected.add(asset.video as string);
    }
  }
}

for (const url of expected) {
  assert.doesNotMatch(url, /[^\x00-\x7f]/, url);
  assert.equal(existsSync(join(root, url.replace(/^\//, ''))), true, url);
}

assert.equal(existsSync(join(root, 'create-character', 'v2')), false, 'dist/create-character/v2 must be removed');
assert.equal(existsSync(join(root, 'create-character', 'assets', 'v3')), false, 'dist/create-character/assets/v3 must be removed');
assert.equal(existsSync(join(root, 'create-character', 'assets', 'v4')), false, 'dist/create-character/assets/v4 must be removed');
assert.equal(new Set(CREATE_CHARACTER_ASSET_COPY_PLAN.map(({target}) => target)).size, CREATE_CHARACTER_ASSET_COPY_PLAN.length);

console.log(JSON.stringify({status: 'ok', assets: expected.size, aliases: CREATE_CHARACTER_ASSET_COPY_PLAN.length}, null, 2));
