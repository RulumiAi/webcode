import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = fs.readFileSync(path.join(import.meta.dirname, 'App.tsx'), 'utf8');

function functionBody(name: string) {
  return app.match(new RegExp(`const ${name} = \\(.*?\\) => \\{[\\s\\S]*?\\n  \\};`))?.[0] || '';
}

test('full upgrade entry captures one versioned return snapshot', () => {
  assert.match(app, /UPGRADE_RETURN_SNAPSHOT_KEY = 'soulmingle:upgrade-return:v1'/);
  const capture = functionBody('captureUpgradeReturnSnapshot');
  assert.match(capture, /upgradeReturnSnapshotRef\.current \|\| isUpgradeModalOpen \|\| isQuickUpgradeModalOpen/);
  assert.match(capture, /activeTab,/);
  assert.match(capture, /selectedCharacterId: selectedCharacter\?\.id \|\| null/);
  assert.match(capture, /selectedDetailCharacterId: selectedDetailCharacter\?\.id \|\| null/);
  assert.match(capture, /writeUpgradeReturnSnapshot\(snapshot\)/);
  assert.equal(app.match(/prepareUpgradePage\(\);/g)?.length, 3);
});

test('payment return reuses the stored pre-checkout page', () => {
  const paymentReturnEffect = app.match(/useEffect\(\(\) => \{\s*if \(!paymentReturnReference\)[\s\S]*?\}, \[paymentReturnReference\]\);/)?.[0] || '';
  assert.match(paymentReturnEffect, /upgradeReturnSnapshotRef\.current = readUpgradeReturnSnapshot\(\)/);
  assert.match(paymentReturnEffect, /setIsUpgradeModalOpen\(true\)/);
});

test('closing the full upgrade page restores navigation and covering surfaces', () => {
  const close = functionBody('closeUpgradePage');
  assert.match(close, /setActiveTab\(snapshot\.activeTab\)/);
  assert.match(close, /setCreateRouteVisited\(snapshot\.createRouteVisited\)/);
  assert.match(close, /setMobileGenerateVisited\(snapshot\.mobileGenerateVisited\)/);
  assert.match(close, /setIsGenerateModalOpen\(snapshot\.isGenerateModalOpen\)/);
  assert.match(close, /setIsProfileModalOpen\(snapshot\.isProfileModalOpen\)/);
  assert.match(close, /setIsNotificationModalOpen\(snapshot\.isNotificationModalOpen\)/);
  assert.match(close, /setIsMobileNavigationOpen\(snapshot\.isMobileNavigationOpen\)/);
  assert.match(close, /handleSelectCharacterToChatById\(snapshot\.selectedCharacterId\)/);
  assert.match(close, /handleOpenCharacterDetailById\(snapshot\.selectedDetailCharacterId\)/);
  assert.doesNotMatch(close, /handleOpenHome|setActiveTab\('explore'\)/);
  assert.match(app, /presentation="page"[\s\S]*?onClose=\{closeUpgradePage\}/);
});

test('quick upgrade close keeps the current page and clears its snapshot', () => {
  const close = functionBody('closeQuickUpgradeModal');
  assert.match(close, /setIsQuickUpgradeModalOpen\(false\)/);
  assert.match(close, /clearUpgradeReturnState\(\)/);
  assert.doesNotMatch(close, /setActiveTab|handleNavigate|handleOpenHome/);
  assert.match(app, /variant="quick"[\s\S]*?onClose=\{closeQuickUpgradeModal\}/);
});

test('sidebar navigation dismisses the full upgrade page before switching tabs', () => {
  const dismiss = functionBody('dismissUpgradeForNavigation');
  assert.match(dismiss, /if \(!isUpgradeModalOpen\) return/);
  assert.match(dismiss, /setIsUpgradeModalOpen\(false\)/);
  assert.match(dismiss, /setUpgradeNotice\(''\)/);
  assert.match(dismiss, /setUpgradeInitialSelection\(null\)/);
  assert.match(dismiss, /clearUpgradeReturnState\(\)/);

  const navigate = functionBody('handleNavigate');
  assert.match(navigate, /dismissUpgradeForNavigation\(\);/);
  assert.match(app, /onOpenCreateModal=\{\(\) => \{[\s\S]*?dismissUpgradeForNavigation\(\);[\s\S]*?openCreateSurface\(\);/);
  assert.match(app, /onOpenGenerateModal=\{\(\) => \{[\s\S]*?dismissUpgradeForNavigation\(\);[\s\S]*?openGenerateSurface\(\);/);
});
