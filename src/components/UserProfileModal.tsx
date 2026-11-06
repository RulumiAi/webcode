import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileText, Gem, Globe, LoaderCircle, LogOut, Mail, ShieldCheck, User, X } from 'lucide-react';
import { api, ApiError } from '../api';
import type { ApiUser } from '../api';
import { applyLocalePreference, LOCALE_LABELS, SUPPORTED_LOCALES, useLocale } from '../i18n';
import type { Locale } from '../types';
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  emailVerificationResendCooldownKey,
  readEmailVerificationResendCooldown,
  remainingEmailVerificationResendSeconds,
} from '../utils/emailVerificationCooldown';

interface UserProfileModalProps {
  isOpen: boolean;
  user?: ApiUser | null;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  onOpenUpgradeModal: () => void;
  onOpenReferral: () => void;
  onOpenSafetyCenter: () => void;
  onLocaleChange?: (locale: Locale) => void | Promise<void>;
  onAvatarChange: (file: File) => void | Promise<void>;
  walletBalance?: number;
}

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  onOpenSafetyCenter,
  onLocaleChange,
  onAvatarChange,
  walletBalance,
}) => {
  const { locale, setLocale, t } = useLocale();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'language' | 'terms'>('profile');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [savingLocale, setSavingLocale] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendClock, setResendClock] = useState(() => Date.now());
  const resendCooldownSeconds = remainingEmailVerificationResendSeconds(resendAvailableAt, resendClock);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return undefined;
    const key = emailVerificationResendCooldownKey(user.id);
    const syncCooldown = () => {
      if (user.emailVerified) {
        localStorage.removeItem(key);
        setResendAvailableAt(0);
      } else {
        setResendAvailableAt(readEmailVerificationResendCooldown(user.id));
      }
      setResendClock(Date.now());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) syncCooldown();
    };
    syncCooldown();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user?.id, user?.emailVerified]);

  useEffect(() => {
    if (!resendAvailableAt) return undefined;
    const updateClock = () => {
      const now = Date.now();
      if (remainingEmailVerificationResendSeconds(resendAvailableAt, now) === 0) {
        if (user?.id) localStorage.removeItem(emailVerificationResendCooldownKey(user.id));
        setResendAvailableAt(0);
      }
      setResendClock(now);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt, user?.id]);

  if (!isOpen || !user) return null;

  const initial = user.displayName.trim().charAt(0).toUpperCase() || 'U';
  const authLabels: Record<string, string> = { password: t('auth.email'), google: 'Google' };
  const formattedWalletBalance = walletBalance === undefined ? '…' : new Intl.NumberFormat(locale).format(walletBalance);
  const walletBalanceLabel = t('profile.diamondBalance', { count: formattedWalletBalance });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await onLogout();
    } catch {
      setLogoutError(t('profile.logoutFailed'));
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLocaleChange = async (next: Locale) => {
    if (next === locale || savingLocale) return;
    setLanguageError(false);
    setSavingLocale(true);
    const synced = await applyLocalePreference(next, setLocale, onLocaleChange);
    if (!synced) setLanguageError(true);
    setSavingLocale(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploadingAvatar) return;
    if (file.type && !AVATAR_MIME_TYPES.has(file.type)) {
      setAvatarError(t('profile.avatarTypeError'));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t('profile.avatarSizeError'));
      return;
    }
    setAvatarError('');
    setUploadingAvatar(true);
    try {
      await onAvatarChange(file);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MEDIA_TYPE_UNSUPPORTED') {
        setAvatarError(t('profile.avatarTypeError'));
      } else if (error instanceof ApiError && error.code === 'MEDIA_TOO_LARGE') {
        setAvatarError(t('profile.avatarSizeError'));
      } else if (error instanceof ApiError && error.code === 'MEDIA_DIMENSIONS_TOO_LARGE') {
        setAvatarError(t('profile.avatarDimensionsError'));
      } else {
        setAvatarError('');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendingVerification || resendCooldownSeconds > 0 || user.emailVerified) return;
    setResendingVerification(true);
    setVerificationMessage('');
    try {
      await api.auth.resendEmailVerification();
      const availableAt = Date.now() + EMAIL_VERIFICATION_RESEND_COOLDOWN_MS;
      localStorage.setItem(emailVerificationResendCooldownKey(user.id), String(availableAt));
      setResendAvailableAt(availableAt);
      setResendClock(Date.now());
      setVerificationMessage(t('profile.verificationEmailSent'));
    } catch {
      setVerificationMessage(t('profile.verificationEmailFailed'));
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="mobile-touch-modal safe-area-top fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4">
      <div className="relative flex h-[calc(100dvh-16px)] max-h-[calc(100dvh-16px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#141420] shadow-2xl sm:h-[514px] sm:max-h-[calc(100dvh-32px)] sm:rounded-3xl">
        <div className="relative border-b border-zinc-800 bg-gradient-to-r from-purple-950/80 via-[#1a1228] to-pink-950/80 p-4 pt-16 sm:p-6">
          <button onClick={onClose} className="r20-round r20-settings-close absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white transition-colors border border-zinc-800" aria-label={t('profile.close')}>
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:pr-10">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void handleAvatarChange(event)}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => {
                setAvatarError('');
                avatarInputRef.current?.click();
              }}
              className="group relative h-20 w-20 shrink-0 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-0.5 shadow-xl shadow-pink-500/20 outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141420] disabled:cursor-wait disabled:hover:scale-100"
              aria-label={uploadingAvatar ? t('profile.avatarUploading') : t('profile.changeAvatar')}
              aria-busy={uploadingAvatar}
              aria-describedby={avatarError ? 'profile-avatar-error' : undefined}
              title={t('profile.changeAvatar')}
            >
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.displayName} className="w-full h-full rounded-[22px] object-cover bg-[#12121a]" />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-[#12121a] flex items-center justify-center text-white text-2xl font-black font-mono">{initial}</div>
              )}
              <span className="absolute -bottom-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#141420] bg-pink-500 text-white shadow-md transition-colors group-hover:bg-pink-400" aria-hidden="true">
                {uploadingAvatar ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </span>
              {uploadingAvatar && <span className="absolute inset-0 rounded-3xl bg-black/35" aria-hidden="true" />}
            </button>
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <h2 className="text-xl font-black text-white truncate">{user.displayName}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 min-w-0">
                <Mail className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="font-mono text-zinc-300 truncate">{user.email}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${user.emailVerified ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' : 'bg-zinc-900 text-zinc-400 border-zinc-700'}`}>
                  {user.emailVerified ? t('profile.emailVerified') : t('profile.emailUnverified')}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold">@{user.handle || '—'}</span>
              </div>
            </div>
          </div>
          {avatarError && <p id="profile-avatar-error" className="mt-3 text-center text-[11px] font-medium text-rose-300 sm:text-left" role="alert">{avatarError}</p>}
        </div>

        <div className="flex items-stretch gap-1 overflow-x-auto border-b border-zinc-800 bg-[#111118] px-2 scrollbar-none sm:px-6">
          {[
            { id: 'profile', label: t('profile.overview'), icon: User },
            { id: 'account', label: t('profile.accountLogin'), icon: ShieldCheck },
            { id: 'terms', label: t('profile.terms'), icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`flex min-w-[8rem] shrink-0 grow basis-0 items-center justify-center gap-2 border-b-2 px-3 py-3.5 text-center text-xs font-extrabold leading-tight transition-all sm:min-w-[9rem] sm:px-4 ${selected ? 'border-pink-500 bg-pink-500/5 text-pink-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}>
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mobile-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 text-xs">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#181824] border border-zinc-800 space-y-2">
                  <span className="font-extrabold text-white">{t('profile.accountStatus')}</span>
                  <div className="text-sm font-black text-white">{user.accountStatus}</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{t('profile.visibility')}：{user.privateProfile ? t('profile.private') : t('profile.public')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#181824] border border-zinc-800 space-y-2">
                  <span className="font-extrabold text-white">{t('profile.notifications')}</span>
                  <div className="text-sm font-black text-white">{user.notificationsEnabled ? t('profile.enabled') : t('profile.disabled')}</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{t('profile.readOnly')}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#181824] border border-zinc-800 space-y-3">
                <span className="font-extrabold text-white">{t('profile.credentials')}</span>
                <div className="flex flex-wrap gap-2">
                  {user.authMethods.map((method) => (
                    <span key={method} className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {authLabels[method] || method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="p-4 rounded-2xl bg-[#181824] border border-zinc-800 space-y-3 animate-in fade-in duration-200">
              <h3 className="font-extrabold text-white text-sm">{t('profile.accountLogin')}</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{t('profile.accountSecurityDescription')}</p>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
                <span className="text-zinc-300 truncate">{user.email}</span>
                <span className="text-emerald-400 font-bold shrink-0">{t('profile.sessionRestored')}</span>
              </div>
              {!user.emailVerified && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-3 text-[11px] text-amber-100">
                  <p>{t('profile.verificationPending')}</p>
                  <button
                    type="button"
                    onClick={() => void handleResendVerification()}
                    disabled={resendingVerification || resendCooldownSeconds > 0}
                    className="mt-3 min-h-10 rounded-lg border border-amber-300/40 px-3 font-bold text-amber-100 hover:bg-amber-400/10 disabled:cursor-wait disabled:opacity-60"
                  >
                    {resendingVerification
                      ? t('profile.verificationSending')
                      : resendCooldownSeconds > 0
                        ? t('profile.resendVerificationCountdown', {seconds: resendCooldownSeconds})
                        : t('profile.resendVerification')}
                  </button>
                  {verificationMessage && <p className="mt-2" role="status">{verificationMessage}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'terms' && (
            <button onClick={() => { onClose(); onOpenSafetyCenter(); }} className="w-full p-4 rounded-2xl bg-[#181824] hover:bg-zinc-800 border border-zinc-800 text-left flex items-center justify-between animate-in fade-in duration-200">
              <span className="font-extrabold text-white">{t('profile.legalCenter')}</span>
              <ShieldCheck className="w-4 h-4 text-pink-400" />
            </button>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-[#111118] flex items-center justify-between gap-3">
          <div>
            <button onClick={() => void handleLogout()} disabled={loggingOut} className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 disabled:opacity-60 text-rose-400 border border-zinc-800 hover:border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all">
              {loggingOut ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{loggingOut ? t('profile.loggingOut') : t('profile.logout')}</span>
            </button>
            {logoutError && <p className="text-[10px] text-rose-400 mt-1">{logoutError}</p>}
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs shadow-md shadow-pink-500/20">{t('common.done')}</button>
        </div>
      </div>
    </div>
  );
};
