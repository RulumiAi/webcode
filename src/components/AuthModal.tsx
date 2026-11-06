import {DESIGN_PREVIEW,startPreviewSession} from '../previewApi';
import {entryCopy} from '../entryCopy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, Mail, UserRound, X } from 'lucide-react';
import { api, ApiError, type ApiUser } from '../api';
import { useLocale } from '../i18n';
import type { Locale } from '../types';
import { userErrorMessage } from '../utils/userError';

export type AuthIntent = 'login' | 'register';
type AuthStep = 'methods' | 'email' | 'loginPassword' | 'registerProfile' | 'resetEmail' | 'resetToken';
type AuthMethod = 'email' | 'google';
type SupportedLocale = Locale;

interface AuthModalProps {
  isOpen: boolean;
  initialIntent: AuthIntent;
  onClose: () => void;
  onAuthenticated: (user: ApiUser) => void | Promise<void>;
  onOpenTerms?: () => void;
}

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentityApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select: boolean;
    cancel_on_tap_outside: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'continue_with';
    shape: 'pill';
    logo_alignment: 'left';
    width: number;
    locale: string;
  }) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const DEFAULT_GOOGLE_CLIENT_ID = '282015142228-9f9gtqihgrljc3mlcb0objcgp2b0s7ns.apps.googleusercontent.com';
const LAST_AUTH_METHOD_KEY = 'soulmingle_last_auth_method_v1';
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const googleClientId = viteEnv?.VITE_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_CLIENT_ID;
let googleIdentityScript: Promise<void> | undefined;

function loadGoogleIdentityServices() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleIdentityScript) return googleIdentityScript;

  googleIdentityScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.accounts.id
      ? resolve()
      : reject(new Error('Google Identity Services did not initialize.'));
    script.onerror = () => reject(new Error('Google Identity Services could not be loaded.'));
    document.head.append(script);
  }).catch((reason) => {
    googleIdentityScript = undefined;
    throw reason;
  });

  return googleIdentityScript;
}

function googleLocale(locale: SupportedLocale) {
  return locale === 'zh-CN' ? 'zh_CN' : locale;
}

const hasFieldError = (fields: Record<string, unknown>, key: string) => key in fields;

function toApiError(reason: unknown, fallback: string) {
  return reason instanceof ApiError
    ? reason
    : new ApiError('NETWORK_ERROR', fallback, 0);
}

function errorMessage(error: ApiError, t: (key: string) => string) {
  if (error.status >= 500) return t('auth.serviceUnavailable');
  return userErrorMessage(error, t, error.code === 'NETWORK_ERROR' ? 'auth.networkError' : 'auth.failed');
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function GoogleIdentityButton({
  busy,
  lastUsed,
  locale,
  onCredential,
  onUnavailable,
  lastUsedLabel,
}: {
  busy: boolean;
  lastUsed: boolean;
  locale: SupportedLocale;
  onCredential: (credential: string) => void;
  onUnavailable: () => void;
  lastUsedLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onUnavailableRef = useRef(onUnavailable);

  useEffect(() => { onCredentialRef.current = onCredential; }, [onCredential]);
  useEffect(() => { onUnavailableRef.current = onUnavailable; }, [onUnavailable]);

  useEffect(() => {
    let active = true;
    let observer: ResizeObserver | undefined;

    if (!googleClientId) {
      queueMicrotask(() => { if (active) onUnavailableRef.current(); });
      return () => { active = false; };
    }

    void loadGoogleIdentityServices().then(() => {
      if (!active || !containerRef.current || !window.google?.accounts.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: ({ credential }) => {
          if (credential) onCredentialRef.current(credential);
          else onUnavailableRef.current();
        },
      });

      const container = containerRef.current;
      let renderedWidth = 0;
      const render = () => {
        const width = Math.max(240, Math.floor(container.getBoundingClientRect().width || 398));
        if (width === renderedWidth) return;
        renderedWidth = width;
        container.replaceChildren();
        window.google?.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width,
          locale: googleLocale(locale),
        });
      };

      render();
      observer = new ResizeObserver(render);
      observer.observe(container);
    }).catch(() => {
      if (active) onUnavailableRef.current();
    });

    return () => {
      active = false;
      observer?.disconnect();
      window.google?.accounts.id.cancel();
    };
  }, [locale]);

  return (
    <div className={`relative h-10 w-full transition-opacity duration-150 ${busy ? 'pointer-events-none opacity-60' : ''}`} aria-busy={busy}>
      <div ref={containerRef} className="h-10 w-full overflow-hidden rounded-full" />
      {lastUsed && (
        <span className="absolute -right-1 -top-2 z-10 rounded bg-[#f13aa3] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm">
          {lastUsedLabel}
        </span>
      )}
    </div>
  );
}

const inputClassName = 'h-12 w-full rounded-2xl border border-white/10 bg-[#242424] px-4 text-base text-white outline-none transition-colors placeholder:text-[#898888] focus:border-[#f13aa3] sm:text-sm';
const iconInputClassName = `${inputClassName} pl-10`;
const primaryButtonClassName = 'flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#f13aa3] px-4 text-sm font-bold text-white transition-colors hover:bg-[#ff4caf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f13aa3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#242424] disabled:cursor-not-allowed disabled:bg-[#353536] disabled:text-[#898888]';

function InlineNotice({ error, success, t }: { error: ApiError | null; success: string; t: (key: string) => string }) {
  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-950/35 px-3 py-2.5 text-xs leading-relaxed text-rose-100" role="alert">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
        <span>{errorMessage(error, t)}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-950/30 px-3 py-2.5 text-xs leading-relaxed text-emerald-100" role="status">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialIntent,
  onClose,
  onAuthenticated,
  onOpenTerms,
}) => {
  const { locale, t } = useLocale();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const submittingRef = useRef(false);
  const googleSubmittingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onOpenTermsRef = useRef(onOpenTerms);

  const [intent, setIntent] = useState<AuthIntent>(initialIntent);
  const [step, setStep] = useState<AuthStep>('methods');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState('');
  const [lastMethod, setLastMethod] = useState<AuthMethod | null>(() => {
    try {
      const value = localStorage.getItem(LAST_AUTH_METHOD_KEY);
      return value === 'email' || value === 'google' ? value : null;
    } catch {
      return null;
    }
  });

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onOpenTermsRef.current = onOpenTerms; }, [onOpenTerms]);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);

  const requestClose = useCallback(() => {
    if (!submittingRef.current) onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setIntent(initialIntent);
    setStep('methods');
    setDisplayName('');
    setEmail('');
    setPassword('');
    setResetToken('');
    setError(null);
    setSuccess('');
    setSubmitting(false);
    googleSubmittingRef.current = false;
  }, [initialIntent, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = (Array.from(dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )) as HTMLElement[]).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [isOpen, requestClose]);

  const emailIsValid = validEmail(email);
  const displayNameIsValid = displayName.trim().length >= 2 && displayName.trim().length <= 50;
  const registerPasswordIsValid = password.length >= 8 && password.length <= 128;
  const resetPasswordIsValid = password.length >= 8 && password.length <= 128;

  const rememberMethod = (method: AuthMethod) => {
    setLastMethod(method);
    try {
      localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
    } catch {
      // The preference is optional when storage is unavailable.
    }
  };

  const completeAuthentication = async (user: ApiUser, method: AuthMethod) => {
    await onAuthenticated(user);
    rememberMethod(method);
    setPassword('');
    setResetToken('');
    onCloseRef.current();
  };

  const switchIntent = (next: AuthIntent) => {
    if (submitting) return;
    setIntent(next);
    setStep('email');
    setDisplayName('');
    setPassword('');
    setResetToken('');
    setError(null);
    setSuccess('');
  };

  const goBack = () => {
    if (submitting) return;
    setError(null);
    setSuccess('');
    if (step === 'email') setStep('methods');
    else if (step === 'loginPassword' || step === 'registerProfile') setStep('email');
    else if (step === 'resetEmail') setStep('loginPassword');
    else if (step === 'resetToken') setStep('resetEmail');
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    if (googleSubmittingRef.current) return;
    googleSubmittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      const user = await api.auth.google(credential, locale, true);
      await completeAuthentication(user, 'google');
    } catch (reason) {
      const nextError = toApiError(reason, t('auth.networkError'));
      if (nextError.code === 'ACCOUNT_LINK_REQUIRED') setIntent('login');
      setError(nextError);
    } finally {
      googleSubmittingRef.current = false;
      setSubmitting(false);
    }
  }, [locale, onAuthenticated, t]);

  const handleGoogleUnavailable = useCallback(() => {
    if (!googleSubmittingRef.current) {
      setError(new ApiError('GOOGLE_UNAVAILABLE', t('auth.googleUnavailable'), 0));
    }
  }, [t]);

  const handleEmailContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailIsValid) return;
    setError(null);
    setSuccess('');
    setStep(intent === 'login' ? 'loginPassword' : 'registerProfile');
  };

  const handleEmailAuthentication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      const user = intent === 'login'
        ? await api.auth.login(email.trim(), password)
        : await api.auth.register(displayName.trim(), email.trim(), password, locale);
      await completeAuthentication(user, 'email');
    } catch (reason) {
      setError(toApiError(reason, t('auth.networkError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !emailIsValid) return;
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      await api.auth.requestPasswordReset(email.trim());
      setResetToken('');
      setPassword('');
      setSuccess(t('auth.resetSent'));
      setStep('resetToken');
    } catch (reason) {
      setError(toApiError(reason, t('auth.networkError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !resetToken.trim() || !resetPasswordIsValid) return;
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      await api.auth.confirmPasswordReset(resetToken.trim(), password);
      setResetToken('');
      setPassword('');
      setIntent('login');
      setStep('loginPassword');
      setSuccess(t('auth.updated'));
    } catch (reason) {
      setError(toApiError(reason, t('auth.networkError')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTerms = () => {
    if (submitting) return;
    onCloseRef.current();
    onOpenTermsRef.current?.();
  };

  const title = intent === 'login' ? t('auth.welcome') : t('auth.join');
  const subtitle = intent === 'register' && step === 'methods' ? t('auth.registerHint') : '';
  const stepMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, x: 8 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -8 }, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const } };

  const legalCopy = (
    <p className="text-center text-[10px] leading-[1.45] text-[#898888]">
      {t('auth.legalAge')}{' '}
      <button type="button" onClick={handleOpenTerms} className="font-semibold text-[#b6b5b5] underline decoration-white/25 underline-offset-2 transition-colors hover:text-white">
        {t('auth.termsLink')}
      </button>
    </p>
  );

  const switchCopy = (
    <button
      type="button"
      onClick={() => switchIntent(intent === 'login' ? 'register' : 'login')}
      disabled={submitting}
      className="mx-auto block text-xs font-semibold text-[#b6b5b5] transition-colors hover:text-white disabled:opacity-50"
    >
      {intent === 'login' ? t('auth.switchRegister') : t('auth.switchLogin')}
    </button>
  );

  const renderStep = () => {
    if (step === 'methods') {
      return (
        <div className="space-y-4">
          <InlineNotice error={error} success={success} t={t} />
          <div className="space-y-3">
            {DESIGN_PREVIEW?<button type="button" className="mio-auth-google-preview" onClick={()=>setError(entryCopy(locale).notConnected)}><b>G</b>{entryCopy(locale).google}</button>:<GoogleIdentityButton
              busy={submitting}
              lastUsed={lastMethod === 'google'}
              locale={locale}
              onCredential={handleGoogleCredential}
              onUnavailable={handleGoogleUnavailable}
              lastUsedLabel={t('auth.lastUsed')}
            />}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setError(null); setStep('email'); }}
                disabled={submitting}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#353536] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#414142] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {t('auth.emailContinue')}
              </button>
              {lastMethod === 'email' && (
                <span className="absolute -right-1 -top-2 rounded bg-[#f13aa3] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm">
                  {t('auth.lastUsed')}
                </span>
              )}
            </div>
          </div>
          {switchCopy}
          <div className="border-t border-white/10 pt-4">
            {legalCopy}
          </div>
        </div>
      );
    }

    if (step === 'email') {
      return (
        <form onSubmit={handleEmailContinue} className="space-y-4">
          <InlineNotice error={error} success={success} t={t} />
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
              aria-invalid={hasFieldError(error?.fields || {}, 'email')}
              className={iconInputClassName}
            />
          </div>
          {hasFieldError(error?.fields || {}, 'email') && error && <p className="text-xs text-rose-300">{errorMessage(error, t)}</p>}
          <button type="submit" disabled={!emailIsValid} className={primaryButtonClassName}>{t('auth.continue')}</button>
          {legalCopy}
          {switchCopy}
        </form>
      );
    }

    if (step === 'loginPassword') {
      return (
        <form onSubmit={handleEmailAuthentication} className="space-y-4">
          <InlineNotice error={error} success={success} t={t} />
          <div>
            <p className="mb-2 truncate text-center text-xs text-[#b6b5b5]">{email}</p>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
                required
                className={iconInputClassName}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting || password.length === 0} className={primaryButtonClassName}>
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? t('auth.loggingIn') : t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => { setError(null); setSuccess(''); setStep('resetEmail'); }}
            disabled={submitting}
            className="mx-auto block text-xs font-semibold text-[#b6b5b5] transition-colors hover:text-white disabled:opacity-50"
          >
            {t('auth.forgotPassword')}
          </button>
          {legalCopy}
          {switchCopy}
        </form>
      );
    }

    if (step === 'registerProfile') {
      return (
        <form onSubmit={handleEmailAuthentication} className="space-y-4">
          <InlineNotice error={error} success={success} t={t} />
          <p className="truncate text-center text-xs text-[#b6b5b5]">{email}</p>
          <div className="space-y-3">
            <div>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
                <input
                  autoFocus
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  required
                  aria-invalid={hasFieldError(error?.fields || {}, 'displayName')}
                  className={iconInputClassName}
                />
              </div>
              {hasFieldError(error?.fields || {}, 'displayName') && error && <p className="mt-1.5 text-xs text-rose-300">{errorMessage(error, t)}</p>}
            </div>
            <div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('auth.createPasswordPlaceholder')}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  aria-invalid={hasFieldError(error?.fields || {}, 'password')}
                  className={iconInputClassName}
                />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-[#898888]">{t('auth.registerPasswordHint')}</p>
              {hasFieldError(error?.fields || {}, 'password') && error && <p className="mt-1.5 text-xs text-rose-300">{errorMessage(error, t)}</p>}
            </div>
          </div>
          <button type="submit" disabled={submitting || !displayNameIsValid || !registerPasswordIsValid} className={primaryButtonClassName}>
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? t('auth.creating') : t('auth.register')}
          </button>
          {legalCopy}
          {switchCopy}
        </form>
      );
    }

    if (step === 'resetEmail') {
      return (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <p className="text-center text-xs leading-relaxed text-[#b6b5b5]">{t('auth.resetHint')}</p>
          <InlineNotice error={error} success={success} t={t} />
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
              className={iconInputClassName}
            />
          </div>
          <button type="submit" disabled={submitting || !emailIsValid} className={primaryButtonClassName}>
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {submitting ? t('auth.sending') : t('auth.sendReset')}
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetConfirm} className="space-y-4">
        <InlineNotice error={error} success={success} t={t} />
        <div className="space-y-3">
          <input
            autoFocus
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            placeholder={t('auth.resetTokenPlaceholder')}
            autoComplete="one-time-code"
            required
            className={inputClassName}
          />
          <div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#898888]" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                className={iconInputClassName}
              />
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#898888]">{t('auth.registerPasswordHint')}</p>
          </div>
        </div>
        <button type="submit" disabled={submitting || !resetToken.trim() || !resetPasswordIsValid} className={primaryButtonClassName}>
          {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {submitting ? t('auth.submitting') : t('auth.updatePassword')}
        </button>
      </form>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mio-auth-overlay mobile-touch-modal safe-area-top fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/80 p-2 safe-area-bottom sm:p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
          onMouseDown={(event) => { if (event.currentTarget === event.target) requestClose(); }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="mio-auth-dialog mobile-modal-scroll relative my-auto max-h-[calc(100dvh-24px)] w-full overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#24242d] text-white shadow-[0_24px_80px_rgba(14,8,24,0.65)] sm:max-w-3xl sm:rounded-[30px]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: reduceMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid md:grid-cols-[0.82fr_1.18fr]">
              <div className="mio-auth-art relative hidden min-h-[460px] overflow-hidden bg-[#17131d] md:block">
                <img src="/mio/fresh-anime/nao.webp" alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" />
                <div className="mio-auth-brand"><strong>rulumi.ai</strong><p>{entryCopy(locale).welcome}</p></div>
              </div>
              <div className="flex flex-col p-4 sm:p-7 md:min-h-[460px]">
                <div className="mb-4 overflow-hidden rounded-2xl border border-pink-300/15 md:hidden">
                  <img src="/mio/fresh-anime/nao.webp" alt="" className="h-32 w-full object-cover object-[50%_28%]" decoding="async" />
                </div>
                <header className="relative mb-5 min-h-10 px-10 text-center">
              {step !== 'methods' && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={submitting}
                  className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-[#b6b5b5] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40"
                  aria-label={t('auth.back')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 id="auth-modal-title" className="text-2xl font-bold leading-[26px] text-white">
                {step.startsWith('reset') ? t('auth.reset') : title}
              </h2>
              {subtitle && <p className="mt-1.5 text-xs leading-relaxed text-[#b6b5b5]">{subtitle}</p>}
              <button
                ref={closeRef}
                type="button"
                onClick={requestClose}
                disabled={submitting}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40"
                aria-label={t('auth.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </header>

                {DESIGN_PREVIEW&&<div className="mio-auth-demo"><button disabled={submitting} onClick={async()=>{setSubmitting(true);try{const user=startPreviewSession();await completeAuthentication(user,'email')}catch{setError(entryCopy(locale).notConnected)}finally{setSubmitting(false)}}}>{entryCopy(locale).demo}</button><small>{entryCopy(locale).demoHint}</small></div>}
                <div className="flex flex-1 items-center py-2 md:py-5">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={step} className="w-full" {...stepMotion}>
                      {renderStep()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
