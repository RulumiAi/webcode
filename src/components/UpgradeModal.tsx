import {CurrencyIcon as Coins} from './CurrencyIcon';
import { MembershipPricing } from './MembershipPricing';
import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronRight,  Copy, Crown, Heart, History, Image,
  Info, LoaderCircle, Mail, MessageCircle, Mic, Phone, RefreshCw, Share2, Sparkles,
  UserRound, Video, WalletCards, X, Zap,
} from 'lucide-react';
import { api, ApiError, type ApiUser } from '../api';
import { useLocale } from '../i18n';
import { userErrorMessage } from '../utils/userError';
import {
  formatUsd,
  normalizePaymentCatalog,
  ZEFFRA_COUNTRY_CODES,
  validateCheckoutCustomer,
  type BillingCycle,
  type CheckoutSelection,
  type MembershipPlan,
  type PaymentAccount,
  type PaymentCatalog,
  type PaymentOrder,
  resolveCheckoutSelection,
} from '../data/membershipProducts';

const PAYMENT_REFERENCE_KEY = 'soulmingle:payment-reference';
const PAYMENT_PRESENTATION_KEY = 'soulmingle:payment-presentation';
const PAYMENT_CATALOG_CACHE_KEY = 'soulmingle:payment-catalog:v3';

type BillingInfoInput = {
  firstName: string; lastName: string; address1: string; address2: string;
  city: string; state: string; postalCode: string; country: string;
};
type CheckoutFieldErrors = Record<string, string>;

function paymentDeviceInfo() {
  const cookieName = 'soulmingle_payment_device';
  const existing = document.cookie.split('; ').find((item) => item.startsWith(`${cookieName}=`))?.split('=')[1];
  const deviceId = existing || crypto.randomUUID();
  if (!existing) document.cookie = `${cookieName}=${deviceId}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  return {
    language: navigator.language || 'en-US', os: navigator.platform || 'unknown', browser: navigator.userAgent.slice(0, 255),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', screenResolution: `${window.screen.width}x${window.screen.height}`,
    cardInputMethod: 'typed' as const, cookie: deviceId,
  };
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  presentation?: 'modal' | 'page';
  initialSection?: 'plans' | 'recharge';
  variant?: 'full' | 'quick';
  currentUser: ApiUser | null;
  onRequireAuth: () => void;
  returnReference?: string;
  onReturnHandled?: () => void;
  notice?: string;
  featureLabel?: string;
  onOpenFullUpgrade?: (selection: { planId: MembershipPlan['id']; billingCycle: BillingCycle }, notice?: string) => void;
  initialPlan?: MembershipPlan['id'];
  initialBillingCycle?: BillingCycle;
  onAccountChange?: (account: PaymentAccount) => void;
}

const planNameKeys = { senior: 'upgrade.planSenior', deluxe: 'upgrade.planDeluxe' } as const;
const featureIcons = {
  imageAllowance: Image,
  videoAllowance: Video,
  voiceAllowance: Mic,
  unlimitedMessages: MessageCircle,
  unlimitedVoicePlayback: Mic,
  imageVideoGeneration: Sparkles,
  publishCharacters: Share2,
  advancedModels: Zap,
  longerMemory: MessageCircle,
  priorityRendering: Crown,
} as const;
const ruleLabelKeys = {
  aiReply: 'upgrade.ruleAiReply', characterPortrait: 'upgrade.rulePortrait', characterPublish: 'upgrade.rulePublish',
  image: 'upgrade.ruleImage', video: 'upgrade.ruleVideo',
} as const;
function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function countryLabel(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function checkoutErrorsFromApi(fields: Record<string, unknown>, safeMessage: string) {
  const result: CheckoutFieldErrors = {};
  const billing = fields.billing_info && typeof fields.billing_info === 'object'
    ? fields.billing_info as Record<string, unknown>
    : fields.billingInfo && typeof fields.billingInfo === 'object'
      ? fields.billingInfo as Record<string, unknown>
      : fields;
  const map: Record<string, string> = {
    customer_name: 'customerName', customerName: 'customerName', customer_phone: 'phone', customerPhone: 'phone',
    first_name: 'firstName', last_name: 'lastName', address1: 'address1', address2: 'address2',
    city: 'city', state: 'state', postal_code: 'postalCode', country: 'country', phone: 'phone', email: 'email',
  };
  Object.entries(billing).forEach(([key, value]) => {
    const target = map[key] || key;
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string' && message.trim()) result[target] = safeMessage;
  });
  return result;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function planPrice(plan: MembershipPlan, billingCycle: BillingCycle) {
  return billingCycle === 'monthly'
    ? { current: plan.monthlyPrice, original: plan.monthlyListPrice, total: null, totalOriginal: null }
    : { current: plan.annualMonthlyPrice, original: null, total: plan.annualPrice, totalOriginal: plan.annualListPrice };
}

function exceedsCheckoutLimit(amount: string, maxTransactionAmount: string | null) {
  if (!maxTransactionAmount) return false;
  const value = Number(amount);
  const limit = Number(maxTransactionAmount);
  return Number.isFinite(value) && Number.isFinite(limit) && value > limit;
}

function isAmountLimitError(value: string) {
  const message = value.toLowerCase();
  return message.includes('880022') || message.includes('payin_channel_quota') || message.includes('max amount per transaction');
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Coins; label: string; value: string; tone: 'pink' | 'blue' | 'violet' | 'amber' }) {
  const toneClass = {
    pink: 'bg-pink-400/[0.08] text-pink-200', blue: 'bg-sky-400/[0.08] text-sky-200',
    violet: 'bg-violet-400/[0.08] text-violet-200', amber: 'bg-amber-300/[0.08] text-amber-200',
  }[tone];
  return (
    <div className={`min-w-0 rounded-xl p-2.5 ${toneClass}`}>
      <div className="flex min-w-0 items-center gap-1.5"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate text-[11px] opacity-90">{label}</span></div>
      <p className="mt-1 break-words text-sm font-black tabular-nums">{value}</p>
    </div>
  );
}

function PlanCard({ plan, billingCycle, selected, available, authenticated, onSelect, onCheckout, t, locale, maxTransactionAmount }: {
  key?: React.Key;
  plan: MembershipPlan; billingCycle: BillingCycle; selected: boolean; available: boolean; authenticated: boolean;
  onSelect: () => void; onCheckout: () => void; t: (key: string, params?: Record<string, string | number>) => string; locale: string;
  maxTransactionAmount: string | null;
}) {
  const isDeluxe = plan.id === 'deluxe';
  const Icon = isDeluxe ? Crown : Heart;
  const annual = billingCycle === 'annual';
  const monthlyEquivalent = annual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const billedAmount = annual ? plan.annualPrice : plan.monthlyPrice;
  const listAmount = annual ? (Number(plan.annualListPrice) / 12).toFixed(2) : plan.monthlyListPrice;
  const credits = annual ? plan.annualMonthlyCredits : plan.monthlyCredits;
  const imageCount = annual ? plan.annualImageCount : plan.imageCount;
  const videoCount = annual ? plan.annualVideoCount : plan.videoCount;
  const voiceMinutes = annual ? plan.annualVoiceMinutes : plan.voiceMinutes;
  const exceedsLimit = exceedsCheckoutLimit(billedAmount, maxTransactionAmount);
  const title = t(planNameKeys[plan.id]);
  const allowanceCounts: Record<string, number> = {
    imageAllowance: imageCount,
    videoAllowance: videoCount,
    voiceAllowance: voiceMinutes,
  };
  return (
    <article
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onSelect();
      }}
      className={`relative flex min-w-0 cursor-pointer flex-col justify-between rounded-3xl border-2 bg-[#161624] p-5 shadow-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161624] sm:p-6 ${selected ? (isDeluxe ? 'border-amber-500 ring-1 ring-amber-500 shadow-amber-500/20' : 'border-pink-500 ring-1 ring-pink-500 shadow-pink-500/20') : 'border-zinc-800 hover:border-zinc-700'}`}
    >
      {isDeluxe && <span className="absolute -top-3 right-5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-[10px] font-black text-black shadow-lg">{t('upgrade.bestValue')}</span>}
      <div className="min-w-0 text-left">
        <div className="flex items-center justify-between gap-3">
          <span className={`flex min-w-0 items-center gap-1.5 text-sm font-black ${isDeluxe ? 'text-amber-400' : 'text-pink-400'}`}><Icon className="h-4 w-4" />{title}</span>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDeluxe ? 'border-amber-500/30 bg-amber-500/20 text-amber-300' : 'border-pink-500/30 bg-pink-500/20 text-pink-300'}`}>{t(isDeluxe ? 'upgrade.planBadgeDeluxe' : 'upgrade.planBadgeSenior')}</span>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-zinc-400">{t(isDeluxe ? 'upgrade.planTaglineDeluxe' : 'upgrade.planTaglineSenior')}</p>
        <div className="mt-4 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-zinc-400 line-through">{formatUsd(listAmount, locale)}</span>
            <span className="text-3xl font-black tabular-nums text-white">{formatUsd(monthlyEquivalent, locale)}</span>
            <span className="text-xs text-zinc-400">{t('upgrade.perMonth')}</span>
          </div>
          <p className="text-[10px] text-zinc-400">{annual ? `${formatUsd(billedAmount, locale)} ${t('upgrade.perYear')}` : t('upgrade.monthlyBilling')}</p>
          {annual && <p className="text-[10px] font-bold text-emerald-300">{t('upgrade.saveAmount', { amount: formatUsd(plan.annualSavings, locale) })}</p>}
        </div>
      </div>
      <div className={`mt-5 flex items-center gap-2.5 rounded-2xl border p-3 ${isDeluxe ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-yellow-950/40 to-purple-950/40' : 'border-pink-500/40 bg-gradient-to-r from-pink-950/60 to-purple-950/40'}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDeluxe ? 'bg-amber-500 text-black' : 'bg-pink-500 text-white'}`}><Coins className="h-4 w-4" /></span>
        <div className="min-w-0"><p className={`text-xs font-black ${isDeluxe ? 'text-amber-300' : 'text-pink-300'}`}>{t('upgrade.includedDiamonds', { amount: formatCount(credits, locale) })}</p><p className="text-[10px] text-zinc-400">{formatCount(imageCount, locale)} {t('upgrade.imagesPerMonth')} · {formatCount(videoCount, locale)} {t('upgrade.videosPerMonth')} · {formatCount(voiceMinutes, locale)} {t('upgrade.minutes')}</p></div>
      </div>
      <ul className="mt-4 space-y-2 text-[11px] leading-5 text-zinc-300"><li className="border-b border-zinc-800 pb-2 font-extrabold text-white">{t('upgrade.includedDiamonds', { amount: formatCount(credits, locale) })}</li>{plan.featureKeys.map((key) => { const FeatureIcon = featureIcons[key as keyof typeof featureIcons] ?? Check; const count = allowanceCounts[key]; return <li key={key} className="flex items-start gap-2"><FeatureIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isDeluxe ? 'text-amber-400' : 'text-pink-400'}`} /><span>{t(`upgrade.feature.${key}`, count === undefined ? undefined : { count: formatCount(count, locale) })}</span></li>; })}</ul>
      {exceedsLimit && <p className="mt-4 text-xs leading-5 text-amber-100">{t('upgrade.amountLimitHint', { amount: formatUsd(maxTransactionAmount || 0, locale) })}</p>}
      <button type="button" onClick={(event) => { event.stopPropagation(); onCheckout(); }} disabled={!available || exceedsLimit} className={`mt-5 min-h-12 w-full cursor-pointer rounded-2xl px-4 text-xs font-black transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-500 ${isDeluxe ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black shadow-lg shadow-amber-500/25' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'}`}>{!available ? t('upgrade.checkoutUnavailable') : exceedsLimit ? t('upgrade.amountLimit', { amount: formatUsd(maxTransactionAmount || 0, locale) }) : authenticated ? t('upgrade.continueToCheckout') : t('upgrade.signInToCheckout')}</button>
    </article>
  );
}
function StatusBadge({ status, t }: { status: PaymentOrder['status']; t: (key: string) => string }) {
  const classes = status === 'success' ? 'bg-emerald-400/10 text-emerald-200' : status === 'fail' ? 'bg-red-400/10 text-red-200' : 'bg-amber-300/10 text-amber-100';
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${classes}`}>{t(`upgrade.orderStatus.${status}`)}</span>;
}

function QuickPlanCard({ plan, billingCycle, selected, onSelect, t, locale, compact }: {
  key?: React.Key;
  plan: MembershipPlan;
  billingCycle: BillingCycle;
  selected: boolean;
  onSelect: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  compact: boolean;
}) {
  const deluxe = plan.id === 'deluxe';
  const annual = billingCycle === 'annual';
  const price = annual ? plan.annualMonthlyPrice : plan.monthlyPrice;
  const credits = annual ? plan.annualMonthlyCredits : plan.monthlyCredits;
  const imageCount = annual ? plan.annualImageCount : plan.imageCount;
  const videoCount = annual ? plan.annualVideoCount : plan.videoCount;
  const voiceMinutes = annual ? plan.annualVoiceMinutes : plan.voiceMinutes;
  const Icon = deluxe ? Crown : Heart;
  const tone = deluxe ? 'amber' : 'pink';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative min-w-0 rounded-2xl border ${compact ? 'p-2.5' : 'p-3'} text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11121a] ${selected
        ? deluxe ? 'border-amber-400 bg-amber-400/[0.09]' : 'border-pink-400 bg-pink-400/[0.09]'
        : 'border-white/[0.1] bg-white/[0.025] hover:border-white/[0.2]'}`}
    >
      {deluxe && <span className="absolute -top-2 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-[#211500]">{t('upgrade.bestValue')}</span>}
      <span className={`flex items-center gap-1.5 text-xs font-black ${tone === 'amber' ? 'text-amber-300' : 'text-pink-300'}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />{t(planNameKeys[plan.id])}
      </span>
      <span className={`${compact ? 'mt-1.5 text-xl' : 'mt-2 text-2xl'} block font-black tabular-nums text-white`}>{formatUsd(price, locale)}<span className="ml-1 text-[10px] font-bold text-zinc-400">{t('upgrade.perMonth')}</span></span>
      <span className={`mt-1 block text-[10px] font-black ${tone === 'amber' ? 'text-amber-300' : 'text-pink-300'}`}>{t('upgrade.includedDiamonds', { amount: formatCount(credits, locale) })}</span>
      <span className={`${compact ? 'mt-0.5 leading-3.5' : 'mt-1 leading-4'} block text-[10px] text-zinc-400`}>{formatCount(imageCount, locale)} {t('upgrade.imagesPerMonth')} · {formatCount(videoCount, locale)} {t('upgrade.videosPerMonth')} · {formatCount(voiceMinutes, locale)} {t('upgrade.minutes')}</span>
      <span className={`absolute bottom-3 right-3 flex h-4 w-4 items-center justify-center rounded-full border ${selected ? tone === 'amber' ? 'border-amber-300 bg-amber-400 text-black' : 'border-pink-300 bg-pink-500 text-white' : 'border-zinc-600 text-transparent'}`}><Check className="h-2.5 w-2.5" /></span>
    </button>
  );
}

function QuickUpgradePanel({
  catalog, catalogLoading, catalogError, catalogFresh, billingCycle, selectedPlan, featureLabel, notice,
  mobile, onBillingCycleChange, onSelectPlan, onContinue, onUpgrade, t, locale,
}: {
  catalog: PaymentCatalog | null;
  catalogLoading: boolean;
  catalogError: string;
  catalogFresh: boolean;
  billingCycle: BillingCycle;
  selectedPlan: MembershipPlan['id'];
  featureLabel?: string;
  notice?: string;
  mobile: boolean;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onSelectPlan: (plan: MembershipPlan['id']) => void;
  onContinue: () => void;
  onUpgrade: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}) {
  const selected = catalog?.memberships.find((plan) => plan.id === selectedPlan);
  const annual = billingCycle === 'annual';
  const selectedCredits = selected ? annual ? selected.annualMonthlyCredits : selected.monthlyCredits : 0;
  const selectedImages = selected ? annual ? selected.annualImageCount : selected.imageCount : 0;
  const selectedVideos = selected ? annual ? selected.annualVideoCount : selected.videoCount : 0;
  const selectedVoice = selected ? annual ? selected.annualVoiceMinutes : selected.voiceMinutes : 0;
  const selectedExtra = selected?.featureKeys.find((key) => ['advancedModels', 'priorityRendering', 'imageVideoGeneration', 'unlimitedMessages'].includes(key));
  const compact = locale !== 'zh-CN';
  const copyKey = (name: string) => compact ? `generator.${name}Compact` : `generator.${name}`;
  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center text-zinc-100 ${mobile ? 'bg-[#0b0b12]' : 'bg-black/75 p-5 backdrop-blur-md'}`} role="dialog" aria-modal="true" aria-labelledby="quick-upgrade-title">
      <section className={`relative w-full bg-[#17151f] text-zinc-100 ${mobile ? 'flex h-[100dvh] flex-col overflow-y-auto' : 'grid h-[576px] max-h-[calc(100dvh-2.5rem)] max-w-[896px] grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[28px] border border-amber-300/25 shadow-[0_28px_90px_rgba(0,0,0,0.65)]'}`}>
        <button type="button" onClick={onContinue} aria-label={t('common.close')} title={t('common.close')} className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.2] bg-black/45 text-zinc-200 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className={`quick-upgrade-left flex min-h-0 min-w-0 flex-col ${compact ? 'gap-0 p-4 sm:p-5' : 'p-5 sm:p-7'} custom-scrollbar ${mobile ? 'order-2 overflow-y-auto' : compact ? 'order-1 overflow-hidden' : 'order-1 overflow-y-auto'}`}>
          <div className="flex items-start gap-3">
            <span className={`relative flex shrink-0 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/10 text-amber-200 shadow-[0_10px_28px_-14px_rgba(251,191,36,0.9)] ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}><span className="absolute inset-1 rounded-xl border border-amber-200/15" aria-hidden="true" /><Crown className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} relative`} aria-hidden="true" /></span>
            <div className="min-w-0 pt-0.5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/85">{t('generator.vipModeBadge')}</p><h2 id="quick-upgrade-title" className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} mt-1 font-black leading-tight text-white`}>{t(copyKey('vipRequiredTitle'))}</h2><p className="mt-1 text-xs font-bold text-pink-200/90">{featureLabel || t(compact ? 'upgrade.quickTitleCompact' : 'upgrade.quickTitle')}</p></div>
          </div>
          <p className={`${compact ? 'mt-2 text-xs leading-5' : 'mt-4 text-sm leading-6'} text-zinc-300`}>{t(copyKey('vipRequiredDescription'))}</p>
          {notice && <p className="mt-1 text-[11px] leading-4 text-amber-100/80">{notice}</p>}
          {catalogError && <div role="alert" className="mt-2 rounded-xl border border-red-300/20 bg-red-400/[0.08] px-3 py-2 text-xs text-red-100">{catalogError}</div>}
          <div className={`${compact ? 'mt-3' : 'mt-5'} flex items-center justify-between gap-3`}><p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">{t(copyKey('vipPlansTitle'))}</p><div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5" role="group" aria-label={t('generator.vipBillingCycle')}>{(['monthly', 'annual'] as const).map((cycle) => <button key={cycle} type="button" onClick={() => onBillingCycleChange(cycle)} aria-pressed={billingCycle === cycle} className={`rounded-md px-2.5 py-1.5 text-[10px] font-black ${billingCycle === cycle ? 'bg-pink-500 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>{t(`upgrade.${cycle}`)}{cycle === 'annual' && <span className="ml-1 text-[9px]">{t('upgrade.save50')}</span>}</button>)}</div></div>
          {catalogLoading && !catalog && <div className="mt-2 grid grid-cols-2 gap-2"><div className="h-36 animate-pulse rounded-2xl bg-white/[0.05]" /><div className="h-36 animate-pulse rounded-2xl bg-white/[0.05]" /></div>}
          {catalog && <div role="radiogroup" aria-label={t(copyKey('vipPlansTitle'))} className={`${compact ? 'mt-2 gap-2' : 'mt-3 gap-2.5'} grid ${mobile ? '' : 'grid-cols-2'}`}>{catalog.memberships.map((plan) => <QuickPlanCard key={plan.id} plan={plan} billingCycle={billingCycle} selected={selectedPlan === plan.id} onSelect={() => onSelectPlan(plan.id)} t={t} locale={locale} compact={compact} />)}</div>}
          <div className={`${compact ? 'mt-2 px-3 py-2' : 'mt-4 px-3.5 py-3'} rounded-2xl border border-pink-300/15 bg-pink-400/[0.045]`}><p className={`${compact ? 'mb-1' : 'mb-2'} text-[11px] font-black uppercase tracking-[0.14em] text-pink-200/85`}>{t(copyKey('vipIncludedTitle'))}</p>{selected ? <div className={`${compact ? 'gap-x-2 gap-y-1' : 'gap-x-3 gap-y-2'} grid grid-cols-2 text-[10px] font-bold text-zinc-200`}><span className="flex items-start gap-1.5"><Coins className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />{t('upgrade.includedDiamonds', { amount: formatCount(selectedCredits, locale) })}</span><span className="flex items-start gap-1.5"><Image className="mt-0.5 h-3 w-3 shrink-0 text-pink-300" aria-hidden="true" />{t('upgrade.feature.imageAllowance', { count: formatCount(selectedImages, locale) })}</span><span className="flex items-start gap-1.5"><Video className="mt-0.5 h-3 w-3 shrink-0 text-cyan-300" aria-hidden="true" />{t('upgrade.feature.videoAllowance', { count: formatCount(selectedVideos, locale) })}</span><span className="flex items-start gap-1.5"><Mic className="mt-0.5 h-3 w-3 shrink-0 text-violet-300" aria-hidden="true" />{t('upgrade.feature.voiceAllowance', { count: formatCount(selectedVoice, locale) })}</span>{selectedExtra && <span className="col-span-2 flex items-start gap-1.5"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-pink-300" aria-hidden="true" />{t(`upgrade.feature.${selectedExtra}`)}</span>}</div> : <p className="text-xs text-zinc-400">{t('upgrade.loadingCatalog')}</p>}</div>
          <div className={`${compact ? 'pt-3' : 'pt-5'} mt-auto flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end`}><button type="button" onClick={onContinue} className="min-h-11 rounded-xl border border-zinc-700/90 bg-zinc-800/80 px-4 text-xs font-black text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">{t(copyKey('keepCreating'))}</button><button type="button" onClick={onUpgrade} disabled={!catalog || !catalogFresh} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-600 px-5 text-xs font-black text-white shadow-[0_12px_26px_-12px_rgba(236,72,153,0.9)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"><Crown className="h-4 w-4" aria-hidden="true" />{t(copyKey('upgradeToUnlock'))}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button></div>
        </div>
        <div className={`relative min-h-[210px] overflow-hidden bg-[#0d0d13] ${mobile ? 'order-1 shrink-0 border-b border-white/[0.08]' : 'order-2 min-h-0 border-l border-white/[0.08]'}`}><img src="/assets/lurova-entry-poster-v1.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" decoding="async" aria-hidden="true" /><div className={`absolute inset-0 ${mobile ? 'bg-gradient-to-t from-[#17151f] via-[#17151f]/10 to-transparent' : 'bg-gradient-to-l from-transparent via-[#17151f]/10 to-[#17151f]'}`} aria-hidden="true" /><div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/[0.14] bg-[#0b0b11]/60 px-3 py-2.5 backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/85">Lurova Studio</p><p className="mt-0.5 text-xs font-bold text-white">{t('generator.vipRequiredTitle')}</p></div></div>
      </section>
    </div>
  );
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen, onClose, isMobile = false, presentation = 'modal', variant = 'full', currentUser, onRequireAuth, returnReference = '', onReturnHandled, notice = '', featureLabel, onOpenFullUpgrade, initialPlan, initialBillingCycle, onAccountChange,
  initialSection = 'plans',
}) => {
  const { t, locale } = useLocale();
  const [catalog, setCatalog] = useState<PaymentCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogFresh, setCatalogFresh] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState<'senior' | 'deluxe'>(variant === 'quick' ? 'deluxe' : 'senior');
  const [checkout, setCheckout] = useState<CheckoutSelection | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [billingInfo, setBillingInfo] = useState<BillingInfoInput>({
    firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: 'US',
  });
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState<CheckoutFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'checking' | 'waiting' | 'success' | 'fail' | 'delayed'>('idle');
  const [activeReference, setActiveReference] = useState('');
  const [copied, setCopied] = useState('');
  const idempotencyKey = useRef('');
  const checkoutFormId = `upgrade-checkout-form-${variant}`;

  const readCachedCatalog = () => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PAYMENT_CATALOG_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { catalog?: unknown };
      return normalizePaymentCatalog(parsed.catalog);
    } catch {
      localStorage.removeItem(PAYMENT_CATALOG_CACHE_KEY);
      return null;
    }
  };

  const cacheCatalog = (nextCatalog: PaymentCatalog) => {
    try {
      localStorage.setItem(PAYMENT_CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), catalog: nextCatalog }));
    } catch {
      // Storage may be unavailable in private browsing; the network result remains authoritative.
    }
  };

  const reloadCatalog = () => {
    const controller = new AbortController();
    const cachedCatalog = readCachedCatalog();
    if (cachedCatalog) setCatalog(cachedCatalog);
    setCatalogFresh(false);
    setCatalogLoading(true);
    setCatalogError('');
    const load = async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const nextCatalog = await api.payments.catalog(controller.signal);
          if (controller.signal.aborted) return;
          setCatalog(nextCatalog);
          setCatalogFresh(true);
          cacheCatalog(nextCatalog);
          return;
        } catch (error) {
          lastError = error;
          if (controller.signal.aborted) return;
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * 2 ** attempt));
        }
      }
      if (!controller.signal.aborted) setCatalogError(userErrorMessage(lastError, t, 'upgrade.catalogError'));
    };
    void load().finally(() => {
      if (!controller.signal.aborted) setCatalogLoading(false);
    });
    return controller;
  };

  const reloadAccount = () => {
    if (!currentUser) return;
    setAccountLoading(true);
    setAccountError('');
    void Promise.all([api.payments.account(), api.payments.orders.list()])
      .then(([nextAccount, result]) => {
        setAccount(nextAccount);
        setOrders(result.items);
        onAccountChange?.(nextAccount);
      })
      .catch(() => setAccountError(t('upgrade.accountError')))
      .finally(() => setAccountLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const controller = reloadCatalog();
    return () => controller.abort();
  }, [isOpen, locale]);

  useEffect(() => {
    if (!isOpen || initialSection !== 'recharge' || variant === 'quick') return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById('upgrade-recharge-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, initialSection, variant, catalogFresh]);

  useEffect(() => {
    if (!isOpen || !currentUser || variant === 'quick') {
      setAccount(null);
      setOrders([]);
      return;
    }
    if (!billingInfo.firstName && !billingInfo.lastName) {
      const [firstName = '', ...lastName] = currentUser.displayName.trim().split(/\s+/);
      setBillingInfo((current) => ({ ...current, firstName, lastName: lastName.join(' ') }));
    }
    setCustomerName((current) => current || currentUser.displayName.trim());
    reloadAccount();
  }, [isOpen, currentUser?.id, variant]);

  useEffect(() => {
    if (!isOpen || !currentUser || !returnReference || variant === 'quick') return undefined;
    let active = true;
    let timer = 0;
    let attempts = 0;
    setActiveReference(returnReference);
    setPaymentState('checking');
    const check = async () => {
      try {
        const order = attempts === 0
          ? await api.payments.orders.query(returnReference)
          : await api.payments.orders.get(returnReference);
        if (!active) return;
        setOrders((items) => [order, ...items.filter((item) => item.reference !== order.reference)]);
        if (order.status === 'success' || order.status === 'fail') {
          setPaymentState(order.status);
          localStorage.removeItem(PAYMENT_REFERENCE_KEY);
          localStorage.removeItem('soulmingle:paybao-reference');
          localStorage.removeItem(PAYMENT_PRESENTATION_KEY);
          localStorage.removeItem('soulmingle:paybao-presentation');
          reloadAccount();
          onReturnHandled?.();
          return;
        }
        attempts += 1;
        if (attempts >= 20) {
          setPaymentState('delayed');
          return;
        }
        setPaymentState('waiting');
        timer = window.setTimeout(check, 3000);
      } catch (error) {
        if (!active) return;
        attempts += 1;
        if (error instanceof ApiError && error.status === 404) {
          setPaymentState('fail');
          onReturnHandled?.();
          return;
        }
        if (attempts >= 20) setPaymentState('delayed');
        else timer = window.setTimeout(check, 3000);
      }
    };
    void check();
    return () => { active = false; window.clearTimeout(timer); };
  }, [isOpen, currentUser?.id, returnReference, variant]);

  useEffect(() => {
    if (!isOpen || !returnReference || currentUser) return undefined;
    const timer = window.setTimeout(onRequireAuth, 1200);
    return () => window.clearTimeout(timer);
  }, [isOpen, returnReference, currentUser?.id, onRequireAuth]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialPlan) setSelectedPlan(initialPlan);
    if (initialBillingCycle) setBillingCycle(initialBillingCycle);
  }, [isOpen, initialPlan, initialBillingCycle]);

  const isPage = presentation === 'page';
  const isQuick = variant === 'quick';
  const useMobileLayout = typeof window === 'undefined'
    ? isMobile
    : window.matchMedia('(max-width: 767px)').matches;
  const checkoutAvailable = catalogFresh && Boolean(catalog?.checkoutAvailable);
  const isTpay = catalog?.paymentProvider === 'tpay';
  const resolvedCheckout = resolveCheckoutSelection(checkout, catalog);
  const checkoutExceedsLimit = Boolean(resolvedCheckout && exceedsCheckoutLimit(resolvedCheckout.amount, catalog?.maxTransactionAmount || null));
  const returnOrder = orders.find((order) => order.reference === (activeReference || returnReference));

  if (!isOpen) return null;
  if (isQuick) {
    return <QuickUpgradePanel
      catalog={catalog}
      catalogLoading={catalogLoading}
      catalogError={catalogError}
      catalogFresh={catalogFresh}
      billingCycle={billingCycle}
      selectedPlan={selectedPlan}
      featureLabel={featureLabel}
      notice={notice}
      mobile={useMobileLayout}
      onBillingCycleChange={(cycle) => { setBillingCycle(cycle); setCheckout(null); setCheckoutError(''); idempotencyKey.current = ''; }}
      onSelectPlan={setSelectedPlan}
      onContinue={onClose}
      onUpgrade={() => onOpenFullUpgrade?.({ planId: selectedPlan, billingCycle }, notice)}
      t={t}
      locale={locale}
    />;
  }

  const changeBillingCycle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    setCheckout(null);
    setCheckoutError('');
    idempotencyKey.current = '';
  };

  const chooseCheckout = (selection: CheckoutSelection) => {
    setCheckout(selection);
    setCheckoutError('');
    setCheckoutFieldErrors({});
    idempotencyKey.current = '';
    if (!currentUser) onRequireAuth();
    window.setTimeout(() => document.getElementById(checkoutFormId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const checkoutFailureMessage = (reason: unknown, fallback = '') => {
    if (reason instanceof ApiError || (reason && typeof reason === 'object' && 'code' in reason)) {
      return userErrorMessage(reason, t, 'upgrade.createOrderError');
    }
    return fallback || userErrorMessage(reason, t, 'upgrade.createOrderError');
  };

  const submitCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvedCheckout || !currentUser || submitting || !checkoutAvailable) return;
    const name = (isTpay ? customerName : `${billingInfo.firstName} ${billingInfo.lastName}`).trim();
    const { phone, error: validationError } = validateCheckoutCustomer(name, customerPhone);
    const errors: CheckoutFieldErrors = {};
    if (validationError === 'name') errors[isTpay ? 'customerName' : 'firstName'] = t('upgrade.nameError');
    if (validationError === 'phone') errors.phone = t('upgrade.phoneError');
    if (isTpay && name.length > 50) errors.customerName = t('upgrade.nameError');
    if (!isTpay) {
      if (billingInfo.firstName.trim().length < 1) errors.firstName = 'Enter your given name.';
      if (billingInfo.lastName.trim().length < 2) errors.lastName = 'Enter your family name (at least 2 characters).';
      if (!billingInfo.address1.trim()) errors.address1 = 'Enter your address.';
      if (!billingInfo.city.trim()) errors.city = 'Enter your city.';
      if (!billingInfo.state.trim()) errors.state = 'Enter your state or province.';
      if (!billingInfo.postalCode.trim()) errors.postalCode = 'Enter your postal code.';
      if (!ZEFFRA_COUNTRY_CODES.includes(billingInfo.country.trim().toUpperCase())) errors.country = 'Choose your country or region.';
    }
    setCheckoutFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCheckoutError('Check the highlighted fields and try again.');
      return;
    }
    setSubmitting(true);
    setCheckoutError('');
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    try {
      const order = await api.payments.orders.create({
        productType: resolvedCheckout.productType, productId: resolvedCheckout.productId,
        billingCycle: resolvedCheckout.billingCycle, customerName: name, customerPhone: phone,
        ...(!isTpay ? {
          billingInfo: { ...billingInfo, email: currentUser.email, phone, country: billingInfo.country.trim().toUpperCase() },
          deviceInfo: paymentDeviceInfo(),
        } : {}),
      }, idempotencyKey.current);
      setOrders((items) => [order, ...items.filter((item) => item.reference !== order.reference)]);
      if (order.status === 'success') {
        setCheckout(null);
        setPaymentState('success');
        reloadAccount();
        return;
      }
      if (order.status === 'fail' || !order.payUrl) {
        setCheckoutError(isAmountLimitError(order.failReason)
          ? t('upgrade.amountLimitError', { amount: formatUsd(catalog?.maxTransactionAmount || 0, locale) })
          : checkoutFailureMessage({ code: 'PAYMENT_CREATE_FAILED' }));
        return;
      }
      localStorage.setItem(PAYMENT_REFERENCE_KEY, order.reference);
      localStorage.setItem(PAYMENT_PRESENTATION_KEY, isQuick ? 'quick' : 'page');
      setActiveReference(order.reference);
      const target = new URL(order.payUrl);
      if (target.protocol !== 'https:') throw new Error('Invalid checkout URL');
      window.location.assign(target.href);
    } catch (error) {
      if (error instanceof ApiError) setCheckoutFieldErrors(checkoutErrorsFromApi(error.fields, t('upgrade.createOrderError')));
      setCheckoutError(error instanceof ApiError && (error.code === 'PAYMENT_AMOUNT_LIMIT' || isAmountLimitError(error.message))
        ? t('upgrade.amountLimitError', { amount: formatUsd(String(error.fields.maxAmount || catalog?.maxTransactionAmount || 0), locale) })
        : checkoutFailureMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const queryOrder = async (order: PaymentOrder) => {
    setActiveReference(order.reference);
    setPaymentState('checking');
    try {
      const updated = await api.payments.orders.query(order.reference);
      setOrders((items) => items.map((item) => item.reference === updated.reference ? updated : item));
      setPaymentState(updated.status === 'success' || updated.status === 'fail' ? updated.status : 'waiting');
      if (updated.status === 'success') reloadAccount();
      if ((updated.status === 'success' || updated.status === 'fail') && updated.reference === returnReference) {
        localStorage.removeItem(PAYMENT_REFERENCE_KEY);
        localStorage.removeItem('soulmingle:paybao-reference');
        localStorage.removeItem(PAYMENT_PRESENTATION_KEY);
        localStorage.removeItem('soulmingle:paybao-presentation');
        onReturnHandled?.();
      }
    } catch {
      setPaymentState('delayed');
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
    }
  };

  if (isPage && initialSection === 'plans' && !checkout && !returnReference) {
    return <MembershipPricing catalog={catalog} loading={catalogLoading} error={catalogError} available={checkoutAvailable} billingCycle={billingCycle} onCycle={changeBillingCycle} onClose={onClose} onRetry={reloadCatalog} onCheckout={(plan) => {setSelectedPlan(plan.id); chooseCheckout({productType:'membership',productId:plan.id,billingCycle,name:plan.name,amount:billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice});}} />;
  }

  return (
    <div
      className={isPage
        ? 'upgrade-page relative min-h-full w-full overflow-y-auto bg-[#09090d] text-zinc-100'
        : `mobile-touch-modal fixed inset-0 z-[70] text-zinc-100 ${useMobileLayout ? 'bg-[#0b0b12]' : 'flex items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-md sm:p-5'}`}
      role={isPage ? undefined : 'dialog'}
      aria-modal={isPage ? undefined : true}
      aria-labelledby="upgrade-title"
    >
      <div className={isPage
        ? 'relative mx-auto min-h-full w-full max-w-6xl bg-[#12121c] p-4 text-zinc-100 sm:p-7'
        : `relative flex min-h-0 flex-col overflow-hidden bg-[#11121a] shadow-[0_24px_70px_rgba(0,0,0,0.55)] ${useMobileLayout ? 'h-[100dvh] w-full' : `max-h-[calc(100dvh-1rem)] w-full ${isQuick ? 'max-w-3xl' : 'max-w-5xl'} rounded-3xl border border-zinc-800 ring-1 ring-white/[0.08] sm:max-h-[92vh]'}`}`}>
           {isPage ? (
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="mobile-touch-target absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-black/40 text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70 sm:right-5 sm:top-5">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <header className="safe-area-top shrink-0 border-b border-white/[0.08] bg-[#11121a] px-3 pb-2 sm:px-6">
            <div className="flex min-h-14 items-center justify-between gap-3">
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="mobile-touch-target inline-flex shrink-0 items-center justify-center rounded-xl text-zinc-300 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70">{useMobileLayout ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}</button>
               <h2 id="upgrade-title" className="min-w-0 flex-1 truncate text-center text-base font-black text-zinc-50 sm:text-left sm:text-lg">{t(isQuick ? 'upgrade.quickTitle' : 'upgrade.title')}</h2>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${checkoutAvailable ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-300/[0.08] text-amber-100'}`}>{checkoutAvailable ? t('upgrade.checkoutReady') : t('upgrade.checkoutUnavailableShort')}</span>
            </div>
          </header>
        )}

        <div className={isPage
          ? 'min-h-full space-y-6 px-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:pt-5'
          : 'mobile-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 custom-scrollbar sm:px-6 sm:pb-8 sm:pt-6'}>
          {isPage ? (
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/15 px-3.5 py-1 text-xs font-black text-pink-300">
                <Crown className="h-4 w-4 text-amber-400" />{t('upgrade.status')}
              </div>
              <h1 id="upgrade-title" className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t('upgrade.title')}</h1>
              <p className="mx-auto max-w-lg text-xs text-zinc-400">{t('upgrade.description')}</p>
            </div>
           ) : (
             <div className={isQuick ? 'mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-300/20 bg-[#171821]' : ''}>
               {isQuick && <img src="/assets/lurova-entry-poster-v1.webp" alt="" className="h-24 w-full object-cover opacity-80 sm:h-32" decoding="async" />}
               <p className={`${isQuick ? 'px-4 py-3' : ''} mx-auto max-w-3xl text-center text-sm leading-6 text-zinc-300`}>{t(isQuick ? 'upgrade.quickDescription' : 'upgrade.description')}</p>
             </div>
           )}

          {notice && <div className="mx-auto max-w-3xl rounded-xl bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100 ring-1 ring-amber-300/20" role="status">{notice}</div>}

          {catalogLoading && !catalog && <div className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-2 text-sm text-zinc-300"><LoaderCircle className="h-4 w-4 animate-spin" />{t('upgrade.loadingCatalog')}</div>}
          {catalogError && <div role="alert" className="mx-auto mt-6 flex max-w-xl items-center justify-between gap-3 rounded-xl bg-red-400/[0.08] p-4 text-sm text-red-100"><span className="flex min-w-0 items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{catalogError}</span><button type="button" onClick={reloadCatalog} className="shrink-0 rounded-lg bg-white/[0.08] px-3 py-2 font-bold hover:bg-white/[0.12]">{t('common.retry')}</button></div>}

          {currentUser && (accountLoading || account || accountError) && (
            <section className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-300/15 bg-[#181821] p-3 shadow-[0_14px_30px_-26px_rgba(251,191,36,0.8)]" aria-labelledby="upgrade-account-title">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h3 id="upgrade-account-title" className="text-base font-black text-white">{t('upgrade.accountTitle')}</h3><p className="mt-1 text-xs text-zinc-400">{account?.membership ? t('upgrade.membershipUntil', { plan: t(planNameKeys[account.membership.tier]), date: formatDate(account.membership.expiresAt, locale) }) : t('upgrade.noMembership')}</p></div>
                <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-amber-200" /><div><p className="text-xs text-zinc-400">{t('upgrade.permanentBalance')}</p><p className="text-lg font-black tabular-nums text-amber-100">{account ? formatCount(account.wallet.balance, locale) : '—'}</p></div></div>
              </div>
              {accountError && <p role="alert" className="mt-3 text-sm text-red-200">{accountError}</p>}
            </section>
          )}

          {returnReference && (
            <section className="mx-auto mt-5 max-w-6xl rounded-xl bg-white/[0.04] p-4" aria-live="polite">
              <div className="flex items-start gap-3">
                {paymentState === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> : paymentState === 'fail' ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" /> : <LoaderCircle className={`mt-0.5 h-5 w-5 shrink-0 text-amber-200 ${paymentState === 'checking' || paymentState === 'waiting' ? 'animate-spin' : ''}`} />}
                <div className="min-w-0 flex-1"><p className="font-bold text-white">{t(`upgrade.return.${paymentState}`)}</p><p className="mt-1 break-all text-xs text-zinc-400">{t('upgrade.merchantReference')}: {activeReference || returnReference}</p></div>
                {isQuick && returnOrder && paymentState !== 'success' && <button type="button" onClick={() => void queryOrder(returnOrder)} disabled={paymentState === 'checking'} className="min-h-10 shrink-0 rounded-lg bg-white/[0.08] px-3 text-xs font-bold text-zinc-100 hover:bg-white/[0.12] disabled:opacity-50">{t('upgrade.queryStatus')}</button>}
              </div>
            </section>
          )}

          {checkout && currentUser && (
            <section id={checkoutFormId} className="mx-auto mt-6 max-w-3xl px-1 py-2 sm:px-5" aria-labelledby="upgrade-checkout-title">
              <button type="button" onClick={() => { setCheckout(null); setCheckoutError(''); setCheckoutFieldErrors({}); }} className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white"><ArrowLeft className="h-4 w-4" />{t('upgrade.backToPlans')}</button>
              <div className="border-y border-pink-400/20 bg-pink-400/[0.04] px-4 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-pink-200">{t('upgrade.checkoutStep')}</p><h3 id="upgrade-checkout-title" className="mt-1 text-xl font-black text-white">{t('upgrade.confirmTitle')}</h3><p className="mt-1 text-sm text-zinc-300">{resolvedCheckout?.name} · {formatUsd(resolvedCheckout?.amount || '0', locale)}</p></div><button type="button" onClick={() => setCheckout(null)} aria-label={t('common.close')} className="mobile-touch-target flex items-center justify-center rounded-lg text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button></div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{t(isTpay ? 'upgrade.tpayDetailsHint' : 'upgrade.checkoutDetailsHint')}</p>
                <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitCheckout} noValidate>
                  {isTpay ? (
                    <label className="min-w-0 text-sm font-bold text-zinc-200 sm:col-span-2">
                      <span>{t('upgrade.fullName')}</span>
                      <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" maxLength={50} required placeholder={t('upgrade.fullNamePlaceholder')} aria-invalid={Boolean(checkoutFieldErrors.customerName)} aria-describedby={checkoutFieldErrors.customerName ? `${checkoutFormId}-customerName-error` : undefined} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />
                      {checkoutFieldErrors.customerName && <span id={`${checkoutFormId}-customerName-error`} className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors.customerName}</span>}
                    </label>
                  ) : [
                    ['firstName', 'First name', billingInfo.firstName, 'given-name', 'Your given name'] as const,
                    ['lastName', 'Last name', billingInfo.lastName, 'family-name', 'Your family name, at least 2 characters'] as const,
                  ].map(([field, label, value, autoComplete, placeholder]) => <label key={field} className="min-w-0 text-sm font-bold text-zinc-200"><span>{label}</span><input value={value} onChange={(event) => setBillingInfo((current) => ({ ...current, [field]: event.target.value }))} autoComplete={autoComplete} maxLength={80} required placeholder={placeholder} aria-invalid={Boolean(checkoutFieldErrors[field])} aria-describedby={checkoutFieldErrors[field] ? `${checkoutFormId}-${field}-error` : undefined} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />{checkoutFieldErrors[field] && <span id={`${checkoutFormId}-${field}-error`} className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors[field]}</span>}</label>)}
                  <label className="min-w-0 text-sm font-bold text-zinc-200"><span className="flex items-center gap-2"><Phone className="h-4 w-4" />{t('upgrade.phone')}</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={32} required placeholder={t('upgrade.phonePlaceholder')} aria-invalid={Boolean(checkoutFieldErrors.phone)} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />{checkoutFieldErrors.phone && <span className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors.phone}</span>}</label>
                  <label className="min-w-0 text-sm font-bold text-zinc-200"><span className="flex items-center gap-2"><Mail className="h-4 w-4" />{t('upgrade.accountEmail')}</span><input value={currentUser.email} readOnly className="mt-2 min-h-11 w-full rounded-lg bg-white/[0.04] px-3 text-base text-zinc-400 ring-1 ring-white/[0.08]" /></label>
                  {!isTpay && <>
                  <label className="min-w-0 text-sm font-bold text-zinc-200 sm:col-span-2"><span>Address line 1</span><input value={billingInfo.address1} onChange={(event) => setBillingInfo((current) => ({ ...current, address1: event.target.value }))} autoComplete="address-line1" maxLength={160} required placeholder="Street and building number" aria-invalid={Boolean(checkoutFieldErrors.address1)} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />{checkoutFieldErrors.address1 && <span className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors.address1}</span>}</label>
                  <label className="min-w-0 text-sm font-bold text-zinc-200 sm:col-span-2"><span>Address line 2 <em className="font-normal text-zinc-500">(optional)</em></span><input value={billingInfo.address2} onChange={(event) => setBillingInfo((current) => ({ ...current, address2: event.target.value }))} autoComplete="address-line2" maxLength={160} placeholder="Apartment, suite, or unit" className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" /></label>
                  {[
                    ['city', 'City', billingInfo.city, 'address-level2', 'City'] as const,
                    ['state', 'State / Province', billingInfo.state, 'address-level1', 'State or province'] as const,
                    ['postalCode', 'Postal code', billingInfo.postalCode, 'postal-code', 'Postal code'] as const,
                  ].map(([field, label, value, autoComplete, placeholder]) => <label key={field} className="min-w-0 text-sm font-bold text-zinc-200"><span>{label}</span><input value={value} onChange={(event) => setBillingInfo((current) => ({ ...current, [field]: event.target.value }))} autoComplete={autoComplete} maxLength={80} required placeholder={placeholder} aria-invalid={Boolean(checkoutFieldErrors[field])} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />{checkoutFieldErrors[field] && <span className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors[field]}</span>}</label>)}
                  <label className="min-w-0 text-sm font-bold text-zinc-200"><span>Country / Region</span><select value={billingInfo.country} onChange={(event) => setBillingInfo((current) => ({ ...current, country: event.target.value }))} autoComplete="country" required aria-invalid={Boolean(checkoutFieldErrors.country)} className="mt-2 min-h-11 w-full rounded-lg bg-[#11121a] px-3 text-base text-white ring-1 ring-white/[0.12] focus:outline-none focus:ring-2 focus:ring-pink-400/70"><option value="">Choose country or region</option>{ZEFFRA_COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryLabel(code, locale)} ({code})</option>)}</select>{checkoutFieldErrors.country && <span className="mt-1 block text-xs font-medium text-red-200">{checkoutFieldErrors.country}</span>}</label>
                  </>}
                  <p className="text-xs leading-5 text-zinc-400 sm:col-span-2"><Info className="mr-1 inline h-3.5 w-3.5" />{t('upgrade.hostedCheckoutNote')}</p>
                  {checkoutExceedsLimit && <p role="alert" className="text-sm text-amber-100 sm:col-span-2">{t('upgrade.amountLimitError', { amount: formatUsd(catalog?.maxTransactionAmount || 0, locale) })}</p>}
                  {checkoutError && <p role="alert" className="flex items-start gap-2 text-sm text-red-200 sm:col-span-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{checkoutError}</p>}
                  <button type="submit" disabled={submitting || !resolvedCheckout || !checkoutAvailable || checkoutExceedsLimit} className="min-h-12 rounded-xl bg-pink-500 px-5 text-sm font-black text-white hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-pink-100/50 sm:col-span-2">{submitting ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />{t('upgrade.creatingOrder')}</span> : 'Continue to payment'}</button>
                </form>
              </div>
            </section>
          )}

          {!checkout && (catalog ? <>
            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 rounded-xl bg-[#171821] p-1 text-sm font-bold ring-1 ring-white/[0.08]" role="group" aria-label={t('upgrade.billingCycle')}>
              {(['monthly', 'annual'] as const).map((cycle) => <button key={cycle} type="button" onClick={() => changeBillingCycle(cycle)} aria-pressed={billingCycle === cycle} className={`min-h-10 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/70 ${billingCycle === cycle ? 'bg-pink-500 text-white' : 'text-white/60 hover:text-white'}`}>{t(`upgrade.${cycle}`)}{cycle === 'annual' && <span className="ml-1 text-[10px]">{t('upgrade.save50')}</span>}</button>)}
            </div>

            <section className="mx-auto mt-6 max-w-6xl" aria-labelledby="upgrade-plans-title">
              <div className="mb-3"><h3 id="upgrade-plans-title" className="text-lg font-black text-zinc-50">{t('upgrade.plansTitle')}</h3><p className="mt-1 text-xs text-zinc-400">{t('upgrade.plansHint')}</p></div>
              <div role="radiogroup" aria-label={t('upgrade.plansTitle')} className={`grid gap-4 ${isQuick ? 'md:grid-cols-2' : 'lg:grid-cols-2'}`}>{catalog.memberships.map((plan) => <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} selected={selectedPlan === plan.id} available={checkoutAvailable} authenticated={Boolean(currentUser)} onSelect={() => setSelectedPlan(plan.id)} onCheckout={() => chooseCheckout({ productType: 'membership', productId: plan.id, billingCycle, name: t(planNameKeys[plan.id]), amount: billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice })} t={t} locale={locale} maxTransactionAmount={catalog.maxTransactionAmount} />)}</div>
            </section>

            <section id="upgrade-recharge-section" className="mx-auto mt-7 max-w-5xl border border-zinc-800 rounded-3xl bg-[#181826] p-5" aria-labelledby="upgrade-recharge-title">
              <div className="flex items-center gap-2.5"><Coins className="h-5 w-5 text-amber-200" /><div><h3 id="upgrade-recharge-title" className="text-base font-black text-zinc-50">{t('upgrade.rechargeTitle')}</h3><p className="mt-1 text-xs text-zinc-400">{t('upgrade.rechargeHint')}</p></div></div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">{catalog.recharges.map((pack) => {
                const exceedsLimit = exceedsCheckoutLimit(pack.price, catalog.maxTransactionAmount);
                return <article key={pack.id} className="flex h-full min-w-0 flex-col rounded-xl bg-[#171821] p-4 ring-1 ring-white/[0.08]"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="break-words text-lg font-black tabular-nums text-amber-100">{t('upgrade.rechargeTotal', { amount: formatCount(pack.totalCredits, locale) })}</p><p className="mt-1 text-xs text-white/60">{t('upgrade.rechargeBase', { amount: formatCount(pack.baseCredits, locale) })}</p>{pack.bonusCredits > 0 && <p className="mt-0.5 text-xs text-emerald-300">{t('upgrade.rechargeBonus', { amount: formatCount(pack.bonusCredits, locale) })}</p>}</div><span className="shrink-0 text-sm font-black text-white">{formatUsd(pack.price, locale)}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/75"><span>{t('upgrade.rechargeImages', { count: formatCount(pack.imageCount, locale) })}</span><span>{t('upgrade.rechargeVideos', { count: formatCount(pack.videoCount, locale) })}</span></div>{exceedsLimit && <p className="mt-3 text-xs leading-5 text-amber-100">{t('upgrade.amountLimitHint', { amount: formatUsd(catalog.maxTransactionAmount || 0, locale) })}</p>}<div className="mt-auto pt-4"><button type="button" disabled={!checkoutAvailable || exceedsLimit} onClick={() => chooseCheckout({ productType: 'recharge', productId: pack.id, billingCycle: '', name: pack.name, amount: pack.price })} className="min-h-10 w-full rounded-lg bg-amber-300 px-3 text-sm font-black text-[#1b180e] hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-amber-100/50">{!checkoutAvailable ? t('upgrade.checkoutUnavailable') : exceedsLimit ? t('upgrade.amountLimit', { amount: formatUsd(catalog.maxTransactionAmount || 0, locale) }) : currentUser ? t('upgrade.rechargeNow') : t('upgrade.signInToCheckout')}</button></div></article>;
              })}</div>
            </section>

             {!isQuick && <section className="mx-auto mt-7 max-w-6xl" aria-labelledby="upgrade-consumption-title"><div className="flex items-center gap-2"><Zap className="h-5 w-5 text-sky-200" /><h3 id="upgrade-consumption-title" className="text-base font-black text-zinc-50">{t('upgrade.consumptionTitle')}</h3></div><p className="mt-1 text-xs text-zinc-400">{t('upgrade.consumptionHint')}</p><div className="mt-3 divide-y divide-white/[0.07]">{catalog.consumptionRules.map((rule) => <div key={rule.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span className="min-w-0 text-zinc-300">{t(ruleLabelKeys[rule.id])}</span><span className="shrink-0 font-black tabular-nums text-white">{formatCount(rule.cost, locale)} {t('upgrade.diamonds')} {t(`upgrade.${rule.unitKey}`)}</span></div>)}</div></section>}
          </> : (
            <section className="mx-auto mt-6 max-w-6xl space-y-4" aria-label={t('upgrade.plansTitle')} aria-busy={catalogLoading}>
              <div className="grid gap-4 lg:grid-cols-2">
                {[0, 1].map((item) => <div key={item} className="h-[420px] animate-pulse rounded-3xl border-2 border-zinc-800 bg-[#161624] p-6" />)}
              </div>
              <div className="h-44 animate-pulse rounded-3xl border border-zinc-800 bg-[#181826]" />
            </section>
          ))}

           {!isQuick && currentUser && (
            <section className="mx-auto mt-8 max-w-5xl border-t border-white/[0.08] pt-6" aria-labelledby="upgrade-orders-title">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><History className="h-5 w-5 text-zinc-300" /><h3 id="upgrade-orders-title" className="text-lg font-black text-white">{t('upgrade.orderHistory')}</h3></div><button type="button" onClick={reloadAccount} disabled={accountLoading} aria-label={t('upgrade.refreshOrders')} className="mobile-touch-target flex items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${accountLoading ? 'animate-spin' : ''}`} /></button></div>
              {orders.length === 0 && !accountLoading ? <p className="mt-4 text-sm text-zinc-400">{t('upgrade.noOrders')}</p> : <div className="mt-4 space-y-2">{orders.map((order) => <article key={order.reference} className="min-w-0 rounded-xl bg-white/[0.035] p-3 ring-1 ring-white/[0.07]"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold text-white">{order.productName}</p><p className="mt-1 text-xs text-zinc-400">{formatUsd(order.amount, locale)} · {formatDate(order.createdAt, locale)}</p></div><StatusBadge status={order.status} t={t} /></div><div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2"><div className="flex min-w-0 items-center gap-2"><span className="shrink-0">{t('upgrade.merchantReference')}</span><code className="min-w-0 truncate text-zinc-200">{order.reference}</code><button type="button" onClick={() => void copyText(order.reference)} aria-label={t('upgrade.copyReference')} title={t('upgrade.copyReference')} className="shrink-0 text-zinc-400 hover:text-white">{copied === order.reference ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}</button></div><div className="flex min-w-0 items-center gap-2"><span className="shrink-0">{t('upgrade.paybaoReference')}</span><code className="min-w-0 truncate text-zinc-200">{order.transactionId || '—'}</code>{order.transactionId && <button type="button" onClick={() => void copyText(order.transactionId)} aria-label={t('upgrade.copyTransaction')} title={t('upgrade.copyTransaction')} className="shrink-0 text-zinc-400 hover:text-white">{copied === order.transactionId ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}</button>}</div></div>{order.status !== 'success' && <div className="mt-3 flex items-center justify-between gap-3"><p className="min-w-0 break-words text-xs text-red-200">{isAmountLimitError(order.failReason) ? t('upgrade.amountLimitError', { amount: formatUsd(catalog?.maxTransactionAmount || 0, locale) }) : t('upgrade.createOrderError')}</p><button type="button" onClick={() => void queryOrder(order)} disabled={paymentState === 'checking' && activeReference === order.reference} className="shrink-0 rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/[0.11] disabled:opacity-50">{t('upgrade.queryStatus')}</button></div>}</article>)}</div>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
