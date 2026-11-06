import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  DESKTOP_MAIN_TABS,
  MOBILE_DRAWER_GROUPS,
  PRIMARY_MOBILE_TABS,
  ROUTE_NAVIGATION_ITEMS,
  isRouteTarget,
} from './navigation';

const app = fs.readFileSync(path.join(import.meta.dirname, 'App.tsx'), 'utf8');

test('mobile primary navigation exposes the five stable route tabs', () => {
  assert.deepEqual(PRIMARY_MOBILE_TABS, ['explore', 'chat', 'create', 'generate', 'my-ai']);
  assert.equal(new Set(PRIMARY_MOBILE_TABS).size, PRIMARY_MOBILE_TABS.length);
  PRIMARY_MOBILE_TABS.forEach((tab) => assert.equal(ROUTE_NAVIGATION_ITEMS[tab].presentation, 'route'));
  assert.deepEqual(
    PRIMARY_MOBILE_TABS.filter((tab) => ROUTE_NAVIGATION_ITEMS[tab].mobilePresentation === 'page'),
    ['create', 'generate'],
  );
});

test('drawer groups expose every visible route once and account actions as dialogs', () => {
  const entries = MOBILE_DRAWER_GROUPS.flatMap((group) => group.items);
  const routeEntries = entries.filter((item) => isRouteTarget(item.id));
  const routeIds = routeEntries.map((item) => item.id);
  assert.equal(new Set(routeIds).size, routeIds.length);
  assert.deepEqual(routeIds, ['explore', 'chat', 'create', 'generate', 'my-ai', 'feed', 'community', 'help', 'safety']);
  assert.deepEqual(entries.slice(-2).map((item) => item.id), ['profile', 'upgrade']);
  assert.ok(entries.slice(-2).every((item) => item.presentation === 'dialog'));
});

test('Feed is restored to desktop navigation and the mobile community drawer', () => {
  assert.deepEqual(DESKTOP_MAIN_TABS, ['explore', 'chat', 'generate', 'my-ai', 'feed', 'community']);
  assert.equal(ROUTE_NAVIGATION_ITEMS.feed.group, 'community');
  assert.equal(ROUTE_NAVIGATION_ITEMS.feed.mobilePresentation, 'route');
  const communityGroup = MOBILE_DRAWER_GROUPS.find((group) => group.id === 'community');
  assert.deepEqual(communityGroup?.items.map((item) => item.id), ['feed', 'community']);
});

test('App mounts the existing CharacterFeedView for the feed route', () => {
  assert.match(app, /import \{ CharacterFeedView \} from '\.\/components\/CharacterFeedView'/);
  assert.match(app, /activeTab === 'feed'[\s\S]*?<CharacterFeedView/);
  assert.match(app, /<CharacterFeedView[\s\S]*?onRequireAuth=\{\(\) => openAuth\('login'\)\}/);
});
