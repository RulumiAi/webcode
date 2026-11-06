import {CREATE_CHARACTER_ASSET_COPY_PLAN} from '../src/data/createCharacterAssets';
import {GENERATOR_PRESET_ASSET_PLAN} from '../src/data/generatorPresets';

process.stdout.write(JSON.stringify({
  createCharacter: CREATE_CHARACTER_ASSET_COPY_PLAN,
  generator: GENERATOR_PRESET_ASSET_PLAN.map((item) => ({...item, kind: 'image'})),
}));
