import React, { useState } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Bug,
  Lightbulb,
  CreditCard,
  UserCheck,
  LifeBuoy,
  Heart,
  Gem,
  Star
} from 'lucide-react';
import { api, type ApiUser } from '../api';
import { PayPalComplaintView } from './PayPalComplaintView';
import { useLocale } from '../i18n';
import type { MembershipPlanId } from '../data/membershipProducts';
import { userErrorMessage } from '../utils/userError';

interface HelpViewProps {
  user?: ApiUser | null;
  onRequireAuth?: () => void;
  onOpenUpgradeModal?: () => void;
  membershipTier?: MembershipPlanId | null;
  onOpenCreateModal?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({
  user = null,
  onRequireAuth = () => undefined,
  onOpenUpgradeModal,
  membershipTier = null,
  onOpenCreateModal,
}) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'faq' | 'feedback' | 'paypal' | 'discord' | 'guide'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Feedback form states
  const [feedbackCategory, setFeedbackCategory] = useState<'suggestion' | 'bug' | 'role' | 'billing' | 'other'>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FAQ Items
  const faqList = [1, 2, 3, 4, 5, 6].map((index) => ({ q: t(`help.faq${index}.q`), a: t(`help.faq${index}.a`), category: t(`help.faq${index}.c`) }));

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.support.feedback({
        category: feedbackCategory,
        message: feedbackText.trim(),
        contactEmail: contactEmail.trim() || undefined,
        rating,
      });
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setFeedbackText('');
      setContactEmail('');
    } catch (reason) {
      setSubmitError(userErrorMessage(reason, t, 'help.feedbackError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-secondary-view max-w-[1500px] mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-pink-950/80 via-[#181828] to-purple-950/80 border border-pink-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-extrabold">
              {activeTab === 'paypal' ? <CreditCard className="w-3.5 h-3.5 text-[#75c9f2]" /> : <LifeBuoy className="w-3.5 h-3.5 text-pink-400" />}
              <span>{activeTab === 'paypal' ? t('help.paypalComplaint.heroBadge') : t('help.heroBadge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeTab === 'paypal' ? t('help.paypalComplaint.heroTitle') : t('help.heroTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {activeTab === 'paypal' ? t('help.paypalComplaint.heroDescription') : t('help.heroDescription')}
            </p>
          </div>

          {/* Quick Discord CTA Card */}
          {activeTab === 'paypal' ? (
            <div className="w-full md:w-auto rounded-2xl border border-[#1d6fa8]/60 bg-[#071a32] p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003087] text-white shadow-lg shadow-[#003087]/40"><CreditCard className="h-6 w-6" /></div>
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-[#75c9f2]">PayPal payment</div>
                  <div className="mt-1 text-sm font-extrabold text-white">{t('help.paypalComplaint.heroMeta')}</div>
                </div>
              </div>
            </div>
          ) : (
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/40 hover:border-indigo-400 transition-all hover:scale-102 shadow-xl shrink-0 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-indigo-200 flex items-center gap-1">
                  <span>{t('help.discordCta')}</span>
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                </div>
                <div className="text-[11px] text-zinc-300">{t('help.discordMeta')}</div>
              </div>
            </div>
          </a>
          )}
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('paypal')}
          className={activeTab === 'paypal'
            ? 'px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 bg-[#0878bd] text-white shadow-lg shadow-[#003087]/30'
            : 'px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('help.tabPayPal')}</span>
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'faq'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('help.tabFaq')}</span>
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'feedback'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{t('help.tabFeedback')}</span>
        </button>

        <button
          onClick={() => setActiveTab('discord')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'discord'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t('help.tabDiscord')}</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'guide'
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('help.tabGuide')}</span>
        </button>
      </div>

      {/* Main Tab Contents */}

      {activeTab === 'paypal' && (
        <PayPalComplaintView user={user} onRequireAuth={onRequireAuth} />
      )}
      {/* 1. FAQ Section */}
      {activeTab === 'faq' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Left FAQ Accordion (span 8) */}
          <div className="lg:col-span-8 space-y-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-pink-400" />
              <span>{t('help.faqHeading')}</span>
            </h2>

            <div className="space-y-3">
              {faqList.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? 'bg-[#161624] border-pink-500/40 shadow-lg'
                        : 'bg-[#12121a] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-bold text-sm text-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="hover:text-pink-300 transition-colors">{item.q}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono hidden sm:inline-block">
                          {item.category}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-pink-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/80 bg-zinc-950/40">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Useful Links & Helper Cards (span 4) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Create Role Quick Entry Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181826] to-[#12121a] border border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">{t('help.createTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('help.createDescription')}
                </p>
              </div>
              <button
                onClick={onOpenCreateModal}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 transition-all"
              >
                {t('help.createButton')}
              </button>
            </div>

            {/* VIP Upgrade Helper */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#181826] to-pink-950/30 border border-purple-500/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                {membershipTier ? <Gem className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-purple-400" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">{t('help.vipTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('help.vipDescription')}
                </p>
              </div>
              <button
                onClick={onOpenUpgradeModal}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all"
              >
                {membershipTier ? t('nav.buyDiamonds') : t('help.vipButton')}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 2. Feedback Form Section */}
      {activeTab === 'feedback' && (
        <div className="max-w-3xl mx-auto bg-[#141420] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
          
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-pink-400" />
              <span>{t('help.feedbackTitle')}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {t('help.feedbackDescription')}
            </p>
          </div>

          {submittedSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
                <h3 className="text-base font-black text-white">{t('help.feedbackReceived')}</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                {t('help.feedbackThanks')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200" role="alert">
                  {submitError}
                </div>
              )}
              
              {/* Feedback Category Choice */}
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-2">
                  {t('help.feedbackType')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'suggestion', label: t('help.feedbackSuggestion'), icon: Lightbulb },
                    { id: 'bug', label: t('help.feedbackBug'), icon: Bug },
                    { id: 'role', label: t('help.feedbackRole'), icon: Sparkles },
                    { id: 'billing', label: t('help.feedbackBilling'), icon: CreditCard },
                    { id: 'other', label: t('help.feedbackOther'), icon: HelpCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = feedbackCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackCategory(cat.id as any)}
                        className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Experience */}
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-2">
                  {t('help.rating')}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-zinc-400 font-mono ml-2">
                    {rating === 5 ? t('help.ratingGreat') : `${rating} ${t('common.selected')}`}
                  </span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-1">
                  {t('help.feedbackDetails')} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  maxLength={4000}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t('help.feedbackDetails')}
                  className="w-full bg-zinc-900 text-white text-xs px-4 py-3 rounded-2xl border border-zinc-800 focus:outline-none focus:border-pink-500 font-sans"
                />
              </div>

              {/* Contact Email (Optional) */}
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-1">
                  {t('help.feedbackEmail')}
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !feedbackText.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t('help.submitting') : t('help.feedbackSubmit')}</span>
              </button>

            </form>
          )}

        </div>
      )}

      {/* 3. Discord Community Section */}
      {activeTab === 'discord' && (
        <div className="bg-[#141420] border border-indigo-500/30 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-xl">
            <MessageCircle className="w-9 h-9 fill-current" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-white">{t('help.discordTitle')}</h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {t('help.discordDescription')}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <div className="text-pink-400 font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{t('help.discordBullet1')}</span>
              </div>
              <p className="text-xs text-zinc-400">{t('help.discordBullet1Hint')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <div className="text-indigo-400 font-bold text-xs flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>{t('help.discordBullet2')}</span>
              </div>
              <p className="text-xs text-zinc-400">{t('help.discordBullet2Hint')}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <GiftIcon className="w-4 h-4" />
                <span>{t('help.discordBullet3')}</span>
              </div>
              <p className="text-xs text-zinc-400">{t('help.discordBullet3Hint')}</p>
            </div>
          </div>

          {/* Big Discord Join Button */}
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/40 transition-all hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>{t('help.discordJoin')}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* 4. Guide & Security Section */}
      {activeTab === 'guide' && (
        <div className="bg-[#141420] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{t('help.guideTitle')}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {t('help.guideDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('help.copyright')}</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('help.guideCopyrightHint')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('help.privacy')}</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('help.guidePrivacyHint')}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
