import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentTagIds,contentTagLabel,matchesContentTag} from './contentTags';
import {STORY_CARDS} from './discoveryCatalog';
import type {Locale} from './types';
test('medium-specific taxonomies cover distinct use cases in every supported language',()=>{for(const kind of ['stories','comics','photos','videos'] as const){const ids=contentTagIds(kind);assert.ok(ids.length>=28);assert.equal(new Set(ids).size,ids.length);for(const locale of ['en','ja','ko','zh-CN','es','pt'] as Locale[])for(const id of ids)assert.ok(contentTagLabel(id,locale))}assert.ok(contentTagIds('comics').includes('vertical'));assert.ok(!contentTagIds('stories').includes('vertical'));assert.ok(contentTagIds('photos').includes('kimono'));assert.ok(contentTagIds('videos').includes('loop'))});
test('night and castle filters select appropriate story settings and all resets the filter',()=>{const night=STORY_CARDS.filter(s=>matchesContentTag(s,'stories','night')).map(s=>s.id);assert.ok(night.includes('neon-exile'));assert.ok(!night.includes('cafe-crew'));assert.deepEqual(STORY_CARDS.filter(s=>matchesContentTag(s,'stories','castle')).map(s=>s.id),['eldria']);assert.equal(STORY_CARDS.filter(s=>matchesContentTag(s,'photos','all')).length,STORY_CARDS.length)});
