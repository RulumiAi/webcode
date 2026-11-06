export type ApiCacheTag =
  | 'catalog'
  | 'characters'
  | 'comments'
  | 'feed'
  | 'creators'
  | 'favorites'
  | 'following'
  | 'created'
  | 'generation'
  | 'chat'
  | 'notifications'
  | 'credits'
  | 'payments'
  | 'profile'
  | 'reports';

export type ApiCacheMode = 'network' | 'public' | 'private' | 'volatile';

export type ApiRequestPolicy = {
  mode: ApiCacheMode;
  credentials: RequestCredentials;
  ttlMs: number;
  tags: ApiCacheTag[];
};

const API_PREFIX = '/api/env1/v1';
const STATIC_PUBLIC_ROUTES = new Map([
  ['/characters/discovery/', {tags: ['characters'] as ApiCacheTag[], ttlMs: 0}],
  ['/meta/character-filter-tags/', {tags: ['catalog'] as ApiCacheTag[], ttlMs: 0}],
  ['/meta/generation-options/', {tags: ['catalog'] as ApiCacheTag[], ttlMs: 0}],
  ['/payments/catalog/', {tags: ['catalog', 'payments'] as ApiCacheTag[], ttlMs: 0}],
]);

const DYNAMIC_PUBLIC_ROUTES: Array<[RegExp, ApiCacheTag[]]> = [
  [/^\/characters\/$/, ['characters']],
  [/^\/characters\/[^/]+\/$/, ['characters']],
  [/^\/characters\/[^/]+\/comments\/$/, ['comments', 'characters']],
  [/^\/comments\/[^/]+\/replies\/$/, ['comments']],
  [/^\/feed\/posts\/$/, ['feed']],
  [/^\/feed\/posts\/[^/]+\/$/, ['feed']],
  [/^\/creators\/$/, ['creators']],
  [/^\/creators\/[^/]+\/$/, ['creators']],
  [/^\/creators\/[^/]+\/characters\/$/, ['creators', 'characters']],
  [/^\/creators\/[^/]+\/dynamics\/$/, ['creators', 'feed']],
];

function relativePath(value: string) {
  const pathname = new URL(value, 'https://soulmingle.invalid').pathname;
  return pathname.startsWith(API_PREFIX) ? pathname.slice(API_PREFIX.length) || '/' : pathname;
}

function dynamicPublicTags(pathname: string) {
  return DYNAMIC_PUBLIC_ROUTES.find(([pattern]) => pattern.test(pathname))?.[1] || null;
}

function privateTags(pathname: string): ApiCacheTag[] {
  if (pathname.startsWith('/users/me/favorites/')) return ['favorites', 'characters'];
  if (pathname.startsWith('/users/me/following/')) return ['following', 'creators'];
  if (pathname.startsWith('/users/me/')) return ['profile'];
  if (pathname.startsWith('/ai-characters/')) return ['created'];
  if (pathname.startsWith('/generation/targets/')) return ['generation', 'characters', 'created'];
  if (pathname.startsWith('/generation/')) return ['generation'];
  if (pathname.startsWith('/chat/') || pathname.startsWith('/ai-chat/')) return ['chat'];
  if (pathname.startsWith('/notifications/')) return ['notifications'];
  if (pathname.startsWith('/credits/')) return ['credits'];
  if (pathname.startsWith('/payments/')) return ['payments'];
  if (pathname.includes('/appeals/') || pathname.includes('/reports/')) return ['reports'];
  return [];
}

function isVolatilePrivate(pathname: string) {
  return pathname.startsWith('/generation/jobs/')
    || pathname.includes('/payments/orders/')
    || pathname.includes('/voice-previews/')
    || pathname.includes('/messages/') && pathname.endsWith('/audio/')
    || pathname.endsWith('/wizard/name-availability/')
    || pathname === '/auth/session/';
}

export function apiRequestPolicy(
  value: string,
  method: string,
  authenticatedUserId: string | null | undefined,
): ApiRequestPolicy {
  const normalizedMethod = method.toUpperCase();
  const pathname = relativePath(value);
  if (!['GET', 'HEAD'].includes(normalizedMethod)) {
    return {mode: 'network', credentials: 'include', ttlMs: 0, tags: mutationTagsForPath(pathname)};
  }

  if (pathname === '/characters/personalization/') {
    return {mode: 'volatile', credentials: 'include', ttlMs: 0, tags: ['characters', 'favorites']};
  }

  const staticRoute = STATIC_PUBLIC_ROUTES.get(pathname);
  if (staticRoute) return {mode: 'public', credentials: 'omit', ttlMs: staticRoute.ttlMs, tags: staticRoute.tags};

  const publicTags = dynamicPublicTags(pathname);
  if (publicTags && authenticatedUserId === null) {
    return {mode: 'public', credentials: 'omit', ttlMs: 0, tags: publicTags};
  }

  if (pathname.startsWith('/auth/')) {
    return {mode: 'network', credentials: 'include', ttlMs: 0, tags: ['profile']};
  }

  const tags = publicTags || privateTags(pathname);
  if (isVolatilePrivate(pathname)) {
    return {mode: 'volatile', credentials: 'include', ttlMs: 0, tags};
  }
  return {mode: 'private', credentials: 'include', ttlMs: 0, tags};
}

export function mutationTagsForPath(value: string): ApiCacheTag[] {
  const pathname = relativePath(value);
  if (pathname.startsWith('/characters/') && pathname.includes('/comments')) return ['comments', 'characters'];
  if (pathname.startsWith('/comments/')) return ['comments', 'characters'];
  if (pathname.startsWith('/characters/')) {
    return pathname.includes('/favorite/')
      ? ['characters', 'favorites', 'creators']
      : ['characters', 'creators', 'generation'];
  }
  if (pathname.startsWith('/feed/')) return ['feed', 'creators'];
  if (pathname.startsWith('/creators/') && pathname.includes('/follow/')) return ['creators', 'following'];
  if (pathname.startsWith('/ai-characters/')) return ['created', 'generation'];
  if (pathname.startsWith('/generation/')) return ['generation', 'credits'];
  if (pathname.startsWith('/chat/') || pathname.startsWith('/ai-chat/')) return ['chat', 'generation', 'credits'];
  if (pathname.startsWith('/notifications/')) return ['notifications'];
  if (pathname.startsWith('/credits/')) return ['credits'];
  if (pathname.startsWith('/payments/')) return ['payments', 'credits'];
  if (pathname.startsWith('/users/me/')) return ['profile', 'creators'];
  if (pathname.includes('/appeals/') || pathname.includes('/reports/')) return ['reports'];
  if (pathname.startsWith('/media/')) return ['characters', 'feed', 'profile', 'created', 'generation'];
  return [];
}

export function publicApiTagsForUrl(value: string) {
  const pathname = relativePath(value);
  return STATIC_PUBLIC_ROUTES.get(pathname)?.tags || dynamicPublicTags(pathname);
}

export function isPublicApiPath(value: string) {
  return Boolean(publicApiTagsForUrl(value));
}
