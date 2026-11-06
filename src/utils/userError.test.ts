import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {extname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {userErrorCodeMessage, userErrorMessage} from './userError';

const t = (key: string) => `translated:${key}`;

test('user errors map stable codes and never return backend messages', () => {
  const raw = {code: 'UPSTREAM_TIMEOUT', status: 503, message: 'SQL traceback from provider'};
  assert.equal(userErrorMessage(raw, t, 'common.unknownError'), 'translated:create.errorUpstreamTimeout');
  assert.equal(userErrorMessage({code: 'UNKNOWN', message: 'secret exception'}, t, 'chat.errorSend'), 'translated:chat.errorSend');
  assert.equal(userErrorCodeMessage('UPSTREAM_SENSITIVE_CONTENT', t, 'generator.errorFailed'), 'translated:create.errorSensitiveContent');
});

test('unknown server and native network errors use safe user copy', () => {
  assert.equal(userErrorMessage({code: 'HTTP_ERROR', status: 502, message: '<html>502 Bad Gateway</html>'}, t, 'chat.errorSend'), 'translated:common.unknownError');
  assert.equal(userErrorMessage({code: 'UPSTREAM_UNKNOWN', status: 503, message: 'provider stack trace'}, t, 'chat.errorSend'), 'translated:common.unknownError');
  assert.equal(userErrorMessage({code: 'UPSTREAM_UNKNOWN', status: 504, message: 'upstream timeout details'}, t, 'chat.errorSend'), 'translated:common.unknownError');
  assert.equal(userErrorMessage(new TypeError('Failed to fetch'), t, 'chat.errorSend'), 'translated:common.unknownError');
});

test('visible env1 error paths do not render raw backend or provider text', () => {
  const sourceRoot = fileURLToPath(new URL('..', import.meta.url));
  const files: string[] = [];
  const visit = (path: string) => {
    for (const entry of readdirSync(path, {withFileTypes: true})) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (['.ts', '.tsx'].includes(extname(entry.name)) && !entry.name.endsWith('.test.ts')) files.push(child);
    }
  };
  visit(sourceRoot);
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');

  assert.doesNotMatch(source, /instanceof ApiError\s*\?\s*[^\n]*\.message/);
  assert.doesNotMatch(source, /lastError instanceof Error\s*\?\s*lastError\.message/);
  assert.doesNotMatch(source, /failureMessage\s*\|\|\s*[^\n]*failureCode/);
  assert.doesNotMatch(source, /stCard\.error(?:Message|Code)/);
  assert.doesNotMatch(source, />\{order\.failReason\}</);
  assert.doesNotMatch(source, /setError\([^\n]*event\.message/);
  assert.doesNotMatch(source, /providerMessage/);
});
