import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = fs.readFileSync(path.join(import.meta.dirname, 'App.tsx'), 'utf8');
const appShellStart = app.indexOf('<div className="min-h-screen bg-[#09090d]');
const sidebarStart = app.indexOf('<Sidebar', appShellStart);
const routeBoundaryStart = app.indexOf('<Suspense fallback={<RouteLoadingFallback', sidebarStart);
const routeBoundaryEnd = app.indexOf('</Suspense>', routeBoundaryStart);
const mobileNavigationStart = app.indexOf('<MobileNavigation', routeBoundaryEnd);

test('application navigation stays outside the route loading boundary', () => {
  assert.ok(appShellStart >= 0);
  assert.ok(sidebarStart > appShellStart);
  assert.ok(routeBoundaryStart > sidebarStart);
  assert.ok(routeBoundaryEnd > routeBoundaryStart);
  assert.ok(mobileNavigationStart > routeBoundaryEnd);
  assert.doesNotMatch(app.slice(appShellStart, sidebarStart), /<Suspense/);
  assert.doesNotMatch(app, /fallback=\{<div className="min-h-screen" aria-busy="true" \/>\}/);
});

test('route fallback is visible, localized, stable, and motion-safe', () => {
  const fallback = app.slice(
    app.indexOf('function RouteLoadingFallback'),
    app.indexOf('function ModalLoadingFallback'),
  );

  assert.match(fallback, /min-h-\[calc\(100dvh-/);
  assert.match(fallback, /role="status"/);
  assert.match(fallback, /aria-busy="true"/);
  assert.match(fallback, /\{label\}/);
  assert.match(fallback, /animate-pulse motion-reduce:animate-none/);
  assert.match(fallback, /animate-spin[^"]*motion-reduce:animate-none/);
  assert.match(app, /<RouteLoadingFallback label=\{t\('common\.loading'\)\} \/>/);
});

test('all lazy page branches render inside the route boundary', () => {
  const routes = app.slice(routeBoundaryStart, routeBoundaryEnd);

  for (const component of [
    'UpgradeModal',
    'CreateCharacterSurface',
    'AIGeneratorModal',
    'MyCharactersView',
    'ReferralView',
    'SafetyCenterView',
    'HelpView',
    'CharacterFeedView',
    'CommunityPlazaView',
    'ChatPage',
  ]) {
    assert.match(routes, new RegExp(`<${component}\\b`), component);
  }
});

test('lazy modals use independent loading boundaries', () => {
  assert.equal(app.match(/<LazyModalBoundary\b/g)?.length, 7);
  assert.match(app, /<LazyModalBoundary active=\{isQuickUpgradeModalOpen\}[\s\S]*?<UpgradeModal/);
  assert.match(app, /<LazyModalBoundary active label=\{t\('common\.loading'\)\}>\s*<CharacterDetailModal/);
  assert.match(app, /<LazyModalBoundary active label=\{t\('common\.loading'\)\}>\s*<CreatorProfileModal/);
  assert.match(app, /<LazyModalBoundary active=\{isGenerateModalOpen\}[\s\S]*?<AIGeneratorModal/);
  assert.match(app, /<LazyModalBoundary active=\{isProfileModalOpen\}[\s\S]*?<UserProfileModal/);
  assert.match(app, /<LazyModalBoundary active=\{isAuthModalOpen\}[\s\S]*?<AuthModal/);
  assert.match(app, /<LazyModalBoundary active=\{isNotificationModalOpen\}[\s\S]*?<NotificationModal/);

  const modalBoundary = app.slice(
    app.indexOf('function LazyModalBoundary'),
    app.indexOf('function mapNotification'),
  );
  assert.match(modalBoundary, /fallback=\{active \? <ModalLoadingFallback label=\{label\} \/> : null\}/);
});
