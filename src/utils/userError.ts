export type UserErrorTranslate = (key: string, params?: Record<string, string | number>) => string;

const USER_ERROR_KEYS: Record<string, string> = {
  PREVIEW_UNAVAILABLE: 'mio.preview',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  ACCOUNT_SUSPENDED: 'auth.accountSuspended',
  EMAIL_ALREADY_EXISTS: 'auth.emailExists',
  WEAK_PASSWORD: 'auth.weakPassword',
  GOOGLE_TOKEN_INVALID: 'auth.googleTokenInvalid',
  GOOGLE_EMAIL_UNVERIFIED: 'auth.googleEmailUnverified',
  ACCOUNT_LINK_REQUIRED: 'auth.accountLinkRequired',
  ADULT_CONFIRMATION_REQUIRED: 'auth.adultRequired',
  PASSWORD_RESET_TOKEN_INVALID: 'auth.resetTokenInvalid',
  CSRF_FAILED: 'auth.csrfFailed',
  THROTTLED: 'auth.throttled',
  RATE_LIMITED: 'auth.throttled',
  GOOGLE_UNAVAILABLE: 'auth.googleUnavailable',
  MEMBERSHIP_REQUIRED: 'generator.membershipRequired',
  INSUFFICIENT_CREDITS: 'create.errorInsufficientCredits',
  GENERATION_BUSY: 'create.errorRateLimited',
  GENERATION_CONCURRENCY_LIMIT: 'create.errorRateLimited',
  UPSTREAM_TIMEOUT: 'create.errorUpstreamTimeout',
  UPSTREAM_UNAVAILABLE: 'create.errorUpstreamUnavailable',
  UPSTREAM_INVALID_RESPONSE: 'create.errorUpstreamInvalidResponse',
  UPSTREAM_REJECTED: 'create.errorUpstreamRejected',
  UPSTREAM_GENERATION_FAILED: 'create.errorUpstreamGenerationFailed',
  UPSTREAM_MEDIA_UNAVAILABLE: 'create.errorUpstreamMediaUnavailable',
  UPSTREAM_SENSITIVE_CONTENT: 'create.errorSensitiveContent',
};

const errorCode = (reason: unknown) => reason && typeof reason === 'object' && 'code' in reason
  && typeof reason.code === 'string' ? reason.code : '';

const errorStatus = (reason: unknown) => reason && typeof reason === 'object' && 'status' in reason
  && typeof reason.status === 'number' ? reason.status : 0;

const isNativeNetworkError = (reason: unknown) => reason instanceof TypeError
  || (typeof DOMException !== 'undefined' && reason instanceof DOMException && reason.name === 'NetworkError');

export function userErrorCodeMessage(
  code: string | null | undefined,
  translate: UserErrorTranslate,
  fallbackKey: string,
  status = 0,
) {
  const key = (code && USER_ERROR_KEYS[code])
    || (status === 429 ? 'auth.throttled' : status >= 500 && status <= 599 ? 'common.unknownError' : fallbackKey);
  return translate(key);
}

export function userErrorMessage(
  reason: unknown,
  translate: UserErrorTranslate,
  fallbackKey: string,
) {
  if (isNativeNetworkError(reason)) return translate('common.unknownError');
  return userErrorCodeMessage(errorCode(reason), translate, fallbackKey, errorStatus(reason));
}
