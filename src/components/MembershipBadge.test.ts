import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { translate } from '../i18n';
import type { Locale } from '../types';

const componentsDir = import.meta.dirname;
const topHeader = fs.readFileSync(path.join(componentsDir, 'TopHeader.tsx'), 'utf8');
const generator = fs.readFileSync(path.join(componentsDir, 'AIGeneratorModal.tsx'), 'utf8');
const createCharacter = fs.readFileSync(path.join(componentsDir, 'CreateCharacterModal.tsx'), 'utf8');
const characterDetailPanel = fs.readFileSync(path.join(componentsDir, 'CharacterDetailPanel.tsx'), 'utf8');
const chatPage = fs.readFileSync(path.join(componentsDir, 'ChatPage.tsx'), 'utf8');
const upgradeModal = fs.readFileSync(path.join(componentsDir, 'UpgradeModal.tsx'), 'utf8');
const sidebar = fs.readFileSync(path.join(componentsDir, 'Sidebar.tsx'), 'utf8');
const mobileNavigation = fs.readFileSync(path.join(componentsDir, 'MobileNavigation.tsx'), 'utf8');
const help = fs.readFileSync(path.join(componentsDir, 'HelpView.tsx'), 'utf8');
const referral = fs.readFileSync(path.join(componentsDir, 'ReferralView.tsx'), 'utf8');
const app = fs.readFileSync(path.join(componentsDir, '..', 'App.tsx'), 'utf8');

test('homepage header keeps language controls but removes the upgrade entry', () => {
  assert.match(topHeader, /homepage-language-menu/);
  assert.match(topHeader, /className="absolute right-0 top-\[calc\(100%\+0\.75rem\)\]/);
  assert.doesNotMatch(topHeader, /onOpenUpgradeModal|t\('nav\.upgrade'\)/);
});

test('homepage language selector displays language text without flags', () => {
  assert.doesNotMatch(topHeader, /LOCALE_FLAGS|<img/);
  assert.match(topHeader, /LOCALE_LABELS\[locale\]/);
  assert.match(topHeader, /LOCALE_LABELS\[option\]/);
});

test('homepage header keeps language and notifications but removes top auth buttons', () => {
  assert.match(topHeader, /onClick=\{onOpenNotificationModal\}/);
  assert.doesNotMatch(topHeader, /onClick=\{onOpenLogin\}|onClick=\{onOpenRegister\}|t\('common\.signIn'\)|t\('common\.joinFree'\)/);
  assert.doesNotMatch(topHeader, /onOpenProfileModal|userInitial|user\.email|<Settings/);
});

test('sidebar keeps login behavior and uses Login for the expanded action', () => {
  assert.match(sidebar, /onClick=\{onOpenLogin\}/);
  assert.match(sidebar, /className="h-9 rounded-full border border-zinc-800[\s\S]*?Login/);
  assert.match(sidebar, /t\('common\.joinFree'\)/);
});

test('generator premium entries show membership crowns', () => {
  assert.equal(generator.match(/aria-label=\{t\('generator\.vipModeBadge'\)\}/g)?.length, 4);
  assert.match(generator, /setSubMode\('image-to-image'\)[\s\S]*?generator\.vipModeBadge/);
  assert.match(generator, /setSubMode\('image-to-video'\)[\s\S]*?generator\.vipModeBadge/);
  assert.match(generator, /setSubMode\('extend'\)[\s\S]*?generator\.vipModeBadge/);
});

test('generator premium entries use the quick membership checkout', () => {
  assert.match(generator, /onOpenQuickUpgradeModal\?: \(notice\?: string, featureLabel\?: string\) => void/);
  assert.match(generator, /if \(onOpenQuickUpgradeModal\) onOpenQuickUpgradeModal\(notice, t\(featureKey\)\)/);
  assert.equal(app.match(/onOpenQuickUpgradeModal=\{openQuickUpgradeModal\}/g)?.length, 4);
  assert.match(app, /variant="quick"/);
  assert.match(upgradeModal, /variant\?: 'full' \| 'quick'/);
  assert.match(upgradeModal, /!isQuick && currentUser/);
  assert.match(upgradeModal, /!isQuick && <section/);
});

test('both creation voice layouts use server membership metadata and block locked actions', () => {
  assert.equal(createCharacter.match(/createVoices\.map\(\(voice\) =>/g)?.length, 2);
  assert.equal(createCharacter.match(/const showMembershipBadge = voice\.isFree === false;/g)?.length, 2);
  assert.equal(createCharacter.match(/aria-label=\{t\('create\.vipExclusive'\)\}/g)?.length, 2);
  assert.match(createCharacter, /membershipFeatureKeys\.includes\(voice\.requiredMembershipFeature\)/);
  assert.match(createCharacter, /if \(!hasVoiceAccess\(voice\)\) \{\s*openVoiceMembership\(voice\);\s*return;/);
  assert.match(createCharacter, /onClick=\{\(\) => handleSelectVoice\(voice\)\}/);
  assert.match(createCharacter, /disabled=\{!voice\.previewUrl && !isVoiceLocked\}/);
});

test('chat voice styles keep the first option free and lock later options behind membership', () => {
  const lockedBranchStart = characterDetailPanel.indexOf('if (isLocked) {');
  const lockedBranchEnd = characterDetailPanel.indexOf('\n\n                  return (', lockedBranchStart);
  const lockedBranch = characterDetailPanel.slice(lockedBranchStart, lockedBranchEnd);

  assert.match(characterDetailPanel, /membershipTier\?: MembershipPlanId \| null/);
  assert.match(characterDetailPanel, /membershipTier = null/);
  assert.match(characterDetailPanel, /isFree: voice\.isFree \?\? index === 0/);
  assert.match(characterDetailPanel, /const isLocked = isApiChat && !voice\.isFree && !hasVoiceAccess\(voice\)/);
  assert.match(characterDetailPanel, /membershipTier[\s\S]*membershipFeatureKeys\.includes\(voice\.requiredMembershipFeature\)/);
  assert.match(characterDetailPanel, /if \(!hasVoiceAccess\(voice\)\) \{\s*openVoiceMembership\(voice\.name\);\s*return;/);
  assert.ok(lockedBranchStart >= 0 && lockedBranchEnd > lockedBranchStart);
  assert.match(lockedBranch, /<button[\s\S]*onClick=\{\(\) => openVoiceMembership\(voice\.name\)\}/);
  assert.match(lockedBranch, /t\('panel\.unlockVoiceShort'\)/);
  assert.doesNotMatch(lockedBranch, /onVoicePreview|handleSelectVoice/);
  assert.doesNotMatch(characterDetailPanel, /t\('panel\.vipVoice'\)/);
  assert.match(characterDetailPanel, /handleSelectVoice\(voice\)/);
  assert.match(chatPage, /api\.chat\.voices\(thread\.id\)/);
  assert.match(chatPage, /api\.chat\.threads\.setVoice\(thread\.id, defaultVoiceId\)/);
  assert.match(chatPage, /membershipTier\?: MembershipPlanId \| null/);
  assert.match(chatPage, /membershipTier=\{membershipTier\}/);
  assert.match(characterDetailPanel, /disabled=\{!threadId \|\| voiceSyncing/);
  assert.match(chatPage, /onOpenQuickUpgradeModal=\{onOpenQuickUpgradeModal\}/);
  assert.match(app, /membershipFeatureKeys=\{membershipFeatureKeys\}/);
  assert.match(app, /membershipTier=\{membershipTier\}/);
});

test('membership badge labels are localized in every supported locale', () => {
  const locales: Locale[] = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'];
  for (const locale of locales) {
    assert.notEqual(translate(locale, 'generator.vipModeBadge'), 'generator.vipModeBadge');
    assert.notEqual(translate(locale, 'generator.membershipRequired'), 'generator.membershipRequired');
    assert.notEqual(translate(locale, 'create.vipExclusive'), 'create.vipExclusive');
    assert.notEqual(translate(locale, 'panel.premiumVoice'), 'panel.premiumVoice');
    assert.notEqual(translate(locale, 'panel.vipVoice'), 'panel.vipVoice');
    assert.notEqual(translate(locale, 'panel.voiceMembershipRequired'), 'panel.voiceMembershipRequired');
    assert.notEqual(translate(locale, 'panel.unlockPremiumVoice'), 'panel.unlockPremiumVoice');
    assert.notEqual(translate(locale, 'panel.unlockVoiceShort'), 'panel.unlockVoiceShort');
    assert.notEqual(translate(locale, 'upgrade.feature.chatVoiceStyles'), 'upgrade.feature.chatVoiceStyles');
    assert.notEqual(translate(locale, 'upgrade.quickTitle'), 'upgrade.quickTitle');
    assert.notEqual(translate(locale, 'upgrade.quickDescription'), 'upgrade.quickDescription');
    assert.notEqual(translate(locale, 'nav.buyDiamonds'), 'nav.buyDiamonds');
  }
  assert.equal(translate('es', 'generator.vipModeBadge'), 'Función VIP');
  assert.equal(translate('pt', 'generator.vipModeBadge'), 'Recurso VIP');
});

test('quick upgrade modal uses compact copy for non-Chinese locales', () => {
  assert.match(upgradeModal, /const compact = locale !== 'zh-CN'/);
  assert.match(upgradeModal, /t\(copyKey\('vipRequiredDescription'\)\)/);
  assert.match(upgradeModal, /quick-upgrade-left/);
  assert.match(upgradeModal, /compact \? 'order-1 overflow-hidden'/);
  assert.match(upgradeModal, /compact=\{compact\}/);
  assert.match(upgradeModal, /catalog\.memberships\.map/);
  assert.match(upgradeModal, /t\(copyKey\('keepCreating'\)\)/);
  assert.match(upgradeModal, /t\(copyKey\('upgradeToUnlock'\)\)/);

  const compactKeys = [
    'upgrade.quickTitleCompact',
    'generator.vipRequiredTitleCompact',
    'generator.vipRequiredDescriptionCompact',
    'generator.vipPlansTitleCompact',
    'generator.vipIncludedTitleCompact',
    'generator.keepCreatingCompact',
    'generator.upgradeToUnlockCompact',
  ];
  for (const locale of ['en', 'ja', 'ko', 'es', 'pt'] as const) {
    for (const key of compactKeys) {
      const value = translate(locale, key);
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
  assert.notEqual(translate('zh-CN', 'generator.vipRequiredDescription'), 'generator.vipRequiredDescription');
});

test('common membership entries switch to diamond recharge for members', () => {
  assert.match(sidebar, /const upgradeLabel = membershipTier \? t\('nav\.buyDiamonds'\) : t\('nav\.upgrade'\)/);
  assert.match(sidebar, /const UpgradeIcon = membershipTier \? Gem : Heart/);
  assert.match(mobileNavigation, /const upgradeLabel = membershipTier \? t\('nav\.buyDiamonds'\) : t\('nav\.upgrade'\)/);
  assert.match(mobileNavigation, /const UpgradeIcon = membershipTier \? Gem : Crown/);
  assert.match(help, /membershipTier \? t\('nav\.buyDiamonds'\) : t\('help\.vipButton'\)/);
  assert.match(referral, /isMember \? t\('nav\.buyDiamonds'\) : t\('referral\.notAvailable'\)/);
  assert.match(upgradeModal, /initialSection\?: 'plans' \| 'recharge'/);
  assert.match(upgradeModal, /id="upgrade-recharge-section"/);
  assert.match(app, /setUpgradeInitialSection\(membershipTier \? 'recharge' : 'plans'\)/);
});

test('membership page keeps usage costs and removes configured rewards panel', () => {
  assert.match(upgradeModal, /id="upgrade-consumption-title"/);
  assert.match(upgradeModal, /catalog\.consumptionRules\.map/);
  assert.doesNotMatch(upgradeModal, /upgrade-rewards-title/);
  assert.doesNotMatch(upgradeModal, /catalog\.rewardRules\.map/);
  assert.doesNotMatch(upgradeModal, /upgrade\.rewardsUnavailable/);
});

test('diamond recharge cards align checkout buttons at the bottom', () => {
  assert.match(upgradeModal, /className="flex h-full min-w-0 flex-col rounded-xl/);
  assert.match(upgradeModal, /className="mt-auto pt-4"><button type="button"/);
  assert.match(upgradeModal, /pack\.bonusCredits > 0 &&/);
});
