import { isPublicDocumentPath } from './seo';

export const PUBLIC_HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=60';
export const PRIVATE_HTML_CACHE_CONTROL = 'private, no-store';

export function getHtmlCacheControl(pathname: string) {
  return isPublicDocumentPath(pathname)
    ? PUBLIC_HTML_CACHE_CONTROL
    : PRIVATE_HTML_CACHE_CONTROL;
}
