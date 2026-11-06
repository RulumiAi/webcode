import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {STORY_CARDS} from './discoveryCatalog';
import {STORY_WORLDS,worldCopy,worldText,worldEntryCount,estimatedWorldTokens} from './storyWorlds';
import type {Locale} from './types';
const locales:Locale[]=['en','zh-CN','ja','ko','es','pt'];
test('every story has a populated world, matching NPC roles, locations and chronological events',()=>{
 assert.deepEqual(Object.keys(STORY_WORLDS).sort(),STORY_CARDS.map(s=>s.id).sort());
 for(const story of STORY_CARDS){const world=STORY_WORLDS[story.id];assert.equal(world.roles.length,story.cast.length);assert.ok(world.scenes.length>=2);assert.deepEqual(world.events.map(e=>e.phase),['before','now','next']);assert.equal(story.entries,worldEntryCount(story));assert.equal(new Set(world.scenes.map(e=>e.image)).size,world.scenes.length);for(const scene of world.scenes)assert.ok(existsSync(`public${scene.image}`),`missing scene asset: ${scene.image}`);}
});
test('world detail labels, entries and NPC roles are complete in six languages',()=>{
 for(const locale of locales){assert.ok(Object.values(worldCopy(locale)).every(s=>s.trim().length>0));for(const story of STORY_CARDS){const world=STORY_WORLDS[story.id];for(const entry of [...world.scenes,...world.events]){assert.equal(entry.title.length,6);assert.equal(entry.body.length,6);assert.ok(worldText(entry.title,locale).trim());assert.ok(worldText(entry.body,locale).trim());}assert.ok(world.roles.every(role=>role.length===6&&worldText(role,locale).trim()));assert.ok(estimatedWorldTokens(story,locale)>0);}}
});
