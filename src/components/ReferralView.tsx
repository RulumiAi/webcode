import {CurrencyIcon as Coins} from './CurrencyIcon';
import React, { useState } from 'react';
import {
  Gift,
  Share2,
  Copy,
  Check,
  Sparkles,
  CreditCard,
  Crown,
  Gem,
  TrendingUp,
  Users,
  
  History,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  X,
  QrCode,
  Smartphone
} from 'lucide-react';
import { useLocale } from '../i18n';

interface ReferralViewProps {
  onOpenUpgradeModal: () => void;
  isMember?: boolean;
}

interface GemTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'earn' | 'spend';
  date: string;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onOpenUpgradeModal, isMember = false }) => {
  const { t, formatNumber } = useLocale();
  const [gemsBalance] = useState<number>(0);
  const [totalEarned] = useState<number>(0);
  const [invitedCount] = useState<number>(0);
  const [isDailyClaimed] = useState<boolean>(false);
  
  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Recharge Modal State
  const [selectedPackage, setSelectedPackage] = useState<{
    id: string;
    gems: number;
    bonus: number;
    price: number;
    tag?: string;
  } | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'card'>('wechat');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // History Log
  const [history] = useState<GemTransaction[]>([]);

  const inviteCode = t('referral.notAvailable');
  const inviteLink = '';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleCopyLink = () => {
    showToast(t('referral.linkUnavailable'));
  };

  const handleDailyShareClaim = () => {
    showToast(t('referral.daily'));
  };

  const rechargePackages: Array<{ id: string; gems: number; bonus: number; price: number; tag?: string }> = [];

  const handleConfirmRecharge = () => {
    showToast(t('referral.noPaid'));
  };

  return (
    <div className="mobile-secondary-view max-w-[1500px] mx-auto pb-20 space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-sm items-center gap-2 rounded-2xl border border-pink-400/40 bg-gradient-to-r from-pink-600 to-rose-600 px-5 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-4 duration-300 sm:left-auto sm:right-6 sm:top-20 sm:mx-0">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Banner with Gem Counter */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-950/70 via-[#1a1224] to-pink-950/70 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black">
              <Gift className="w-3.5 h-3.5" />
              <span>{t('referral.status')}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {t('referral.intro')}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {t('referral.shareHint')}
            </p>
          </div>

          {/* Current Gem Balance Widget */}
          <div className="w-full lg:w-auto p-5 rounded-3xl bg-zinc-900/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                💎
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-mono">{t('referral.status')}</div>
                <div className="text-2xl font-black text-amber-400 font-mono tracking-wide">
                  {t('referral.notAvailable')}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById('recharge-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto lg:w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>{t('referral.noPaid')}</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-amber-500/20">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800">
            <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400 font-mono">{t('referral.totalEarned')}</div>
              <div className="text-sm font-black text-white font-mono">{t('referral.notAvailable')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800">
            <Users className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400 font-mono">{t('referral.invitedCount')}</div>
              <div className="text-sm font-black text-white font-mono">{t('referral.notAvailable')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800">
            <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400 font-mono">{t('referral.dailyShare')}</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {t('referral.notAvailable')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Referral Link & Daily Reward */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Copy Invite Link Card (span 7) */}
        <div className="lg:col-span-7 bg-[#141420] border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-400" />
              <h2 className="font-extrabold text-base text-white">{t('referral.linkTitle')}</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-950/80 text-pink-400 border border-pink-500/30 font-mono">
              {t('referral.status')}: {inviteCode}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('referral.linkUnavailable')}
          </p>

          {/* Link Copy Box */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2 bg-zinc-900 rounded-2xl border border-zinc-800">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-transparent text-xs text-pink-300 font-mono px-3 py-2 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              disabled
              className="py-2.5 px-5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? t('referral.copied') : t('referral.notAvailable')}</span>
            </button>
          </div>

          {/* Daily Share One-click Claim Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-zinc-900 border border-pink-500/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-pink-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t('referral.daily')}</span>
              </div>
              <div className="text-[11px] text-zinc-400">{t('referral.dailyHint')}</div>
            </div>

            <button
              onClick={handleDailyShareClaim}
              disabled={isDailyClaimed}
              className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-all shrink-0 flex items-center gap-1.5 ${
                isDailyClaimed
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-black shadow-lg shadow-amber-500/20'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>{t('referral.notAvailable')}</span>
            </button>
          </div>

        </div>

        {/* Right: Reward Rules Explanation (span 5) */}
        <div className="lg:col-span-5 bg-[#141420] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>{t('referral.guide')}</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="font-extrabold text-white">{t('referral.noRelations')}</h3>
                <p className="text-zinc-400 mt-0.5">{t('referral.noRelationsHint')}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-white">{t('referral.noBilling')}</h3>
                <p className="text-zinc-400 mt-0.5">{t('referral.noBillingHint')}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="font-extrabold text-white">{t('referral.creditHint')}</h3>
                <p className="text-zinc-400 mt-0.5">{t('referral.creditHint')}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: VIP Subscription Bonus Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#1a1228] to-pink-950/80 border border-purple-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('referral.noPaid')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {t('referral.noPaid')}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t('referral.noPaidHint')}
            </p>
          </div>

          <button
            onClick={onOpenUpgradeModal}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 flex items-center gap-2 transition-all shrink-0 hover:scale-102"
          >
            {isMember ? <Gem className="w-4 h-4" /> : <Crown className="w-4 h-4 fill-white" />}
            <span>{isMember ? t('nav.buyDiamonds') : t('referral.notAvailable')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* VIP Tiers Gem Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-purple-500/20">
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1">
            <div className="text-xs font-black text-pink-300">{t('upgrade.seniorUnavailable')}</div>
            <div className="text-sm font-black text-amber-400 font-mono">{t('upgrade.noPlan')}</div>
            <div className="text-[10px] text-zinc-400">{t('upgrade.noSubscriptions')}</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1 relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[9px] px-2 py-0.5 rounded-full font-black">
              {t('referral.bestValue')}
            </div>
            <div className="text-xs font-black text-amber-300">{t('upgrade.deluxeUnavailable')}</div>
            <div className="text-sm font-black text-amber-400 font-mono">{t('upgrade.noPlan')}</div>
            <div className="text-[10px] text-zinc-400">{t('upgrade.noSubscriptions')}</div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Gem Recharge Store (充值宝石入口) */}
      <div id="recharge-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h2 className="font-black text-lg text-white">{t('referral.paymentTitle')}</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{t('referral.paymentHint')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rechargePackages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className="group relative bg-[#141420] border border-zinc-800 hover:border-amber-500/60 rounded-3xl p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between space-y-4"
            >
              {pkg.tag && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                  {pkg.tag}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <div>
                    <div className="text-xl font-black text-white font-mono group-hover:text-amber-400 transition-colors">
                      {formatNumber(pkg.gems)} {t('common.gems')}
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="text-xs font-bold text-amber-400">
                        +{pkg.bonus} {t('common.gems')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-zinc-400">
                  {t('common.total')} <strong className="text-white font-mono">{formatNumber(pkg.gems + pkg.bonus)}</strong> {t('common.gems')}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPackage(pkg);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black text-amber-300 font-extrabold text-xs transition-all flex items-center justify-center gap-1"
              >
                <span>¥{pkg.price}.00 {t('common.buy')}</span>
              </button>
            </div>
          ))}
          {!rechargePackages.length && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
              {t('referral.noPaid')}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Gem Transaction History Log */}
      <div className="bg-[#141420] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
          <h2 className="font-extrabold text-sm text-white">{t('referral.history')}</h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{t('referral.noHistory')}</span>
        </div>

        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.type === 'earn' ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                />
                <span className="font-bold text-zinc-200">{item.title}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-zinc-500 font-mono">{item.date}</span>
                <span
                  className={`font-black font-mono text-sm ${
                    item.type === 'earn' ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {item.type === 'earn' ? `+${item.amount}` : item.amount} 💎
                </span>
              </div>
            </div>
          ))}
          {!history.length && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-5 text-center text-xs text-zinc-500">
              {t('referral.noPaid')}
            </div>
          )}
        </div>
      </div>

      {/* Recharge Payment Modal */}
      {selectedPackage && (
      <div className="mobile-touch-modal safe-area-top fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4">
        <div className="relative my-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl border border-amber-500/40 bg-[#161622] p-4 text-white shadow-2xl sm:rounded-3xl sm:p-6">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">{t('referral.rechargeConfirm')}</h3>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package Summary Box */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-300 font-bold">{t('referral.selectedAmount')}</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  {selectedPackage.gems} {selectedPackage.bonus > 0 ? `+ ${selectedPackage.bonus}` : ''} 💎
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">{t('referral.amountDue')}</div>
                <div className="text-2xl font-black text-white font-mono">¥{selectedPackage.price}.00</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-300 block">{t('referral.paymentMethod')}</label>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                {[
                  { id: 'wechat', label: t('referral.wechat'), color: 'border-emerald-500 text-emerald-400' },
                  { id: 'alipay', label: t('referral.alipay'), color: 'border-sky-500 text-sky-400' },
                  { id: 'card', label: t('referral.card'), color: 'border-purple-500 text-purple-400' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === m.id
                        ? `bg-zinc-800 ${m.color} shadow-md`
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fake QR code placeholder */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center justify-center space-y-2 text-center">
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <QrCode className="w-full h-full text-black" />
              </div>
              <div className="text-[11px] text-zinc-400">
                {t('referral.noPayment')}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedPackage(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                {t('referral.cancel')}
              </button>
              <button
                onClick={handleConfirmRecharge}
                disabled={isProcessingPayment}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('referral.confirm')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
