import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {generationPollDelay} from './generationPolling';

test('generation polling uses 1s, 2s and 5s stages', () => {
  assert.equal(generationPollDelay(0), 1000);
  assert.equal(generationPollDelay(9999), 1000);
  assert.equal(generationPollDelay(10_000), 2000);
  assert.equal(generationPollDelay(59_999), 2000);
  assert.equal(generationPollDelay(60_000), 5000);
});

test('generation polling removes missing jobs and rejects single-job waiters', () => {
  const source = readFileSync(new URL('./generationPolling.ts', import.meta.url), 'utf8');

  assert.match(source, /for \(const jobId of result\.missingIds\)/);
  assert.match(source, /this\.listeners\.delete\(jobId\)/);
  assert.match(source, /new ApiError\('GENERATION_NOT_FOUND'/);
});

test('generation polling resumes after a visibility abort race', () => {
  const source = readFileSync(new URL('./generationPolling.ts', import.meta.url), 'utf8');

  assert.match(source, /finally \{[\s\S]*this\.polling = false;[\s\S]*this\.controller = null;/);
  assert.match(source, /this\.listeners\.size[\s\S]*this\.timer === null/);
  assert.match(source, /document\.visibilityState === 'visible'[\s\S]*navigator\.onLine/);
  assert.match(source, /this\.schedule\(0\);/);
});

test('generator stops rendering and shows a retry for failed jobs', () => {
  const source = readFileSync(new URL('../components/AIGeneratorModal.tsx', import.meta.url), 'utf8');

  assert.match(source, /setGenerating\(false\);/);
  assert.match(source, /current\.status === 'failed'/);
  assert.match(source, /userErrorCodeMessage\(current\.failureCode/);
  assert.match(source, /generationJob\?\.status === 'failed'/);
  assert.match(source, /onClick=\{handleRetryGeneration\}/);
});
