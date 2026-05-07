import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import { activitiesCatalog } from "./activities-catalog.js";
import { categoryPages, getActivitySlug, renderLegalPage, renderTravelPage } from "./page-renderer.mjs";
import { newSeoPages, renderNewSeoPage } from "./seo-new-pages.mjs";
import { ensureQuadDirectionCard, normalizeFooterShell, normalizeLandingHeroShell } from "./hero-header-shell.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT) || 4173;
const siteUrl = (process.env.SITE_URL || process.env.BASE_URL || "https://arhipka-today.ru").replace(/\/+$/, "");
const siteOrigin = new URL(siteUrl).origin;

const locationName = "Архипо-Осиповка";
const coordinates = { latitude: 44.3719, longitude: 38.5297 };
const weatherCacheTtl = 20 * 60 * 1000;
const marineCacheTtl = 2 * 60 * 60 * 1000;
const requestTimeoutMs = 8000;
const snapshotSeoPaths = new Set([
  "/otdyh",
  "/pogoda",
  "/morskie-progulki",
  "/vodopady",
  "/ekskursii",
  "/s-detmi",
  "/kuda-shodit",
  "/progulka-na-zakate-arhipo-osipovka",
  "/iz-krasnodara"
]);

const canonicalLegalRoutes = ["/privacy", "/personal-data-consent", "/marketing-consent", "/cookie-policy", "/kontakty"];
const sitemapPaths = [
  "/travel",
  ...snapshotSeoPaths,
  ...newSeoPages.map((page) => page.path),
  ...canonicalLegalRoutes,
  ...categoryPages.map((category) => `/travel/${category.slug}`),
  ...activitiesCatalog.map((activity) => `/travel/${getActivitySlug(activity)}`)
].filter((pathname, index, arr) => arr.indexOf(pathname) === index);

const caches = {
  weather: { expiresAt: 0, value: null },
  marine: { expiresAt: 0, value: null },
  combined: null
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4"
};

const compressionMinBytes = 1024;
const brotliOptions = { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 } };
const gzipOptions = { level: 6 };

const weatherCodes = new Map([
  [0, "Ясно"],
  [1, "Преимущественно ясно"],
  [2, "Переменная облачность"],
  [3, "Пасмурно"],
  [45, "Туман"],
  [48, "Туман"],
  [51, "Слабая морось"],
  [53, "Морось"],
  [55, "Сильная морось"],
  [61, "Слабый дождь"],
  [63, "Дождь"],
  [65, "Сильный дождь"],
  [80, "Кратковременный дождь"],
  [81, "Дождь"],
  [82, "Ливневый дождь"],
  [95, "Гроза"]
]);

function toAbsoluteUrl(pathname) {
  return `${siteUrl}${withTrailingSlashPath(pathname)}`;
}

function getSitemapXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapPaths.map((pathname) => `  <url><loc>${toAbsoluteUrl(pathname)}</loc></url>`),
    "</urlset>"
  ].join("\n");
}

function getRobotsTxt() {
  return ["User-agent: *", "Allow: /", `Sitemap: ${toAbsoluteUrl("/sitemap.xml")}`].join("\n");
}

function withTrailingSlashPath(pathname = "") {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return pathname;
  if (pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return `${pathname}/`;
}

function normalizeSnapshotHtml(html) {
  const normalizeInternalHref = (href) => {
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return href;
    if (href === "/") return "/travel/";
    try {
      const parsed = new URL(href, siteUrl);
      if (parsed.origin !== siteOrigin) return href;
      const normalizedPath = withTrailingSlashPath(parsed.pathname);
      if (normalizedPath === parsed.pathname) return href;
      if (/^https?:\/\//i.test(href)) return `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
      if (href.startsWith("/")) return `${normalizedPath}${parsed.search}${parsed.hash}`;
      return href;
    } catch {
      return href;
    }
  };

  const normalizedLinksHtml = html.replace(/href="([^"]+)"/g, (_match, href) => `href="${normalizeInternalHref(href)}"`);
  const matchTitle = normalizedLinksHtml.match(/<title>([\s\S]*?)<\/title>/i);
  const matchDescription = normalizedLinksHtml.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i);
  const matchCanonical = normalizedLinksHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i);
  const matchHeroImage =
    normalizedLinksHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"\s*\/?>/i) ||
    normalizedLinksHtml.match(/<link\s+rel="preload"\s+as="image"\s+href="([^"]+)"\s*\/?>/i) ||
    normalizedLinksHtml.match(/<video[^>]*\sposter="([^"]+)"/i) ||
    normalizedLinksHtml.match(/<source[^>]*\ssrcset="([^"]+)"/i) ||
    normalizedLinksHtml.match(/<img[^>]*\ssrc="(?!data:)([^"]+)"/i);

  if (!matchTitle || !matchDescription || !matchCanonical) return normalizedLinksHtml;

  const title = matchTitle[1].trim();
  const description = matchDescription[1].trim();
  const canonicalRaw = matchCanonical[1].trim();
  const canonicalUrl = canonicalRaw.startsWith("http://") || canonicalRaw.startsWith("https://")
    ? canonicalRaw
    : `${siteUrl}${withTrailingSlashPath(canonicalRaw.startsWith("/") ? canonicalRaw : `/${canonicalRaw}`)}`;
  const imageRaw = (matchHeroImage?.[1] || "/fotoref/more-hero.jpg").trim();
  const imageUrl = imageRaw.startsWith("http://") || imageRaw.startsWith("https://")
    ? imageRaw
    : `${siteUrl}${imageRaw.startsWith("/") ? imageRaw : `/${imageRaw}`}`;
  const ogType = canonicalUrl === `${siteUrl}/travel/` || canonicalUrl.endsWith("/morskie-progulki/") || canonicalUrl.endsWith("/vodopady/") || canonicalUrl.endsWith("/s-detmi/") || canonicalUrl.endsWith("/pogoda/") || canonicalUrl.endsWith("/kuda-shodit/")
    ? "website"
    : "article";
  const socialMeta = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    '<meta property="og:site_name" content="Архипка Travel" />',
    '<meta property="og:locale" content="ru_RU" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`
  ].join("\n    ");

  if (/<meta\s+property="og:title"/i.test(normalizedLinksHtml) || /<meta\s+name="twitter:card"/i.test(normalizedLinksHtml)) {
    return normalizedLinksHtml;
  }

  return normalizedLinksHtml.replace("</head>", `    ${socialMeta}\n  </head>`);
}

function shouldRedirectToTrailingSlash(pathname) {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return false;
  if (pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}

function getCacheControlByExt(extension) {
  if (extension === ".html") return "public, max-age=300";
  if ([".css", ".js", ".mjs"].includes(extension)) return "public, max-age=86400";
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp4"].includes(extension)) return "public, max-age=604800";
  return "public, max-age=300";
}

function getCacheControlForFile(filePath, extension) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (normalized.endsWith("/catalog-renderer.js") || normalized.endsWith("/activities-catalog.js")) {
    return "no-cache";
  }
  return getCacheControlByExt(extension);
}

function isCompressibleContentType(contentType = "") {
  const normalized = contentType.toLowerCase();
  return normalized.startsWith("text/")
    || normalized.startsWith("application/json")
    || normalized.startsWith("application/xml")
    || normalized.startsWith("text/javascript")
    || normalized.startsWith("application/javascript")
    || normalized.startsWith("image/svg+xml");
}

function maybeCompressBody(req, body, contentType) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  if (!isCompressibleContentType(contentType) || payload.length < compressionMinBytes) {
    return { body: payload, encoding: null };
  }

  const acceptEncoding = String(req.headers["accept-encoding"] || "").toLowerCase();
  if (acceptEncoding.includes("br")) {
    try {
      return { body: brotliCompressSync(payload, brotliOptions), encoding: "br" };
    } catch {
      // Fallback to gzip/plain if brotli fails.
    }
  }
  if (acceptEncoding.includes("gzip")) {
    try {
      return { body: gzipSync(payload, gzipOptions), encoding: "gzip" };
    } catch {
      // Fallback to plain response.
    }
  }
  return { body: payload, encoding: null };
}

function sendResponse(req, res, { status = 200, body = "", contentType = contentTypes[".txt"], cacheControl = "public, max-age=300", headers = {} } = {}) {
  const { body: finalBody, encoding } = maybeCompressBody(req, body, contentType);
  const responseHeaders = {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    ...headers
  };
  if (isCompressibleContentType(contentType)) {
    responseHeaders.Vary = "Accept-Encoding";
  }
  if (encoding) {
    responseHeaders["Content-Encoding"] = encoding;
  }
  responseHeaders["Content-Length"] = String(finalBody.length);
  res.writeHead(status, responseHeaders);
  res.end(finalBody);
}

function roundOrNull(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function formatSunset(value) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(date);
}

function getSeaText(waveHeight) {
  if (!Number.isFinite(waveHeight)) return "Данные о море временно недоступны";
  if (waveHeight < 0.25) return "Спокойно";
  if (waveHeight < 0.6) return "Небольшая волна";
  if (waveHeight < 1.0) return "Есть волна";
  return "Сильное волнение";
}

function getRecommendation({ windSpeed, waveHeight }) {
  const hasWind = Number.isFinite(windSpeed);
  const hasWave = Number.isFinite(waveHeight);
  const strongWind = hasWind && windSpeed >= 9;
  const highWave = hasWave && waveHeight >= 1;
  const mediumWind = hasWind && windSpeed >= 6;
  const noticeableWave = hasWave && waveHeight >= 0.6;

  if (strongWind || highWave) {
    return "Для моря условия могут быть некомфортными, рассмотрите водопады или прогулку по берегу.";
  }
  if (mediumWind || noticeableWave) {
    return "Перед выходом лучше уточнить условия у капитана.";
  }
  if (hasWind && hasWave && windSpeed < 6 && waveHeight < 0.6) {
    return "Море спокойное, можно смотреть морские прогулки.";
  }
  return "Перед выходом лучше уточнить условия у капитана.";
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getWeatherData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && caches.weather.value && caches.weather.expiresAt > now) return caches.weather.value;

  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    daily: "sunset",
    timezone: "Europe/Moscow",
    forecast_days: "1",
    wind_speed_unit: "ms"
  });
  const json = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  const current = json.current || {};
  const value = {
    airTemperature: roundOrNull(current.temperature_2m),
    weatherText: weatherCodes.get(current.weather_code) || "Данные о погоде недоступны",
    windSpeed: roundOrNull(current.wind_speed_10m),
    windDirection: roundOrNull(current.wind_direction_10m),
    windGust: roundOrNull(current.wind_gusts_10m),
    sunsetTime: formatSunset(json.daily?.sunset?.[0])
  };

  caches.weather = { value, expiresAt: now + weatherCacheTtl };
  return value;
}

async function getMarineData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && caches.marine.value && caches.marine.expiresAt > now) return caches.marine.value;

  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: "sea_surface_temperature,wave_height",
    timezone: "Europe/Moscow",
    forecast_days: "1"
  });
  const json = await fetchJson(`https://marine-api.open-meteo.com/v1/marine?${params}`);
  const seaTemperature = roundOrNull(json.current?.sea_surface_temperature);
  const waveHeightRaw = json.current?.wave_height;
  const waveHeight = Number.isFinite(waveHeightRaw) ? Math.round(waveHeightRaw * 10) / 10 : null;
  const value = { seaTemperature, waveHeight, seaText: getSeaText(waveHeight) };

  caches.marine = { value, expiresAt: now + marineCacheTtl };
  return value;
}

async function getPublicWeather(url) {
  const forceError = url.searchParams.get("forceError") === "1";
  try {
    if (forceError) throw new Error("Forced weather fallback");
    const [weatherResult, marineResult] = await Promise.allSettled([
      getWeatherData(url.searchParams.get("refresh") === "1"),
      getMarineData(url.searchParams.get("refresh") === "1")
    ]);
    if (weatherResult.status === "rejected" && marineResult.status === "rejected") {
      throw new Error("Weather sources unavailable");
    }
    const weather = weatherResult.status === "fulfilled" ? weatherResult.value : {};
    const marine = marineResult.status === "fulfilled" ? marineResult.value : {};
    const payload = {
      location: locationName,
      coordinates,
      updatedAt: new Date().toISOString(),
      airTemperature: weather.airTemperature ?? null,
      weatherText: weather.weatherText || "нет данных сейчас",
      windSpeed: weather.windSpeed ?? null,
      windDirection: weather.windDirection ?? null,
      windGust: weather.windGust ?? null,
      sunsetTime: weather.sunsetTime || null,
      seaTemperature: marine.seaTemperature ?? null,
      waveHeight: marine.waveHeight ?? null,
      seaText: marine.seaText || "нет данных сейчас",
      recommendation: getRecommendation({ windSpeed: weather.windSpeed, waveHeight: marine.waveHeight }),
      isFallback: false,
      isPartial: weatherResult.status === "rejected" || marineResult.status === "rejected"
    };
    caches.combined = payload;
    return payload;
  } catch {
    if (!forceError && caches.combined) return caches.combined;
    return {
      location: locationName,
      coordinates,
      updatedAt: new Date().toISOString(),
      airTemperature: null,
      weatherText: "Сейчас нет данных о погоде",
      windSpeed: null,
      windDirection: null,
      windGust: null,
      seaTemperature: null,
      waveHeight: null,
      seaText: "Данные о море пока недоступны",
      recommendation: "Сейчас не удалось обновить погоду. Уточните условия перед выходом в море.",
      isFallback: true,
      isPartial: true
    };
  }
}

createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${port}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";

    if (shouldRedirectToTrailingSlash(url.pathname)) {
      const target = `${url.pathname}/${url.search || ""}`;
      res.writeHead(301, { Location: target });
      res.end();
      return;
    }

    if (url.pathname === "/robots.txt") {
      sendResponse(req, res, {
        status: 200,
        body: getRobotsTxt(),
        contentType: contentTypes[".txt"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    if (url.pathname === "/sitemap.xml") {
      sendResponse(req, res, {
        status: 200,
        body: getSitemapXml(),
        contentType: contentTypes[".xml"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    if (url.pathname === "/api/public/weather/arkhipo-osipovka") {
      const payload = await getPublicWeather(url);
      sendResponse(req, res, {
        status: 200,
        body: JSON.stringify(payload),
        contentType: contentTypes[".json"],
        cacheControl: "no-cache"
      });
      return;
    }

    if (url.pathname === "/" || url.pathname === "/travel/") {
      const homeRaw = await readFile(join(root, "index.html"), "utf8");
      const homeHtml = normalizeFooterShell(
        normalizeLandingHeroShell(homeRaw, {
          brandHref: "#top",
          fallbackPrimaryHref: "#popular"
        }),
        { homeHref: "/travel/" }
      );
      sendResponse(req, res, {
        status: 200,
        body: homeHtml,
        contentType: contentTypes[".html"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    const legalPage = renderLegalPage(normalizedPath);
    if (legalPage) {
      sendResponse(req, res, {
        status: 200,
        body: legalPage,
        contentType: contentTypes[".html"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    if (snapshotSeoPaths.has(normalizedPath)) {
      const snapshotFile = join(root, "seo-snapshots", normalizedPath.slice(1), "index.html");
      const snapshotHtml = normalizeSnapshotHtml(await readFile(snapshotFile, "utf8"));
      const html = normalizeFooterShell(
        ensureQuadDirectionCard(
          normalizeLandingHeroShell(snapshotHtml, { fallbackPrimaryHref: "#popular" })
        ),
        { homeHref: "/travel/" }
      );
      sendResponse(req, res, {
        status: 200,
        body: html,
        contentType: contentTypes[".html"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    const seoPage = renderNewSeoPage(normalizedPath);
    if (seoPage) {
      sendResponse(req, res, {
        status: 200,
        body: seoPage,
        contentType: contentTypes[".html"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    const travelPage = renderTravelPage(normalizedPath);
    if (travelPage) {
      sendResponse(req, res, {
        status: 200,
        body: travelPage,
        contentType: contentTypes[".html"],
        cacheControl: "public, max-age=300"
      });
      return;
    }

    const requestedPath = ["/", "/travel", "/travel/"].includes(url.pathname) ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, requestedPath));
    if (!filePath.startsWith(root)) {
      sendResponse(req, res, {
        status: 403,
        body: "Forbidden",
        contentType: contentTypes[".txt"],
        cacheControl: "no-cache"
      });
      return;
    }

    const body = await readFile(filePath);
    const extension = extname(filePath);
    sendResponse(req, res, {
      status: 200,
      body,
      contentType: contentTypes[extension] || "application/octet-stream",
      cacheControl: getCacheControlForFile(filePath, extension)
    });
  } catch {
    sendResponse(req, res, {
      status: 404,
      body: "Not found",
      contentType: contentTypes[".txt"],
      cacheControl: "no-cache"
    });
  }
}).listen(port, () => {
  console.log(`Архипо-Осиповка сегодня: http://localhost:${port}/travel`);
});

