import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const componentsDir = import.meta.dirname;
const sidebar = fs.readFileSync(path.join(componentsDir, 'Sidebar.tsx'), 'utf8');
const app = fs.readFileSync(path.join(componentsDir, '..', 'App.tsx'), 'utf8');

test('sidebar brand icon and wordmark share one homepage link', () => {
  assert.match(sidebar, /<a\s+href="\/"[\s\S]*?<BrandLogo[\s\S]*?lurova[\s\S]*?\.ai[\s\S]*?<\/a>/);
  assert.match(sidebar, /aria-label=\{t\('nav\.explore'\)\}/);
  assert.match(sidebar, /collapsed \? 'h-7 w-7' : 'h-8 w-8'/);
});

test('normal brand clicks use in-app navigation while modified clicks keep link behavior', () => {
  assert.match(sidebar, /event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(sidebar, /event\.preventDefault\(\);\s*onOpenHome\(\);/);
});

test('homepage callback closes covering surfaces before navigating to explore', () => {
  const handler = app.match(/const handleOpenHome = \(\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(handler, /setIsUpgradeModalOpen\(false\)/);
  assert.match(handler, /setIsGenerateModalOpen\(false\)/);
  assert.match(handler, /handleNavigate\('explore'\)/);
  assert.match(app, /onOpenHome=\{handleOpenHome\}/);
});

test('sidebar profile hides email and shows localized membership crowns when active', () => {
  assert.doesNotMatch(sidebar, /user\.email/);
  assert.match(sidebar, /membershipTier\?: MembershipPlanId \| null/);
  assert.match(sidebar, /membershipTier === 'senior' \? 'upgrade\.planSenior' : 'upgrade\.planDeluxe'/);
  assert.match(sidebar, /collapsed && membershipTier/);
  assert.match(sidebar, /!collapsed && \([\s\S]*?membershipTier && \([\s\S]*?<Crown/);
});

test('app refreshes membership status and propagates payment account updates', () => {
  assert.match(app, /api\.payments\.account\(controller\.signal\)/);
  assert.match(app, /setMembershipTier\(account\.membership\?\.tier \?\? null\)/);
  assert.match(app, /membershipTier=\{membershipTier\}/);
  assert.equal(app.match(/onAccountChange=\{handlePaymentAccountChange\}/g)?.length, 2);
});
