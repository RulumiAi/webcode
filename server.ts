import express from "express";
import compression from "compression";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getHtmlCacheControl, PRIVATE_HTML_CACHE_CONTROL } from "./src/htmlCachePolicy";
import { getServerSeoMetadata } from "./src/seo";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type HomeBootstrapMedia = {
  id: string;
  url: string;
  mediaType: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  thumbnailLargeUrl: string | null;
};

type HomeBootstrapCharacter = {
  id: string;
  name: string;
  age: number | null;
  ageStatus: string;
  style: string | null;
  gender: string | null;
  relationship: string | null;
  displayDescription: string;
  firstMes: string;
  voice: string;
  tags: string[];
  displayTags: string[];
  filterTags: Array<{ slug: string; label: string }>;
  creator: { id: string; displayName: string; handle: string; privateProfile: boolean; avatar: null };
  favoriteCount: number;
  chatCount: number;
  commentCount: number;
  favoritedByMe: false;
  cardPreview: { image: HomeBootstrapMedia | null; video: HomeBootstrapMedia | null };
};

type HomeDiscoveryBootstrap = {
  items: HomeBootstrapCharacter[];
  total: number;
  page: 1;
  pageSize: number;
};

const HOME_BOOTSTRAP_CACHE_MS = 30_000;
let homeBootstrapCache: { expiresAt: number; value: HomeDiscoveryBootstrap | null } = { expiresAt: 0, value: null };
let homeBootstrapRequest: Promise<HomeDiscoveryBootstrap | null> | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function compactText(value: unknown, maxLength: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function compactStringArray(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, maxItems).map((item) => compactText(item, maxLength))
    : [];
}

function normalizeMediaUrl(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  try {
    const parsed = new URL(value, "http://127.0.0.1");
    if (parsed.pathname.startsWith("/api/env1/v1/media/")) return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "";
  }
  return value;
}

function compactMedia(value: unknown): HomeBootstrapMedia | null {
  const media = asRecord(value);
  if (!media) return null;
  const url = normalizeMediaUrl(media.url);
  if (!url) return null;
  return {
    id: typeof media.id === "string" ? media.id : "",
    url,
    mediaType: typeof media.mediaType === "string" ? media.mediaType : "image",
    durationSeconds: typeof media.durationSeconds === "number" ? media.durationSeconds : null,
    thumbnailUrl: normalizeMediaUrl(media.thumbnailUrl) || null,
    thumbnailLargeUrl: normalizeMediaUrl(media.thumbnailLargeUrl) || null,
  };
}

function compactHomeCharacter(value: unknown): HomeBootstrapCharacter | null {
  const source = asRecord(value);
  const cardPreview = asRecord(source?.cardPreview);
  const image = compactMedia(cardPreview?.image);
  if (!source || typeof source.id !== "string" || typeof source.name !== "string" || !image) return null;
  const creator = asRecord(source.creator);
  const filterTags = Array.isArray(source.filterTags)
    ? source.filterTags.map(asRecord).filter((tag): tag is Record<string, unknown> => Boolean(tag && typeof tag.slug === "string"))
      .slice(0, 16).map((tag) => ({ slug: tag.slug as string, label: compactText(tag.label, 80) }))
    : [];
  return {
    id: source.id,
    name: compactText(source.name, 120),
    age: typeof source.age === "number" ? source.age : null,
    ageStatus: typeof source.ageStatus === "string" ? source.ageStatus : "known",
    style: typeof source.style === "string" ? source.style : null,
    gender: typeof source.gender === "string" ? source.gender : null,
    relationship: typeof source.relationship === "string" ? compactText(source.relationship, 120) : null,
    displayDescription: compactText(source.displayDescription, 320),
    firstMes: compactText(source.firstMes, 320),
    voice: compactText(source.voice, 120),
    tags: compactStringArray(source.tags, 16, 80),
    displayTags: compactStringArray(source.displayTags, 16, 80),
    filterTags,
    creator: {
      id: typeof creator?.id === "string" ? creator.id : "",
      displayName: compactText(creator?.displayName, 120),
      handle: compactText(creator?.handle, 120),
      privateProfile: Boolean(creator?.privateProfile),
      avatar: null,
    },
    favoriteCount: typeof source.favoriteCount === "number" ? source.favoriteCount : 0,
    chatCount: typeof source.chatCount === "number" ? source.chatCount : 0,
    commentCount: typeof source.commentCount === "number" ? source.commentCount : 0,
    favoritedByMe: false,
    cardPreview: {
      image,
      video: compactMedia(cardPreview?.video),
    },
  };
}

function getBootstrapApiTarget() {
  const configured = process.env.ENV1_BOOTSTRAP_API_BASE_URL || process.env.APP_BASE_URL || "http://127.0.0.1:8000";
  const base = configured.replace(/\/$/, "");
  const baseUrl = base.endsWith("/api/env1/v1") ? base : `${base}/api/env1/v1`;
  const host = process.env.ENV1_BOOTSTRAP_API_HOST
    || (process.env.ENV1_BOOTSTRAP_API_BASE_URL || process.env.APP_BASE_URL
      ? new URL(base).host
      : "api.lurova.ai");
  return { baseUrl, host };
}

async function loadHomeDiscoveryBootstrap(): Promise<HomeDiscoveryBootstrap | null> {
  try {
    const target = getBootstrapApiTarget();
    const response = await fetch(`${target.baseUrl}/characters/discovery/?sort=trending&page=1&pageSize=20`, {
      headers: { Accept: "application/json", "Accept-Language": "en", Host: target.host },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const payload = asRecord(await response.json());
    const items = Array.isArray(payload?.items)
      ? payload.items.map(compactHomeCharacter).filter((item): item is HomeBootstrapCharacter => Boolean(item))
      : [];
    if (!items.length) return null;
    return {
      items,
      total: typeof payload?.total === "number" ? payload.total : items.length,
      page: 1,
      pageSize: 20,
    };
  } catch {
    return null;
  }
}

async function getHomeDiscoveryBootstrap() {
  const now = Date.now();
  if (homeBootstrapCache.expiresAt > now) return homeBootstrapCache.value;
  if (!homeBootstrapRequest) {
    homeBootstrapRequest = loadHomeDiscoveryBootstrap()
      .then((value) => {
        homeBootstrapCache = { expiresAt: Date.now() + HOME_BOOTSTRAP_CACHE_MS, value };
        return value;
      })
      .finally(() => { homeBootstrapRequest = null; });
  }
  return homeBootstrapRequest;
}

function safeJsonForHtml(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function renderHomeBootstrapMarkup(bootstrap: HomeDiscoveryBootstrap) {
  const imageUrls = [...new Set(bootstrap.items.slice(0, 2).map((item) => item.cardPreview.image?.thumbnailUrl || item.cardPreview.image?.url).filter(Boolean))];
  const preloads = imageUrls.map((url) => `<link rel="preload" as="image" href="${escapeHtml(url as string)}" fetchpriority="high" />`).join("");
  return `${preloads}<script type="application/json" id="lurova-home-bootstrap">${safeJsonForHtml(bootstrap)}</script>`;
}

async function renderIndexHtml(template: string, pathname: string) {
  const seo = getServerSeoMetadata(pathname);
  const jsonLd = JSON.stringify(seo.jsonLd).replaceAll("<", "\\u003c");
  const escapedTitle = escapeHtml(seo.title);
  const escapedDescription = escapeHtml(seo.description);
  const escapedCanonical = escapeHtml(`https://lurova.ai${seo.canonicalPath}`);
  const escapedHeading = escapeHtml(seo.heading);
  const escapedBody = escapeHtml(seo.body);
  const bootstrap = process.env.NODE_ENV === "production" && pathname === '/'
    ? await getHomeDiscoveryBootstrap()
    : null;
  const bootstrapMarkup = bootstrap ? renderHomeBootstrapMarkup(bootstrap) : "";
  return template
    .replace(/<\/head>/i, `${bootstrapMarkup}</head>`)
    .replace(/(<title[^>]*data-lurova-seo="title"[^>]*>)[\s\S]*?(<\/title>)/i, `$1${escapedTitle}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="description"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedDescription}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="robots"[^>]*content=")[^"]*("[^>]*>)/i, `$1${seo.robots}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="og:title"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedTitle}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="og:description"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedDescription}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="og:url"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedCanonical}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="twitter:title"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedTitle}$2`)
    .replace(/(<meta[^>]*data-lurova-seo="twitter:description"[^>]*content=")[^"]*("[^>]*>)/i, `$1${escapedDescription}$2`)
    .replace(/(<link[^>]*data-lurova-seo="canonical"[^>]*href=")[^"]*("[^>]*>)/i, `$1${escapedCanonical}$2`)
    .replace(/(<h1[^>]*data-lurova-seo="fallback-heading"[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${escapedHeading}$2`)
    .replace(/(<p[^>]*data-lurova-seo="fallback-body"[^>]*>)[\s\S]*?(<\/p>)/i, `$1${escapedBody}$2`)
    .replace(/(<script[^>]*data-lurova-seo="jsonld"[^>]*>)[\s\S]*?(<\/script>)/i, `$1${jsonLd}$2`);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.disable("x-powered-by");
  const isDevelopment = process.env.NODE_ENV !== "production";

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self'${isDevelopment ? " 'unsafe-inline'" : ""} https://accounts.google.com`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws://127.0.0.1:24678 ws://localhost:24678" : ""} https://accounts.google.com https://api.lurova.ai`,
    "frame-src 'self' https://accounts.google.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ].join("; ");

  app.use((_req, res, next) => {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  if (process.env.NODE_ENV === "production") {
    app.use(compression({ threshold: 1024 }));
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    const indexTemplate = fs.readFileSync(indexPath, "utf8");
    app.use((req, _res, next) => {
      if (!req.url.startsWith("/create-character/")) return next();
      const [pathname] = req.url.split("?", 2);
      try {
        const decodedPath = decodeURIComponent(pathname);
        const candidate = path.resolve(distPath, `.${decodedPath}`);
        const root = path.resolve(distPath) + path.sep;
        if (!candidate.startsWith(root) || !fs.statSync(candidate).isFile()) return _res.status(404).end();
        const relativePath = `/${path.relative(distPath, candidate).replaceAll(path.sep, "/")}`;
        _res.setHeader(
          "Cache-Control",
          /^\/(?:create-character|generator)\/assets\/v\d+\//.test(relativePath)
            ? "public, max-age=31536000, immutable"
            : "public, max-age=0, must-revalidate",
        );
        if (/\.(mp4|webm|mov)$/i.test(relativePath)) _res.setHeader("Accept-Ranges", "bytes");
        return _res.sendFile(candidate);
      } catch {
        return _res.status(404).end();
      }
    });
    const blockedPublicFiles = new Set(["/server.cjs", "/server.cjs.map"]);
    app.use((req, res, next) => {
      const [rawPathname] = req.url.split("?", 1);
      let pathname: string;
      try {
        pathname = decodeURIComponent(rawPathname);
      } catch {
        return next();
      }
      if (!blockedPublicFiles.has(pathname)) return next();
      return res.status(404).end();
    });
    app.get("/", async (req, res) => {
      const html = await renderIndexHtml(indexTemplate, req.path);
      const cacheControl = getHtmlCacheControl(req.path);
      res.setHeader("Cache-Control", cacheControl);
      res.type("html");
      return res.send(html);
    });
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        const relativePath = `/${path.relative(distPath, filePath).replaceAll(path.sep, "/")}`;
        if (relativePath.startsWith("/assets/") || /^\/(?:create-character|generator)\/assets\/v\d+\//.test(relativePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (["/create-character/", "/generator/", "/brand/", "/flags/"].some((prefix) => relativePath.startsWith(prefix))) {
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
          if (/\.(mp4|webm|mov)$/i.test(relativePath)) {
            res.setHeader("Accept-Ranges", "bytes");
          }
        } else if (["/index.html", "/manifest.webmanifest"].includes(relativePath)) {
          res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=60");
        }
      },
    }));
    app.get("*", async (req, res) => {
      const html = await renderIndexHtml(indexTemplate, req.path);
      const cacheControl = getHtmlCacheControl(req.path);
      res.setHeader("Cache-Control", cacheControl);
      res.type("html");
      if (cacheControl === PRIVATE_HTML_CACHE_CONTROL) return res.end(html);
      return res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
