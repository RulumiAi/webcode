import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.join(import.meta.dirname, 'TopHeader.tsx'), 'utf8');

test('desktop sort select exposes the shared accessible name', () => {
  assert.match(source, /<select\s+aria-label=\{t\('discover\.sortLabel'\)\}\s+value=\{filterState\.sortBy\}/);
});
