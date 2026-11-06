import assert from 'node:assert/strict';
import test from 'node:test';

import type { ApiGenerationJob, ApiMedia } from '../api';
import { readablePortrait } from './creationProgress';

const image = (url: string): ApiMedia => ({ mediaType: 'image', url } as ApiMedia);

test('standard creation becomes ready as soon as a readable portrait exists', () => {
  const processing = {
    status: 'processing',
    designProfileStatus: 'processing',
    outputs: [image('/media/portrait.jpg')],
  } as ApiGenerationJob;

  assert.equal(readablePortrait(processing)?.url, '/media/portrait.jpg');
});

test('missing or blank image output is not ready', () => {
  assert.equal(readablePortrait({ outputs: [] }), null);
  assert.equal(readablePortrait({ outputs: [image('')] }), null);
});
