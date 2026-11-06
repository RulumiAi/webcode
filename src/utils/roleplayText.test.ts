import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRoleplayText } from './roleplayText';

const shape = (text: string) => parseRoleplayText(text).map(({ type, text: value }) => ({ type, text: value }));

test('splits one narration segment from dialogue', () => {
  assert.deepEqual(shape('*action*hello'), [
    { type: 'narration', text: '*action*' },
    { type: 'dialogue', text: 'hello' },
  ]);
});

test('keeps multiple narration and dialogue segments in order', () => {
  assert.deepEqual(shape('A *one* B *two* C'), [
    { type: 'dialogue', text: 'A ' },
    { type: 'narration', text: '*one*' },
    { type: 'dialogue', text: ' B ' },
    { type: 'narration', text: '*two*' },
    { type: 'dialogue', text: ' C' },
  ]);
});

test('treats half-width and full-width parentheses as narration', () => {
  assert.deepEqual(shape('Hello (walks closer) 你好（轻轻点头）'), [
    { type: 'dialogue', text: 'Hello ' },
    { type: 'narration', text: '(walks closer)' },
    { type: 'dialogue', text: ' 你好' },
    { type: 'narration', text: '（轻轻点头）' },
  ]);
});

test('keeps mixed narration markers in source order', () => {
  assert.deepEqual(shape('*smiles* Hi (waves) こんにちは（微笑む）'), [
    { type: 'narration', text: '*smiles*' },
    { type: 'dialogue', text: ' Hi ' },
    { type: 'narration', text: '(waves)' },
    { type: 'dialogue', text: ' こんにちは' },
    { type: 'narration', text: '（微笑む）' },
  ]);
});

test('supports multiline CJK, emoji, and nested parentheses', () => {
  assert.deepEqual(shape('（她低声说\n（几乎听不见）👋）之后'), [
    { type: 'narration', text: '（她低声说\n（几乎听不见）👋）' },
    { type: 'dialogue', text: '之后' },
  ]);
  assert.deepEqual(shape('(outer （inner）) done'), [
    { type: 'narration', text: '(outer （inner）)' },
    { type: 'dialogue', text: ' done' },
  ]);
});

test('supports newlines, CJK text and emoji as plain text', () => {
  assert.deepEqual(shape('*动作\n继续* 你好 👋'), [
    { type: 'narration', text: '*动作\n继续*' },
    { type: 'dialogue', text: ' 你好 👋' },
  ]);
});

test('leaves an incomplete narration marker as dialogue during streaming', () => {
  assert.deepEqual(shape('*still typing'), [{ type: 'dialogue', text: '*still typing' }]);
  assert.deepEqual(shape('*still typing* reply'), [
    { type: 'narration', text: '*still typing*' },
    { type: 'dialogue', text: ' reply' },
  ]);
  assert.deepEqual(shape('(still typing'), [{ type: 'dialogue', text: '(still typing' }]);
  assert.deepEqual(shape('（まだ入力中'), [{ type: 'dialogue', text: '（まだ入力中' }]);
});

test('does not interpret empty or double-star markers', () => {
  assert.deepEqual(shape('**** **bold** * *'), [{ type: 'dialogue', text: '**** **bold** * *' }]);
  assert.deepEqual(shape('hello () and （ ）'), [{ type: 'dialogue', text: 'hello () and （ ）' }]);
  assert.deepEqual(shape('(unclosed'), [{ type: 'dialogue', text: '(unclosed' }]);
});

test('keeps HTML-looking content as text', () => {
  assert.deepEqual(shape('<script>*not code*</script>'), [
    { type: 'dialogue', text: '<script>' },
    { type: 'narration', text: '*not code*' },
    { type: 'dialogue', text: '</script>' },
  ]);
});

test('treats unquoted scene text as narration around quoted dialogue', () => {
  assert.deepEqual(shape(
    `Zoey's expression hardened, a flicker of disgust crossing her face before she forced it neutral.\n\n"No. And if that's your idea of a joke, it's not funny. Don't ask again."`,
  ), [
    { type: 'narration', text: "Zoey's expression hardened, a flicker of disgust crossing her face before she forced it neutral.\n\n" },
    { type: 'dialogue', text: '"No. And if that\'s your idea of a joke, it\'s not funny. Don\'t ask again."' },
  ]);
});

test('supports curly quotes and keeps apostrophes inside dialogue', () => {
  assert.deepEqual(shape('她抬起眼睛。“I\'m fine,” she said. “真的没事。”'), [
    { type: 'narration', text: '她抬起眼睛。' },
    { type: 'dialogue', text: '“I\'m fine,”' },
    { type: 'narration', text: ' she said. ' },
    { type: 'dialogue', text: '“真的没事。”' },
  ]);
});

test('combines explicit narration markers with quoted dialogue', () => {
  assert.deepEqual(shape('*She smiles.* "Hello." (and waves)'), [
    { type: 'narration', text: '*She smiles.*' },
    { type: 'narration', text: ' ' },
    { type: 'dialogue', text: '"Hello."' },
    { type: 'narration', text: ' ' },
    { type: 'narration', text: '(and waves)' },
  ]);
});

test('keeps incomplete quoted streaming text as dialogue', () => {
  assert.deepEqual(shape('She looks away. "still typing'), [
    { type: 'dialogue', text: 'She looks away. "still typing' },
  ]);
});

test('keeps a plain unmarked reply as dialogue', () => {
  assert.deepEqual(shape('Hello, I am here.'), [
    { type: 'dialogue', text: 'Hello, I am here.' },
  ]);
});
