import assert from 'node:assert/strict';
import test from 'node:test';
import { api, ApiError } from './api';

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

const checkoutDetails = {
  billingInfo: {
    firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1 415 555 0100',
    address1: '123 Main Street', city: 'New York', state: 'NY', postalCode: '10001', country: 'US',
  },
  deviceInfo: {
    language: 'en-US', os: 'Windows', browser: 'Chrome', timezone: 'America/New_York',
    screenResolution: '1920x1080', cardInputMethod: 'typed' as const, cookie: 'payment-device-123',
  },
};

test('payment API loads catalog and creates a server-priced order', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/payments/catalog/')) return new Response(JSON.stringify(catalog), { status: 200 });
    if (url.endsWith('/auth/csrf/')) return new Response(JSON.stringify({ csrfToken: 'csrf-test' }), { status: 200 });
    if (url.endsWith('/payments/orders/')) return new Response(JSON.stringify({
      reference: 'SM123', productType: 'membership', productId: 'senior', billingCycle: 'annual',
      periodMonths: 12, productName: 'Heart VIP', productDescription: 'Heart', amount: '119.88',
      currency: 'USD', baseCredits: 1000, bonusCredits: 0, credits: 1000, status: 'waiting',
      payUrl: 'https://pay.example.com/checkout', transactionId: '', realAmount: null, failReason: '',
      customerName: 'Jane Doe', customerEmail: 'jane@example.com', customerPhone: '+1 415 555 0100',
      createdAt: '2026-08-19T00:00:00Z', updatedAt: '2026-08-19T00:00:00Z',
    }), { status: 201 });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  try {
    const loaded = await api.payments.catalog();
    assert.equal(loaded.memberships[0].annualPrice, '119.88');
    const order = await api.payments.orders.create({
      productType: 'membership', productId: 'senior', billingCycle: 'annual',
      customerName: 'Jane Doe', customerPhone: '+1 415 555 0100',
      ...checkoutDetails,
    }, 'cf5536f6-778f-438d-96ac-50a81442414c');
    assert.equal(order.payUrl, 'https://pay.example.com/checkout');
    const createCall = calls.find((call) => call.url.endsWith('/payments/orders/'));
    assert.ok(createCall);
    const body = JSON.parse(String(createCall.init?.body));
    assert.deepEqual(body, {
      productType: 'membership', productId: 'senior', billingCycle: 'annual',
      customerName: 'Jane Doe', customerPhone: '+1 415 555 0100',
      ...checkoutDetails,
    });
    assert.equal(new Headers(createCall.init?.headers).get('Idempotency-Key'), 'cf5536f6-778f-438d-96ac-50a81442414c');
    assert.equal(new Headers(createCall.init?.headers).get('X-CSRFToken'), 'csrf-test');
    assert.equal('amount' in body, false);
    assert.equal('cardNumber' in body, false);
    assert.equal('cvv' in body, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('payment API preserves provider limit errors and fields', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('/payments/orders/')) return new Response(JSON.stringify({
      error: {
        code: 'PAYMENT_AMOUNT_LIMIT',
        message: "This product exceeds PAYBAO's current per-transaction limit of USD 300.00.",
        fields: { maxAmount: '300.00', amount: '299.88' },
        requestId: 'request-123',
      },
    }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    if (url.endsWith('/auth/csrf/')) return new Response(JSON.stringify({ csrfToken: 'csrf-test' }), { status: 200 });
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;
  try {
    await assert.rejects(
      api.payments.orders.create({
        productType: 'membership', productId: 'deluxe', billingCycle: 'annual',
        customerName: 'Jane Doe', customerPhone: '+1 415 555 0100',
        ...checkoutDetails,
      }, '3105bd74-106a-40b6-a6f0-e4d29172dbb8'),
      (error: unknown) => error instanceof ApiError
        && error.code === 'PAYMENT_AMOUNT_LIMIT'
        && error.fields.maxAmount === '300.00'
        && error.requestId === 'request-123',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
