import type { Character, NavTab } from './types';

export const SITE_ORIGIN = (typeof window !== 'undefined' ? window.location.origin : 'https://rulumi.ai');
export const SEO_IMAGE_PATH = '/brand/pwa-512.png';

export const ROUTE_PATHS: Record<NavTab, string> = {
  profile: '/profile',
  explore: '/',
  chat: '/chat',
  create: '/create',
  generate: '/generate',
  'my-ai': '/my-ai',
  feed: '/feed',
  community: '/community',
  referral: '/referral',
  help: '/help',
  safety: '/safety',
};

const PATH_TO_TAB = new Map<string, NavTab>(
  Object.entries(ROUTE_PATHS).map(([tab, pathname]) => [pathname, tab as NavTab]),
);

export type AppRoute =
  | { kind: 'tab'; tab: NavTab }
  | { kind: 'character'; characterId: string };

export type SeoMetadata = {
  title: string;
  description: string;
  canonicalPath: string;
  robots: 'index,follow' | 'noindex,follow';
  imagePath?: string;
  jsonLd: Record<string, unknown>;
};

export type ServerSeoMetadata = SeoMetadata & {
  heading: string;
  body: string;
};

const PUBLIC_TABS = new Set<NavTab>(['explore', 'feed', 'community', 'help', 'safety']);

function normalizePathname(pathname: string) {
  const pathOnly = pathname.split(/[?#]/, 1)[0];
  if (!pathOnly || pathOnly === '/') return '/';
  const withoutTrailingSlash = pathOnly.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

export function isPublicDocumentPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  const tab = PATH_TO_TAB.get(normalized);
  if (tab) return PUBLIC_TABS.has(tab);
  return getRouteFromPath(normalized).kind === 'character';
}

export function getRouteFromPath(pathname: string): AppRoute {
  const normalized = normalizePathname(pathname);
  const tab = PATH_TO_TAB.get(normalized);
  if (tab) return { kind: 'tab', tab };

  const characterMatch = normalized.match(/^\/characters\/([^/]+)$/);
  if (characterMatch) {
    try {
      const characterId = decodeURIComponent(characterMatch[1]);
      if (characterId) return { kind: 'character', characterId };
    } catch {
      // Invalid URL encoding falls back to the explore route.
    }
  }

  return { kind: 'tab', tab: 'explore' };
}

export function getPathForTab(tab: NavTab) {
  return ROUTE_PATHS[tab];
}

export function getPathForCharacter(characterId: string) {
  return `/characters/${encodeURIComponent(characterId)}`;
}

export function getCanonicalUrl(pathname: string) {
  const route = getRouteFromPath(pathname);
  const path = route.kind === 'character' ? getPathForCharacter(route.characterId) : getPathForTab(route.tab);
  return `${SITE_ORIGIN}${path}`;
}

function jsonLdForPage(title: string, description: string, canonicalUrl: string, imageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Rulumi',
      url: SITE_ORIGIN,
    },
    image: imageUrl,
  };
}

export function createSeoMetadata({
  route,
  title,
  description,
  character,
}: {
  route: AppRoute;
  title: string;
  description: string;
  character?: Character | null;
}): SeoMetadata {
  const canonicalPath = route.kind === 'character'
    ? getPathForCharacter(route.characterId)
    : getPathForTab(route.tab);
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const imagePath = character?.avatarThumbnailLarge || character?.avatar || SEO_IMAGE_PATH;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${SITE_ORIGIN}${imagePath}`;
  const characterJsonLd = character
    ? {
      '@type': 'CreativeWork',
      name: character.name,
      description: character.displayDescription || character.description || character.subtitle,
      image: imageUrl,
      author: character.author ? { '@type': 'Person', name: character.author } : undefined,
    }
    : undefined;

  return {
    title,
    description,
    canonicalPath,
    robots: route.kind === 'character' && character?.source === 'created'
      ? 'noindex,follow'
      : route.kind === 'tab' && !PUBLIC_TABS.has(route.tab)
        ? 'noindex,follow'
        : 'index,follow',
    imagePath,
    jsonLd: {
      ...jsonLdForPage(title, description, canonicalUrl, imageUrl),
      ...(route.kind === 'tab' && route.tab === 'explore'
        ? { '@type': ['WebSite', 'WebPage'] }
        : {}),
      ...(characterJsonLd ? { mainEntity: characterJsonLd } : {}),
    },
  };
}

function staticPageCopy(route: AppRoute) {
  if (route.kind === 'character') {
    return {
      title: 'AI Character Profile | Rulumi',
      description: 'Discover this AI character and start a conversation on Rulumi.',
      heading: 'AI character profile',
      body: 'Discover this character and explore an interactive AI story on Rulumi.',
    };
  }

  switch (route.tab) {
    case 'feed':
      return {
        title: 'AI Character Feed | Rulumi',
        description: 'Explore new AI character videos and community creations on Rulumi.',
        heading: 'AI character feed',
        body: 'Explore videos and community creations from Rulumi creators.',
      };
    case 'community':
      return {
        title: 'AI Creator Community | Rulumi',
        description: 'Discover AI creator works, images, videos, and shared characters on Rulumi.',
        heading: 'AI creator community',
        body: 'Discover shared characters and creative works from the Rulumi community.',
      };
    case 'help':
      return {
        title: 'Help Center | Rulumi',
        description: 'Find answers and guidance for creating characters, chatting, and using Rulumi.',
        heading: 'Rulumi help center',
        body: 'Find guidance for creating characters, chatting, and using Rulumi.',
      };
    case 'safety':
      return {
        title: 'Trust and Safety | Rulumi',
        description: 'Read Rulumi safety policies, community guidelines, and privacy information.',
        heading: 'Trust and safety',
        body: 'Read official safety policies and community standards for Rulumi.',
      };
    case 'chat':
      return {
        title: 'Chat with AI Characters | Rulumi',
        description: 'Continue private conversations with AI characters on Rulumi.',
        heading: 'Chat with AI characters',
        body: 'Continue your private AI character conversations.',
      };
    case 'create':
      return {
        title: 'Create an AI Character | Rulumi',
        description: 'Create a custom AI character and build an original story on Rulumi.',
        heading: 'Create an AI character',
        body: 'Build a custom AI character and an original interactive story.',
      };
    case 'generate':
      return {
        title: 'Generate AI Character Media | Rulumi',
        description: 'Generate character images and creative media with Rulumi.',
        heading: 'Generate AI character media',
        body: 'Generate character images and creative media with Rulumi.',
      };
    case 'my-ai':
      return {
        title: 'My AI Characters | Rulumi',
        description: 'Manage your created, favorite, and chatting AI characters on Rulumi.',
        heading: 'My AI characters',
        body: 'Manage your created, favorite, and chatting AI characters.',
      };
    case 'referral':
      return {
        title: 'Rulumi Rewards | Rulumi',
        description: 'Manage your Rulumi referral rewards and account benefits.',
        heading: 'Rulumi rewards',
        body: 'Manage referral rewards and account benefits.',
      };
    case 'explore':
    default:
      return {
        title: 'Discover AI Characters | Rulumi',
        description: 'Discover, create, and chat with AI characters on Rulumi.',
        heading: 'Discover AI characters',
        body: 'Discover, create, and chat with AI characters on Rulumi.',
      };
  }
}

export function getServerSeoMetadata(pathname: string): ServerSeoMetadata {
  const route = getRouteFromPath(pathname);
  const copy = staticPageCopy(route);
  const metadata = createSeoMetadata({ route, ...copy });
  return { ...metadata, heading: copy.heading, body: copy.body };
}

function absoluteImageUrl(imagePath: string) {
  return imagePath.startsWith('http') ? imagePath : `${SITE_ORIGIN}${imagePath}`;
}

function upsertMeta(name: string, value: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(`[data-lurova-seo="${name}"]`) || document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    if (property) element.setAttribute('property', name);
    else element.setAttribute('name', name);
    element.dataset.lurovaSeo = name;
    document.head.appendChild(element);
  }
  element.content = value;
}

export function applySeoMetadata(metadata: SeoMetadata) {
  const canonicalUrl = `${SITE_ORIGIN}${metadata.canonicalPath}`;
  const imageUrl = absoluteImageUrl(metadata.imagePath || SEO_IMAGE_PATH);
  document.title = metadata.title;

  upsertMeta('description', metadata.description);
  upsertMeta('robots', metadata.robots);
  upsertMeta('og:type', 'website', true);
  upsertMeta('og:site_name', 'Rulumi', true);
  upsertMeta('og:title', metadata.title, true);
  upsertMeta('og:description', metadata.description, true);
  upsertMeta('og:url', canonicalUrl, true);
  upsertMeta('og:image', imageUrl, true);
  upsertMeta('twitter:card', 'summary_large_image');
  upsertMeta('twitter:title', metadata.title);
  upsertMeta('twitter:description', metadata.description);
  upsertMeta('twitter:image', imageUrl);

  let canonical = document.head.querySelector<HTMLLinkElement>('[data-lurova-seo="canonical"]');
  if (!canonical) {
    canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') || document.createElement('link');
    canonical.rel = 'canonical';
    canonical.dataset.lurovaSeo = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  let jsonLd = document.head.querySelector<HTMLScriptElement>('[data-lurova-seo="jsonld"]');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.dataset.lurovaSeo = 'jsonld';
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify(metadata.jsonLd);
}
