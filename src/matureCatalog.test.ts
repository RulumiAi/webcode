import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {EDITORIAL_LOOKS,editorialImage,isMaturePreviewCharacter} from './matureCatalog';
test('all six editorial presets are adults with available local assets',()=>{assert.equal(EDITORIAL_LOOKS.length,6);for(const [i,look] of EDITORIAL_LOOKS.entries()){assert.ok(look.age>=28);assert.ok(existsSync('public'+editorialImage(i)));assert.ok(look.tags.includes('portrait'))}assert.equal(new Set(EDITORIAL_LOOKS.map(s=>s.id)).size,6)});
test('mature sample classification never marks unrelated or malformed ids',()=>{assert.equal(isMaturePreviewCharacter('mio-18'),true);assert.equal(isMaturePreviewCharacter('mio-23'),true);assert.equal(isMaturePreviewCharacter('mio-17'),false);assert.equal(isMaturePreviewCharacter('mio-180'),false);assert.equal(isMaturePreviewCharacter('api-user-18'),false)});
