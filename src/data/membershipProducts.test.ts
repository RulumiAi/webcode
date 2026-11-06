import assert from 'node:assert/strict';
import test from 'node:test';
import { clearPaymentReturnQuery, formatUsd, normalizePaymentCatalog, paymentReturnReference, resolveCheckoutSelection, validateCheckoutCustomer, ZEFFRA_COUNTRY_CODES } from './membershipProducts';

const catalog = {
  currency: 'USD', paymentProvider: 'zeffra', checkoutAvailable: true, maxTransactionAmount: '300',
  memberships: [
    { id: 'senior', name: 'Heart VIP', description: 'Heart', monthlyPrice: '19.99', monthlyListPrice: '24.99', annualPrice: '119.88', annualMonthlyPrice: '9.99', annualListPrice: '239.88', annualSavings: '120.00', monthlyCredits: 1000, annualMonthlyCredits: 1000, imageCount: 100, annualImageCount: 100, videoCount: 10, annualVideoCount: 10, voiceMinutes: 20, annualVoiceMinutes: 20, featureKeys: ['imageAllowance', 'videoAllowance', 'voiceAllowance', 'unlimitedMessages', 'unlimitedVoicePlayback', 'imageVideoGeneration', 'publishCharacters', 'chatVoiceStyles'] },
    { id: 'deluxe', name: 'Starlight VIP', description: 'Starlight', monthlyPrice: '59.99', monthlyListPrice: '69.99', annualPrice: '299.88', annualMonthlyPrice: '24.99', annualListPrice: '599.88', annualSavings: '420.00', monthlyCredits: 5000, annualMonthlyCredits: 4000, imageCount: 500, annualImageCount: 400, videoCount: 50, annualVideoCount: 40, voiceMinutes: 100, annualVoiceMinutes: 80, featureKeys: ['imageAllowance', 'videoAllowance', 'voiceAllowance', 'unlimitedMessages', 'unlimitedVoicePlayback', 'imageVideoGeneration', 'publishCharacters', 'chatVoiceStyles', 'advancedModels', 'longerMemory', 'priorityRendering'] },
  ],
  recharges: [
    { id: 'credits-1000', name: '1,000', description: '1000', baseCredits: 1000, bonusCredits: 0, totalCredits: 1000, price: '11.99', imageCount: 100, videoCount: 10 },
    { id: 'credits-5000', name: '5,500', description: '5500', baseCredits: 5000, bonusCredits: 500, totalCredits: 5500, price: '49.99', imageCount: 500, videoCount: 50 },
    { id: 'credits-20000', name: '23,000', description: '23000', baseCredits: 20000, bonusCredits: 3000, totalCredits: 23000, price: '159.99', imageCount: 2000, videoCount: 200 },
  ],
  consumptionRules: [
    { id: 'aiReply', cost: 1, unitKey: 'perMessage' }, { id: 'characterPortrait', cost: 10, unitKey: 'perUse' },
    { id: 'characterPublish', cost: 20, unitKey: 'perUse' },
    { id: 'image', cost: 10, unitKey: 'perImage' }, { id: 'video', cost: 100, unitKey: 'perVideo' },
  ],
  rewardRules: [
    { id: 'dailyShare', amount: 20, unitKey: 'onceDaily' }, { id: 'invite', amount: 100, unitKey: 'perPerson' },
    { id: 'friendPurchase', amount: 500, unitKey: 'perFriend' },
  ],
};

test('normalizes the complete server-owned catalog', () => {
  const result = normalizePaymentCatalog(catalog);
  assert.equal(result.memberships[0].monthlyPrice, '19.99');
  assert.equal(result.memberships[1].annualPrice, '299.88');
  assert.equal(result.memberships[0].featureKeys.length, 8);
  assert.equal(result.memberships[1].featureKeys.length, 11);
  assert.equal(result.maxTransactionAmount, '300');
  assert.deepEqual(result.recharges.map((item) => item.totalCredits), [1000, 5500, 23000]);
  assert.equal(result.consumptionRules.length, 5);
  assert.equal(result.rewardRules.length, 3);
  assert.equal(normalizePaymentCatalog({ ...catalog, paymentProvider: 'tpay' }).paymentProvider, 'tpay');
});

test('rejects incomplete or unknown-provider catalogs', () => {
  assert.throws(() => normalizePaymentCatalog({ ...catalog, paymentProvider: 'unknown' }));
  assert.throws(() => normalizePaymentCatalog({ ...catalog, recharges: catalog.recharges.slice(0, 2) }));
  assert.throws(() => normalizePaymentCatalog({ ...catalog, maxTransactionAmount: '0' }));
});

test('rejects stale membership catalogs without annual allowance fields', () => {
  const staleMemberships = catalog.memberships.map(({ annualMonthlyCredits: _credits, annualImageCount: _images, annualVideoCount: _videos, annualVoiceMinutes: _voice, ...plan }) => plan);
  assert.throws(() => normalizePaymentCatalog({ ...catalog, memberships: staleMemberships }));
});

test('accepts catalogs from older servers without a transaction limit field', () => {
  const { maxTransactionAmount: _ignored, ...legacy } = catalog;
  assert.equal(normalizePaymentCatalog(legacy).maxTransactionAmount, null);
});

test('restores and clears payment return state', () => {
  assert.equal(paymentReturnReference('?paymentReturn=paybao&reference=SM123', 'fallback'), 'SM123');
  assert.equal(paymentReturnReference('?paymentReturn=zeffra&reference=SM456', 'fallback'), 'SM456');
  assert.equal(paymentReturnReference('?paymentReturn=tpay&reference=SM789', 'fallback'), 'SM789');
  assert.equal(paymentReturnReference('?paymentReturn=paybao', 'SMLOCAL'), 'SMLOCAL');
  assert.equal(paymentReturnReference('?reference=SM123', 'SMLOCAL'), '');
  const url = new URL('https://example.com/?paymentReturn=paybao&reference=SM123&tab=home#top');
  assert.equal(clearPaymentReturnQuery(url), '/?tab=home#top');
});

test('formats USD using locale-aware currency output', () => {
  assert.match(formatUsd('19.99', 'en'), /19\.99/);
});

test('validates and normalizes checkout customer details', () => {
  assert.deepEqual(validateCheckoutCustomer('  Jane   Doe ', '+1 415 555 0100'), { name: 'Jane Doe', phone: '+1 415 555 0100', error: null });
  assert.equal(validateCheckoutCustomer('J', '+1 415 555 0100').error, 'name');
  assert.equal(validateCheckoutCustomer('Jane Doe', '123').error, 'phone');
  assert.equal(validateCheckoutCustomer('Jane Doe', '1234-abcd').error, 'phone');
});

test('uses documented country codes for checkout', () => {
  assert.ok(ZEFFRA_COUNTRY_CODES.includes('CN'));
  assert.ok(ZEFFRA_COUNTRY_CODES.includes('US'));
  assert.equal(ZEFFRA_COUNTRY_CODES.includes('ZH'), false);
});

test('resolves checkout amount from current server catalog', () => {
  const stale = { productType: 'membership' as const, productId: 'deluxe', billingCycle: 'monthly' as const, name: 'Starlight VIP', amount: '299.99' };
  assert.equal(resolveCheckoutSelection(stale, normalizePaymentCatalog(catalog))?.amount, '59.99');
  assert.equal(resolveCheckoutSelection({ ...stale, billingCycle: 'annual' }, normalizePaymentCatalog(catalog))?.amount, '299.88');
  assert.equal(resolveCheckoutSelection({ productType: 'recharge', productId: 'credits-5000', billingCycle: '', name: '5,500', amount: '0' }, normalizePaymentCatalog(catalog))?.amount, '49.99');
});
