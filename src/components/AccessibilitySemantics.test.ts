import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const componentsDir = import.meta.dirname;
const generator = fs.readFileSync(path.join(componentsDir, 'AIGeneratorModal.tsx'), 'utf8');
const upgrade = fs.readFileSync(path.join(componentsDir, 'UpgradeModal.tsx'), 'utf8');

test('generator page exposes one heading path and keyboard-accessible scroll regions', () => {
  assert.match(generator, /const GeneratorHeading = isMobilePage \|\| isWorkspace \? 'h1' : 'h2';/);
  assert.match(generator, /<h1 id="ai-generator-title"/);
  assert.match(generator, /tabIndex=\{0\}[\s\S]*?aria-label=\{t\('generator\.title'\)\}/);
  assert.match(generator, /targetPickerScrollRef[\s\S]*?tabIndex=\{0\}[\s\S]*?aria-label=\{t\('generator\.characterPickerTitle'\)\}/);
  assert.match(generator, /setTargetPickerOpen\(false\)[\s\S]*?aria-label=\{t\('common\.close'\)\}/);
  assert.match(generator, /onClick=\{handleCopyPrompt\}[\s\S]*?aria-label=\{t\('generator\.prompt'\)\}/);
});

test('upgrade page uses the app main landmark and has a page heading', () => {
  assert.match(upgrade, /<h1 id="upgrade-title"/);
  assert.doesNotMatch(upgrade, /<main className=\{isPage/);
  assert.match(upgrade, /<div className=\{isPage[\s\S]*?<h1 id="upgrade-title"/);
  assert.match(upgrade, /focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2/);
});
