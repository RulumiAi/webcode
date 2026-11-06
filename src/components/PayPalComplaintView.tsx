import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { api, ApiError, type ApiUser } from '../api';
import { useLocale } from '../i18n';
import { formatLocalDate } from '../utils/localDate';


type ComplaintType =
  | 'serviceNotReceived'
  | 'duplicateCharge'
  | 'incorrectAmount'
  | 'refundNotReceived'
  | 'unauthorizedTransaction'
  | 'other';

type DesiredResolution = 'refund' | 'chargeCorrection' | 'serviceDelivery' | 'explanation' | 'other';

type ComplaintForm = {
  complaintType: ComplaintType | '';
  paypalTransactionId: string;
  paymentDate: string;
  amount: string;
  currency: string;
  contactEmail: string;
  desiredResolution: DesiredResolution | '';
  details: string;
};

type FieldName = keyof ComplaintForm;
type FieldErrors = Partial<Record<FieldName, string>>;

interface PayPalComplaintViewProps {
  user: ApiUser | null;
  onRequireAuth: () => void;
}

const today = () => formatLocalDate();

const emptyForm = (email = ''): ComplaintForm => ({
  complaintType: '',
  paypalTransactionId: '',
  paymentDate: '',
  amount: '',
  currency: '',
  contactEmail: email,
  desiredResolution: '',
  details: '',
});

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export const PayPalComplaintView: React.FC<PayPalComplaintViewProps> = ({ user, onRequireAuth }) => {
  const { t } = useLocale();
  const [form, setForm] = useState<ComplaintForm>(() => emptyForm(user?.email));
  const [emailEdited, setEmailEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (user?.email && !emailEdited) {
      setForm((current) => ({ ...current, contactEmail: user.email }));
    }
  }, [emailEdited, user?.email]);

  const updateField = (field: FieldName, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
    if (field === 'contactEmail') setEmailEdited(true);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.complaintType) errors.complaintType = t('help.paypalComplaint.required');
    if (!form.paypalTransactionId.trim()) errors.paypalTransactionId = t('help.paypalComplaint.required');
    if (!form.paymentDate) errors.paymentDate = t('help.paypalComplaint.required');
    if (form.paymentDate && form.paymentDate > today()) errors.paymentDate = t('help.paypalComplaint.dateFuture');
    if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errors.amount = t('help.paypalComplaint.amountInvalid');
    }
    if (!/^[A-Z]{3}$/.test(form.currency.trim().toUpperCase())) {
      errors.currency = t('help.paypalComplaint.currencyInvalid');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      errors.contactEmail = t('help.paypalComplaint.emailInvalid');
    }
    if (!form.desiredResolution) errors.desiredResolution = t('help.paypalComplaint.required');
    if (!form.details.trim()) errors.details = t('help.paypalComplaint.required');
    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setSubmitError(t('help.paypalComplaint.validationError'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});
    try {
      await api.support.paypalComplaint({
        complaintType: form.complaintType as ComplaintType,
        paypalTransactionId: form.paypalTransactionId.trim(),
        paymentDate: form.paymentDate,
        amount: form.amount,
        currency: form.currency.trim().toUpperCase(),
        contactEmail: form.contactEmail.trim(),
        desiredResolution: form.desiredResolution as DesiredResolution,
        details: form.details.trim(),
      });
      setSubmittedSuccess(true);
    } catch (reason) {
      if (reason instanceof ApiError && Object.keys(reason.fields).length) {
        const localizedFields: FieldErrors = {};
        Object.keys(reason.fields).forEach((field) => {
          localizedFields[field as FieldName] = t('help.paypalComplaint.invalidField');
        });
        setFieldErrors(localizedFields);
        setSubmitError(t('help.paypalComplaint.validationError'));
      } else {
        setSubmitError(t('help.paypalComplaint.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (field: FieldName) =>
    'mt-1.5 w-full rounded-xl border bg-[#0a111d] px-3.5 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#4aa8e8]/70 ' +
    (fieldErrors[field]
      ? 'border-rose-400/80 focus-visible:border-rose-300'
      : 'border-slate-700/80 focus-visible:border-[#4aa8e8]');

  const complaintTypes: Array<{ value: ComplaintType; label: string }> = [
    { value: 'serviceNotReceived', label: t('help.paypalComplaint.typeServiceNotReceived') },
    { value: 'duplicateCharge', label: t('help.paypalComplaint.typeDuplicateCharge') },
    { value: 'incorrectAmount', label: t('help.paypalComplaint.typeIncorrectAmount') },
    { value: 'refundNotReceived', label: t('help.paypalComplaint.typeRefundNotReceived') },
    { value: 'unauthorizedTransaction', label: t('help.paypalComplaint.typeUnauthorizedTransaction') },
    { value: 'other', label: t('help.paypalComplaint.typeOther') },
  ];

  const resolutions: Array<{ value: DesiredResolution; label: string }> = [
    { value: 'refund', label: t('help.paypalComplaint.resolutionRefund') },
    { value: 'chargeCorrection', label: t('help.paypalComplaint.resolutionCorrection') },
    { value: 'serviceDelivery', label: t('help.paypalComplaint.resolutionDelivery') },
    { value: 'explanation', label: t('help.paypalComplaint.resolutionExplanation') },
    { value: 'other', label: t('help.paypalComplaint.resolutionOther') },
  ];

  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-3xl border border-[#1d527e]/60 bg-[#0b1220] shadow-2xl shadow-[#003087]/10 lg:grid-cols-[minmax(250px,0.78fr)_minmax(0,1.22fr)]">
      <aside className="border-b border-[#1d527e]/40 bg-gradient-to-b from-[#071a32] to-[#0b1220] p-6 sm:p-8 lg:border-b-0 lg:border-r">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#003087] text-white shadow-lg shadow-[#003087]/30">
            <CreditCard className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#75c9f2]">PayPal payment</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-white">{t('help.paypalComplaint.sideTitle')}</h2>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-300">{t('help.paypalComplaint.sideDescription')}</p>

        <div className="mt-7 space-y-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#75c9f2]" aria-hidden="true" />
            <p className="text-sm leading-5 text-slate-300">{t('help.paypalComplaint.prepareTransaction')}</p>
          </div>
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#75c9f2]" aria-hidden="true" />
            <p className="text-sm leading-5 text-slate-300">{t('help.paypalComplaint.neverShare')}</p>
          </div>
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#75c9f2]" aria-hidden="true" />
            <p className="text-sm leading-5 text-slate-300">{t('help.paypalComplaint.contactHint')}</p>
          </div>
        </div>
      </aside>

      <div className="bg-[#0f1a2b] p-5 sm:p-8">
        {!user ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#003087]/40 text-[#75c9f2]">
              <LockKeyhole className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-black text-white">{t('help.paypalComplaint.signInTitle')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">{t('help.paypalComplaint.signInDescription')}</p>
            <button
              type="button"
              onClick={onRequireAuth}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0878bd] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#003087]/30 transition hover:bg-[#0a8edb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75c9f2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2b]"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {t('help.paypalComplaint.signInButton')}
            </button>
          </div>
        ) : submittedSuccess ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-black text-white">{t('help.paypalComplaint.successTitle')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">{t('help.paypalComplaint.successDescription')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-7">
            <div>
              <h2 className="text-xl font-black text-white">{t('help.paypalComplaint.formTitle')}</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">{t('help.paypalComplaint.formDescription')}</p>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-950/30 px-3.5 py-3 text-sm text-rose-100" role="alert" aria-live="assertive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <fieldset className="space-y-4">
              <legend className="text-sm font-extrabold text-[#9ddcfa]">{t('help.paypalComplaint.transactionSection')}</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="paypal-transaction-id" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.transactionId')} <span aria-hidden="true">*</span></label>
                  <input
                    id="paypal-transaction-id"
                    value={form.paypalTransactionId}
                    onChange={(event) => updateField('paypalTransactionId', event.target.value)}
                    className={fieldClass('paypalTransactionId')}
                    maxLength={128}
                    autoComplete="off"
                    aria-invalid={Boolean(fieldErrors.paypalTransactionId)}
                  />
                  <p id="paypal-transaction-hint" className="mt-1.5 text-xs leading-5 text-slate-400">{t('help.paypalComplaint.transactionIdHint')}</p>
                  <FieldError message={fieldErrors.paypalTransactionId} />
                </div>

                <div>
                  <label htmlFor="paypal-payment-date" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.paymentDate')} <span aria-hidden="true">*</span></label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      id="paypal-payment-date"
                      type="date"
                      value={form.paymentDate}
                      max={today()}
                      onChange={(event) => updateField('paymentDate', event.target.value)}
                      className={fieldClass('paymentDate') + ' pl-10'}
                      aria-invalid={Boolean(fieldErrors.paymentDate)}
                      aria-describedby={fieldErrors.paymentDate ? "paypal-payment-date-error" : undefined}
                      required
                    />
                  </div>
                  <FieldError id="paypal-payment-date-error" message={fieldErrors.paymentDate} />
                </div>

                <div>
                  <label htmlFor="paypal-amount" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.amount')} <span aria-hidden="true">*</span></label>
                  <input
                    id="paypal-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => updateField('amount', event.target.value)}
                    className={fieldClass('amount')}
                    aria-invalid={Boolean(fieldErrors.amount)}
                  />
                  <FieldError message={fieldErrors.amount} />
                </div>

                <div>
                  <label htmlFor="paypal-currency" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.currency')} <span aria-hidden="true">*</span></label>
                  <input
                    id="paypal-currency"
                    value={form.currency}
                    maxLength={3}
                    onChange={(event) => updateField('currency', event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())}
                    className={fieldClass('currency')}
                    autoComplete="off"
                    placeholder="USD"
                    aria-invalid={Boolean(fieldErrors.currency)}
                  />
                  <FieldError message={fieldErrors.currency} />
                </div>

                <div>
                  <label htmlFor="paypal-complaint-type" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.complaintType')} <span aria-hidden="true">*</span></label>
                  <select
                    id="paypal-complaint-type"
                    value={form.complaintType}
                    onChange={(event) => updateField('complaintType', event.target.value)}
                    className={fieldClass('complaintType')}
                    aria-invalid={Boolean(fieldErrors.complaintType)}
                  >
                    <option value="">{t('help.paypalComplaint.selectPlaceholder')}</option>
                    {complaintTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <FieldError message={fieldErrors.complaintType} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-extrabold text-[#9ddcfa]">{t('help.paypalComplaint.complaintSection')}</legend>
              <div>
                <label htmlFor="paypal-resolution" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.desiredResolution')} <span aria-hidden="true">*</span></label>
                <select
                  id="paypal-resolution"
                  value={form.desiredResolution}
                  onChange={(event) => updateField('desiredResolution', event.target.value)}
                  className={fieldClass('desiredResolution')}
                  aria-invalid={Boolean(fieldErrors.desiredResolution)}
                >
                  <option value="">{t('help.paypalComplaint.selectPlaceholder')}</option>
                  {resolutions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <FieldError message={fieldErrors.desiredResolution} />
              </div>

              <div>
                <label htmlFor="paypal-contact-email" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.contactEmail')} <span aria-hidden="true">*</span></label>
                <input
                  id="paypal-contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  className={fieldClass('contactEmail')}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.contactEmail)}
                />
                <FieldError message={fieldErrors.contactEmail} />
              </div>

              <div>
                <label htmlFor="paypal-details" className="text-sm font-semibold text-slate-200">{t('help.paypalComplaint.details')} <span aria-hidden="true">*</span></label>
                <textarea
                  id="paypal-details"
                  rows={5}
                  maxLength={4000}
                  value={form.details}
                  onChange={(event) => updateField('details', event.target.value)}
                  className={fieldClass('details') + ' resize-y'}
                  aria-invalid={Boolean(fieldErrors.details)}
                  placeholder={t('help.paypalComplaint.detailsPlaceholder')}
                />
                <div className="mt-1.5 flex justify-between gap-3 text-xs text-slate-400">
                  <span>{t('help.paypalComplaint.detailsHint')}</span>
                  <span className="shrink-0 tabular-nums">{form.details.length}/4000</span>
                </div>
                <FieldError message={fieldErrors.details} />
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0878bd] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#003087]/30 transition hover:bg-[#0a8edb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#75c9f2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a2b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? t('help.paypalComplaint.submitting') : t('help.paypalComplaint.submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};