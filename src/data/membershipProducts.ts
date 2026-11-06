export type MembershipPlanId = 'senior' | 'deluxe';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentProductType = 'membership' | 'recharge';
export type PaymentOrderStatus = 'created' | 'waiting' | 'success' | 'fail';

// Zeffra country codes documented for the credit-card collection flow.
export const ZEFFRA_COUNTRY_CODES = `AF CY BI CM CV CF TD KM CG CD DJ EG GE GQ ER ET GA GM GH GN GW CI KE HK LS LR LY MG MW ML MR MU MA MZ IN NA NE NG RW ST SN SC SL SO ZA ID SS SD SZ TZ TG TN UG ZM ZW AG IR BS BB BZ CA CR CU DM DO SV GD IQ GT HT HN JM MX NI PA KN LC VC IL TT US AR BO BR CL CO EC GY PY JP PE SR UY VE AU FJ KI MH FM NR JO NZ PW PG WS SB TO TV VU AM KZ KW KG LA LB MO MY MV MN MM AZ NP KP OM PK PS PH QA SA SG KR BH LK SY TW TJ TH TR TM AE UZ VN BD YE AL AD AT BY BE BA BG HR CZ BT DK EE FI FR DE GR HU IS IE IT BN LV LI LT LU MK MT MD MC ME NL KH NO PL PT RO RU SM RS SK SI ES CN SE CH UA GB VA DZ AO BJ BW BF`.split(' ');

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  description: string;
  monthlyPrice: string;
  monthlyListPrice: string;
  annualPrice: string;
  annualMonthlyPrice: string;
  annualListPrice: string;
  annualSavings: string;
  monthlyCredits: number;
  annualMonthlyCredits: number;
  imageCount: number;
  annualImageCount: number;
  videoCount: number;
  annualVideoCount: number;
  voiceMinutes: number;
  annualVoiceMinutes: number;
  featureKeys: string[];
}

export interface RechargePackage {
  id: string;
  name: string;
  description: string;
  baseCredits: number;
  bonusCredits: number;
  totalCredits: number;
  price: string;
  imageCount: number;
  videoCount: number;
}

export interface ConsumptionRule {
  id: 'aiReply' | 'characterPortrait' | 'characterPublish' | 'image' | 'video';
  cost: number;
  unitKey: string;
}

export interface RewardRule {
  id: 'dailyShare' | 'invite' | 'friendPurchase';
  amount: number;
  unitKey: string;
}

export interface PaymentCatalog {
  currency: 'USD';
  paymentProvider: 'zeffra' | 'paybao' | 'tpay';
  checkoutAvailable: boolean;
  maxTransactionAmount: string | null;
  memberships: MembershipPlan[];
  recharges: RechargePackage[];
  consumptionRules: ConsumptionRule[];
  rewardRules: RewardRule[];
}

export interface PaymentOrder {
  reference: string;
  productType: PaymentProductType;
  productId: string;
  billingCycle: BillingCycle | '';
  periodMonths: number;
  productName: string;
  productDescription: string;
  amount: string;
  currency: string;
  baseCredits: number;
  bonusCredits: number;
  credits: number;
  status: PaymentOrderStatus;
  payUrl: string;
  transactionId: string;
  realAmount: string | null;
  failReason: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAccount {
  membership: null | {
    tier: MembershipPlanId;
    startsAt: string;
    expiresAt: string;
    monthlyCredits: number;
    nextGrantAt: string | null;
    featureKeys: string[];
  };
  wallet: { balance: number };
  welcome: null | { chatFreeImagesRemaining: number };
}

export interface CheckoutSelection {
  productType: PaymentProductType;
  productId: string;
  billingCycle: BillingCycle | '';
  name: string;
  amount: string;
}

/** Resolve a previously selected item against the latest server catalog. */
export function resolveCheckoutSelection(selection: CheckoutSelection | null, catalog: PaymentCatalog | null) {
  if (!selection || !catalog) return null;
  if (selection.productType === 'membership') {
    const plan = catalog.memberships.find((item) => item.id === selection.productId);
    if (!plan || (selection.billingCycle !== 'monthly' && selection.billingCycle !== 'annual')) return null;
    return {
      ...selection,
      amount: selection.billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice,
    } satisfies CheckoutSelection;
  }
  const pack = catalog.recharges.find((item) => item.id === selection.productId);
  return pack ? { ...selection, billingCycle: '', amount: pack.price } satisfies CheckoutSelection : null;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid payment catalog');
  return value as Record<string, unknown>;
}

function string(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid payment catalog');
  return value;
}

function number(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid payment catalog');
  return value;
}

function array(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Invalid payment catalog');
  return value;
}

export function normalizePaymentCatalog(value: unknown): PaymentCatalog {
  const raw = object(value);
  if (raw.currency !== 'USD' || !['zeffra', 'paybao', 'tpay'].includes(String(raw.paymentProvider)) || typeof raw.checkoutAvailable !== 'boolean') {
    throw new Error('Invalid payment catalog');
  }
  const memberships = array(raw.memberships).map((entry) => {
    const item = object(entry);
    if (item.id !== 'senior' && item.id !== 'deluxe') throw new Error('Invalid payment catalog');
    return {
      id: item.id,
      name: string(item.name), description: string(item.description),
      monthlyPrice: string(item.monthlyPrice), monthlyListPrice: string(item.monthlyListPrice),
      annualPrice: string(item.annualPrice), annualMonthlyPrice: string(item.annualMonthlyPrice),
      annualListPrice: string(item.annualListPrice), annualSavings: string(item.annualSavings),
      monthlyCredits: number(item.monthlyCredits), annualMonthlyCredits: number(item.annualMonthlyCredits),
      imageCount: number(item.imageCount), annualImageCount: number(item.annualImageCount),
      videoCount: number(item.videoCount), annualVideoCount: number(item.annualVideoCount),
      voiceMinutes: number(item.voiceMinutes), annualVoiceMinutes: number(item.annualVoiceMinutes),
      featureKeys: array(item.featureKeys).map(string),
    } satisfies MembershipPlan;
  });
  const recharges = array(raw.recharges).map((entry) => {
    const item = object(entry);
    return {
      id: string(item.id), name: string(item.name), description: string(item.description),
      baseCredits: number(item.baseCredits), bonusCredits: number(item.bonusCredits),
      totalCredits: number(item.totalCredits), price: string(item.price),
      imageCount: number(item.imageCount), videoCount: number(item.videoCount),
    } satisfies RechargePackage;
  });
  const consumptionRules = array(raw.consumptionRules).map((entry) => {
    const item = object(entry);
    if (!['aiReply', 'characterPortrait', 'characterPublish', 'image', 'video'].includes(String(item.id))) throw new Error('Invalid payment catalog');
    return { id: item.id, cost: number(item.cost), unitKey: string(item.unitKey) } as ConsumptionRule;
  });
  const rewardRules = array(raw.rewardRules).map((entry) => {
    const item = object(entry);
    if (!['dailyShare', 'invite', 'friendPurchase'].includes(String(item.id))) throw new Error('Invalid payment catalog');
    return { id: item.id, amount: number(item.amount), unitKey: string(item.unitKey) } as RewardRule;
  });
  if (memberships.length !== 2 || recharges.length !== 3 || consumptionRules.length !== 5 || rewardRules.length !== 3) {
    throw new Error('Invalid payment catalog');
  }
  const maxTransactionAmount = raw.maxTransactionAmount == null ? null : string(raw.maxTransactionAmount);
  if (maxTransactionAmount !== null && (!Number.isFinite(Number(maxTransactionAmount)) || Number(maxTransactionAmount) <= 0)) {
    throw new Error('Invalid payment catalog');
  }
  return { currency: 'USD', paymentProvider: raw.paymentProvider as PaymentCatalog['paymentProvider'], checkoutAvailable: raw.checkoutAvailable, maxTransactionAmount, memberships, recharges, consumptionRules, rewardRules };
}

export function formatUsd(value: string | number, locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(value));
}

export function paymentReturnReference(search: string, storedReference = '') {
  const params = new URLSearchParams(search);
  if (!['zeffra', 'paybao', 'tpay'].includes(params.get('paymentReturn') || '')) return '';
  return params.get('reference') || params.get('paymentReference') || params.get('merchantReference') || storedReference;
}

export function clearPaymentReturnQuery(url: URL) {
  ['paymentReturn', 'reference', 'paymentReference', 'merchantReference', 'transactionId'].forEach((key) => url.searchParams.delete(key));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function validateCheckoutCustomer(customerName: string, customerPhone: string) {
  const name = customerName.trim().replace(/\s+/g, ' ');
  const phone = customerPhone.trim();
  if (name.length < 2) return { name, phone, error: 'name' as const };
  const validPhone = phone.length >= 6 && phone.length <= 32
    && /^\+?[0-9][0-9 ()-]{4,30}[0-9]$/.test(phone)
    && phone.replace(/\D/g, '').length >= 6;
  return { name, phone, error: validPhone ? null : 'phone' as const };
}
