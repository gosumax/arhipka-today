import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { activitiesCatalog } from "../activities-catalog.js";
import { HOME_BLOCKS, HOME_SECTION_ORDER } from "../home-blocks.mjs";
import {
  categoryPages,
  getActivitySlug,
  getCategoryActivities,
  renderActivityCard,
  renderCategoryPage,
  renderLegalPage,
  renderServicePage
} from "../page-renderer.mjs";
import { newSeoPages, renderNewSeoPage } from "../seo-new-pages.mjs";
import { ensureQuadDirectionCard, normalizeFooterShell, normalizeLandingHeroShell } from "../hero-header-shell.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const dist = path.join(projectRoot, "dist");
const siteUrl = (process.env.SITE_URL || process.env.BASE_URL || "https://arhipka-today.ru").replace(/\/+$/, "");
const siteOrigin = new URL(siteUrl).origin;
const siteName = "РђСЂС…РёРїРєР° Travel";
const contactPhone = "+7 979 033-97-39";

const htmlEscapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

function safeJsonLdStringify(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case "<": return "\\u003C";
      case ">": return "\\u003E";
      case "&": return "\\u0026";
      case "\u2028": return "\\u2028";
      case "\u2029": return "\\u2029";
      default: return char;
    }
  });
}

function renderJsonLdScript(jsonLd, indent = "") {
  return `${indent}<script type="application/ld+json">${safeJsonLdStringify(jsonLd)}</script>`;
}

const canonicalLegalRoutes = ["/privacy", "/personal-data-consent", "/marketing-consent", "/cookie-policy", "/kontakty"];
const snapshotSeoPaths = [
  "/otdyh",
  "/pogoda",
  "/morskie-progulki",
  "/vodopady",
  "/ekskursii",
  "/s-detmi",
  "/kuda-shodit",
  "/progulka-na-zakate-arhipo-osipovka",
  "/iz-krasnodara"
];
const aliasRedirects = [
  ["/contacts", "/kontakty/"],
  ["/privacy-policy", "/privacy/"]
];

const sitemapPaths = [
  "/travel",
  ...snapshotSeoPaths,
  ...newSeoPages.map((page) => page.path),
  ...canonicalLegalRoutes,
  ...categoryPages.map((category) => `/travel/${category.slug}`),
  ...activitiesCatalog.map((activity) => `/travel/${getActivitySlug(activity)}`)
].filter((pathname, index, arr) => arr.indexOf(pathname) === index);

const snapshotCategorySlugByPath = {
  "/morskie-progulki": "more",
  "/vodopady": "vodopady-dzhipping",
  "/ekskursii": "ekskursii",
  "/s-detmi": "s-detmi"
};

const activityBySlug = new Map(
  activitiesCatalog.map((activity) => [getActivitySlug(activity), activity])
);

function renderRedirectPage({
  toPath,
  canonicalPath = toPath,
  title = "РџРµСЂРµР°РґСЂРµСЃР°С†РёСЏ",
  robotsContent = "noindex,follow"
}) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="robots" content="${robotsContent}" />
    <link rel="canonical" href="${/^https?:\/\//i.test(canonicalPath) ? canonicalPath : `${siteUrl}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`}" />
    <meta http-equiv="refresh" content="0;url=${toPath}" />
  </head>
  <body>
    <p>РџРµСЂРµС…РѕРґ РЅР° <a href="${toPath}">${toPath}</a>.</p>
    <script>window.location.replace("${toPath}" + window.location.search + window.location.hash);</script>
  </body>
</html>`;
}

async function writeRouteHtml(route, html) {
  const normalized = route.replace(/^\/+/, "");
  if (!normalized) {
    await writeFile(path.join(dist, "index.html"), html, "utf8");
    return;
  }

  const pageDir = path.join(dist, normalized);
  await mkdir(pageDir, { recursive: true });
  await writeFile(path.join(pageDir, "index.html"), html, "utf8");
}

function withTrailingSlashPath(pathname = "") {
  if (!pathname || pathname === "/" || pathname.endsWith("/")) return pathname;
  if (pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) return pathname;
  return `${pathname}/`;
}

function normalizeSnapshotHtml(html) {
  const withOptimizedHeroMedia = html.replaceAll("/videoref/hero-beach.mp4", "/videoref/hero-beach-lite.mp4");

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

  const normalizedHrefHtml = withOptimizedHeroMedia.replace(/href="([^"]+)"/g, (_match, href) => `href="${normalizeInternalHref(href)}"`);

  return normalizedHrefHtml.replace(
    /(<section class="seo-links[\s\S]*?<div class="seo-links-grid">)([\s\S]*?)(<\/div>\s*<\/section>)(\s*(?:<a class="seo-link-card"[\s\S]*?<\/a>\s*)+)(<\/div>\s*<\/section>)/gi,
    (_match, sectionStart, cardsInGrid, sectionClose, orphanCards) => `${sectionStart}${cardsInGrid}${orphanCards}${sectionClose}`
  );
}

function deferSnapshotCardPhotos(html) {
  return html.replace(
    /class="(?=[^"]*\bimage-placeholder\b)(?=[^"]*\bcard-photo\b)(?![^"]*\bcard-photo-lazy\b)([^"]*)"/g,
    'class="$1 card-photo-lazy"'
  );
}

function getActivitySlugFromHref(href = "") {
  try {
    const pathname = new URL(href, siteUrl).pathname;
    return decodeURIComponent(pathname).replace(/^\/travel\/?/, "").replace(/\/+$/, "");
  } catch {
    return String(href || "").replace(/^\/travel\/?/, "").replace(/\/+$/, "");
  }
}

function replaceActivityCardsWithCms(html) {
  return html.replace(
    /<a\s+class="[^"]*\bactivity-card\b[\s\S]*?href="([^"]+)"[\s\S]*?<\/a>/gi,
    (cardHtml, href) => {
      const slug = getActivitySlugFromHref(href);
      const activity = slug ? activityBySlug.get(slug) : null;
      return activity ? renderActivityCard(activity, true) : "";
    }
  );
}

function replaceSnapshotCategoryGrid(pathname, html) {
  const categorySlug = snapshotCategorySlugByPath[pathname];
  if (!categorySlug) return html;

  const category = categoryPages.find((item) => item.slug === categorySlug);
  if (!category) return html;

  const cards = getCategoryActivities(category)
    .map((activity) => renderActivityCard(activity, true))
    .join("");

  return html.replace(
    /(<div class="[^"]*\bpopular-grid\b[^"]*\bservice-category-grid\b[^"]*">)[\s\S]*?(<\/div>\s*<\/section>)/i,
    `$1${cards}$2`
  );
}

function injectKidsTopicSections(pathname, html) {
  if (pathname !== "/s-detmi") return html;
  if (
    html.includes('id="plyazhi-dlya-detey"')
    || html.includes('id="kafe-i-pitanie"')
    || html.includes('id="razvlecheniya-i-parki"')
  ) {
    return html;
  }

  const practicalSections = [
    '<section class="service-layout seo-content-layout">',
    '<div class="service-main">',
    '<section class="service-panel" id="plyazhi-dlya-detey" aria-labelledby="plyazhi-dlya-detey-title">',
    '<h2 id="plyazhi-dlya-detey-title">РџР»СЏР¶Рё РґР»СЏ РґРµС‚РµР№</h2>',
    '<p>Р•СЃР»Рё СЃРµРјСЊСЏ РёС‰РµС‚ Р±РѕР»РµРµ СѓРґРѕР±РЅС‹Р№ РїР»СЏР¶ РґР»СЏ РґРµС‚РµР№, РјРѕР¶РЅРѕ СЂР°СЃСЃРјРѕС‚СЂРµС‚СЊ РїРµСЃС‡Р°РЅС‹Р№ СѓС‡Р°СЃС‚РѕРє Р±Р»РёР¶Рµ Рє РіРѕСЂРµ РЃР¶РёРє, РІ СЃС‚РѕСЂРѕРЅРµ РЃР¶РёРєР°. Р—Р° СЃС‡С‘С‚ РїРµСЃРєР° Рё Р±РѕР»РµРµ РїРѕРЅСЏС‚РЅРѕРіРѕ Р·Р°С…РѕРґР° РІ РІРѕРґСѓ РґРµС‚СЏРј С‚Р°Рј РјРѕР¶РµС‚ Р±С‹С‚СЊ РєРѕРјС„РѕСЂС‚РЅРµРµ.</p>',
    '<ul class="service-list">',
    '<li>РџРµСЂРµРґ РІС‹С…РѕРґРѕРј СЃРјРѕС‚СЂРёС‚Рµ РЅР° РїРѕРіРѕРґСѓ, РІРѕР»РЅСѓ, Р·Р°РіСЂСѓР¶РµРЅРЅРѕСЃС‚СЊ РїР»СЏР¶Р° Рё РІРѕР·СЂР°СЃС‚ СЂРµР±С‘РЅРєР°.</li>',
    '<li>Р‘РµСЂРёС‚Рµ РІРѕРґСѓ, РїРѕР»РѕС‚РµРЅС†Рµ, СЃРјРµРЅРЅСѓСЋ РѕРґРµР¶РґСѓ Рё Р·Р°С‰РёС‚Сѓ РѕС‚ СЃРѕР»РЅС†Р°.</li>',
    '<li>РќРµ РѕСЃС‚Р°РІР»СЏР№С‚Рµ РґРµС‚РµР№ Р±РµР· РїСЂРёСЃРјРѕС‚СЂР° Сѓ РІРѕРґС‹.</li>',
    '<li>Р•СЃР»Рё РїРѕСЃР»Рµ РїР»СЏР¶Р° РїР»Р°РЅРёСЂСѓРµС‚СЃСЏ РјРѕСЂСЃРєР°СЏ РїСЂРѕРіСѓР»РєР°, РїСЂРёС…РѕРґРёС‚Рµ Р·Р°СЂР°РЅРµРµ Рё РЅРµ РїРµСЂРµРіСЂРµРІР°Р№С‚РµСЃСЊ РїРµСЂРµРґ РїРѕРµР·РґРєРѕР№.</li>',
    '</ul>',
    '</section>',
    '<section class="service-panel" id="kafe-i-pitanie" aria-labelledby="kafe-i-pitanie-title">',
    '<h2 id="kafe-i-pitanie-title">РљР°С„Рµ Рё РїРёС‚Р°РЅРёРµ СЃ РґРµС‚СЊРјРё</h2>',
    '<p>РџРѕРєР° РЅР° СЃР°Р№С‚Рµ РјС‹ РЅРµ СЂРµРєР»Р°РјРёСЂСѓРµРј РєРѕРЅРєСЂРµС‚РЅРѕРµ РєР°С„Рµ, РµСЃР»Рё РЅРµС‚ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅРѕРіРѕ РїР°СЂС‚РЅС‘СЂР° Рё РїСЂРѕРІРµСЂРµРЅРЅРѕРіРѕ РјРµСЃС‚Р°. РЎР°РјС‹Р№ РїСЂР°РєС‚РёС‡РЅС‹Р№ РѕСЂРёРµРЅС‚РёСЂ вЂ” СЃРїСЂРѕСЃРёС‚СЊ Сѓ РјРµСЃС‚РЅС‹С…, РіРґРµ РѕРЅРё СЃР°РјРё РµРґСЏС‚.</p>',
    '<ul class="service-list">',
    '<li>Р’С‹Р±РёСЂР°Р№С‚Рµ РєР°С„Рµ РїРѕ РїРѕРЅСЏС‚РЅРѕРјСѓ РјРµРЅСЋ, СЃРІРµР¶РµР№ РµРґРµ, РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё Р±С‹СЃС‚СЂРѕ РЅР°РєРѕСЂРјРёС‚СЊ СЂРµР±С‘РЅРєР°, С‚РµРЅРё РёР»Рё РїСЂРѕС…Р»Р°РґРµ, С‡РёСЃС‚РѕС‚Рµ Рё Р±Р»РёР·РѕСЃС‚Рё Рє РјР°СЂС€СЂСѓС‚Сѓ.</li>',
    '<li>Р”Р»СЏ РјР°Р»РµРЅСЊРєРёС… РґРµС‚РµР№ Р»СѓС‡С€Рµ РёРјРµС‚СЊ СЃ СЃРѕР±РѕР№ РІРѕРґСѓ Рё Р»С‘РіРєРёР№ РїРµСЂРµРєСѓСЃ.</li>',
    '<li>РџРµСЂРµРґ РјРѕСЂСЃРєРѕР№ РїСЂРѕРіСѓР»РєРѕР№ Р»СѓС‡С€Рµ РЅРµ Р±СЂР°С‚СЊ С‚СЏР¶С‘Р»СѓСЋ РµРґСѓ.</li>',
    '<li>РџРµСЂРµРґ РґР»РёС‚РµР»СЊРЅРѕР№ СЌРєСЃРєСѓСЂСЃРёРµР№ Р·Р°СЂР°РЅРµРµ СѓС‚РѕС‡РЅСЏР№С‚Рµ, РІС…РѕРґРёС‚ Р»Рё РїРёС‚Р°РЅРёРµ.</li>',
    '<li>Р•СЃР»Рё СЂРµР±С‘РЅРѕРє РїСЂРёРІРµСЂРµРґР»РёРІ РІ РµРґРµ, Р±РµСЂРёС‚Рµ РїСЂРёРІС‹С‡РЅС‹Р№ РїРµСЂРµРєСѓСЃ СЃ СЃРѕР±РѕР№.</li>',
    '</ul>',
    '</section>',
    '<section class="service-panel" id="razvlecheniya-i-parki" aria-labelledby="razvlecheniya-i-parki-title">',
    '<h2 id="razvlecheniya-i-parki-title">Р Р°Р·РІР»РµС‡РµРЅРёСЏ Рё РїР°СЂРєРё</h2>',
    '<p>Р•СЃР»Рё РІС‹ РІС‹Р±РёСЂР°РµС‚Рµ СЂР°Р·РІР»РµС‡РµРЅРёСЏ СЃ РґРµС‚СЊРјРё, РѕСЂРёРµРЅС‚РёСЂСѓР№С‚РµСЃСЊ РЅР° РїРѕРЅСЏС‚РЅС‹Р№ Рё РєРѕСЂРѕС‚РєРёР№ С„РѕСЂРјР°С‚ СЂСЏРґРѕРј СЃ С†РµРЅС‚СЂРѕРј РёР»Рё РЅР°Р±РµСЂРµР¶РЅРѕР№. РќР° СЃС‚СЂР°РЅРёС†Рµ РЅРµС‚ РЅРµРїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… РЅР°Р·РІР°РЅРёР№ РїР°СЂРєРѕРІ Рё С‚РѕС‡РµРє: Р»СѓС‡С€Рµ СѓС‚РѕС‡РЅСЏС‚СЊ Р°РєС‚СѓР°Р»СЊРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹ РїРѕ РјРµСЃС‚Сѓ РІ РґРµРЅСЊ РїСЂРѕРіСѓР»РєРё.</p>',
    '<ul class="service-list">',
    '<li>Р’С‹Р±РёСЂР°Р№С‚Рµ Р°РєС‚РёРІРЅРѕСЃС‚Рё РїРѕ РІРѕР·СЂР°СЃС‚Сѓ СЂРµР±С‘РЅРєР° Рё РІСЂРµРјРµРЅРё РґРЅСЏ: РІ Р¶Р°СЂСѓ Р»СѓС‡С€Рµ СЃРјРµС‰Р°С‚СЊ РЅР° СѓС‚СЂРѕ Рё РІРµС‡РµСЂ.</li>',
    '<li>Р§РµСЂРµРґСѓР№С‚Рµ Р°РєС‚РёРІРЅС‹Рµ Рё СЃРїРѕРєРѕР№РЅС‹Рµ Р±Р»РѕРєРё, С‡С‚РѕР±С‹ СЂРµР±С‘РЅРѕРє РЅРµ РїРµСЂРµСѓС‚РѕРјРёР»СЃСЏ.</li>',
    '<li>РџСЂРѕРІРµСЂСЏР№С‚Рµ С‚РµРЅСЊ, РІРѕРґСѓ Рё РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ РєРѕСЂРѕС‚РєРёС… РїР°СѓР· СЂСЏРґРѕРј.</li>',
    '<li>Р•СЃР»Рё РЅСѓР¶РЅР° Р±РѕР»РµРµ СЃРїРѕРєРѕР№РЅР°СЏ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°, РІС‹Р±РёСЂР°Р№С‚Рµ РЅР°Р±РµСЂРµР¶РЅСѓСЋ Рё РєРѕСЂРѕС‚РєРёР№ РїРµС€РёР№ РјР°СЂС€СЂСѓС‚.</li>',
    '</ul>',
    '</section>',
    '</div>',
    '</section>'
  ].join("");

  return html.replace(
    /<section class="popular-section service-category-section seo-service-catalog"/i,
    `${practicalSections}<section class="popular-section service-category-section seo-service-catalog"`
  );
}

function applyCmsCatalogToSnapshot(pathname, html) {
  return injectKidsTopicSections(pathname, replaceActivityCardsWithCms(replaceSnapshotCategoryGrid(pathname, html)));
}

const snapshotRelatedLinks = {
  "/pogoda": {
    heading: "РЎРІСЏР·Р°РЅРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹",
    description: "РџРµСЂРµС…РѕРґРёС‚Рµ Рє С„РѕСЂРјР°С‚Сѓ, РєРѕС‚РѕСЂС‹Р№ Р»СѓС‡С€Рµ РїРѕРґС…РѕРґРёС‚ РїРѕ С‚РµРєСѓС‰РµР№ РїРѕРіРѕРґРµ Рё СЃРѕСЃС‚РѕСЏРЅРёСЋ РјРѕСЂСЏ.",
    links: [
      {
        href: "/morskie-progulki",
        title: "РџРѕСЃРјРѕС‚СЂРµС‚СЊ РјРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё",
        teaser: "Р•СЃР»Рё РјРѕСЂРµ СЃРїРѕРєРѕР№РЅРѕРµ Рё С…РѕС‚РёС‚Рµ С„РѕСЂРјР°С‚ РЅР° РІРѕРґРµ."
      },
      {
        href: "/vodopady",
        title: "Р’РѕРґРѕРїР°РґС‹",
        teaser: "Р•СЃР»Рё Р¶Р°СЂРєРѕ, РІРµС‚СЂРµРЅРѕ РёР»Рё РЅСѓР¶РЅР° РЅР°Р·РµРјРЅР°СЏ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°."
      },
      {
        href: "/kuda-shodit-vecherom-v-arhipo-osipovke",
        title: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ РІРµС‡РµСЂРѕРј",
        teaser: "Р•СЃР»Рё РЅСѓР¶РµРЅ СЃРїРѕРєРѕР№РЅС‹Р№ РІРµС‡РµСЂРЅРёР№ СЃС†РµРЅР°СЂРёР№ Сѓ РјРѕСЂСЏ."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Р§С‚Рѕ РІР·СЏС‚СЊ РЅР° РјРѕСЂСЃРєСѓСЋ РїСЂРѕРіСѓР»РєСѓ",
        teaser: "Р•СЃР»Рё РёРґС‘С‚Рµ РЅР° РєР°С‚РµСЂ Рё С…РѕС‚РёС‚Рµ Р±С‹СЃС‚СЂРѕ СЃРѕР±СЂР°С‚СЊСЃСЏ."
      }
    ]
  },
  "/s-detmi": {
    heading: "РЎРІСЏР·Р°РЅРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹",
    description: "РљРѕСЂРѕС‚РєРёРµ Рё РїРѕРЅСЏС‚РЅС‹Рµ РїРµСЂРµС…РѕРґС‹ РґР»СЏ СЃРµРјРµР№РЅРѕРіРѕ РѕС‚РґС‹С…Р° Р±РµР· РїРµСЂРµРіСЂСѓР·Р°.",
    links: [
      {
        href: "/morskaya-progulka-s-detmi-arhipo-osipovka",
        title: "РњРѕСЂСЃРєР°СЏ РїСЂРѕРіСѓР»РєР° СЃ РґРµС‚СЊРјРё",
        teaser: "РЎРїРѕРєРѕР№РЅС‹Рµ СЃРµРјРµР№РЅС‹Рµ С„РѕСЂРјР°С‚С‹ РїРѕ РґР»РёС‚РµР»СЊРЅРѕСЃС‚Рё Рё СЂРёС‚РјСѓ."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Р§С‚Рѕ РІР·СЏС‚СЊ РЅР° РјРѕСЂСЃРєСѓСЋ РїСЂРѕРіСѓР»РєСѓ",
        teaser: "Р§РµРє-Р»РёСЃС‚, С‡С‚РѕР±С‹ СЃ РґРµС‚СЊРјРё РЅРёС‡РµРіРѕ РЅРµ Р·Р°Р±С‹С‚СЊ."
      },
      {
        href: "/kuda-shodit",
        title: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ",
        teaser: "РРґРµРё РЅР°Р·РµРјРЅС‹С… РјР°СЂС€СЂСѓС‚РѕРІ Рё РїСЂРѕРіСѓР»РѕРє СЃ РґРµС‚СЊРјРё."
      },
      {
        href: "/pogoda",
        title: "РћС‚РґС‹С… РїРѕ РїРѕРіРѕРґРµ",
        teaser: "Р§С‚Рѕ РІС‹Р±СЂР°С‚СЊ СЃРµРјСЊРµ РІ Р¶Р°СЂСѓ, РІРµС‚РµСЂ РёР»Рё РІРѕР»РЅСѓ."
      },
      {
        href: "/morskie-progulki",
        title: "РџРѕСЃРјРѕС‚СЂРµС‚СЊ РјРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё",
        teaser: "Р•СЃР»Рё РЅСѓР¶РµРЅ РєРѕСЂРѕС‚РєРёР№ Рё СЃРїРѕРєРѕР№РЅС‹Р№ С„РѕСЂРјР°С‚ РЅР° РјРѕСЂРµ."
      }
    ]
  },
  "/morskie-progulki": {
    heading: "РЎРІСЏР·Р°РЅРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹",
    description: "РџРѕРјРѕРіР°РµС‚ Р±С‹СЃС‚СЂРѕ РїРµСЂРµР№С‚Рё РѕС‚ РёРґРµРё РІС‹С…РѕРґР° РІ РјРѕСЂРµ Рє С„РѕСЂРјР°С‚Сѓ, С†РµРЅРµ Рё РїРѕРґРіРѕС‚РѕРІРєРµ.",
    links: [
      {
        href: "/ceny-na-morskie-progulki-arhipo-osipovka",
        title: "Р¦РµРЅС‹ РЅР° РјРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё",
        teaser: "РЎСЂР°РІРЅРёС‚Рµ СЃС‚РѕРёРјРѕСЃС‚СЊ РїРѕ РґР»РёС‚РµР»СЊРЅРѕСЃС‚Рё Рё С„РѕСЂРјР°С‚Сѓ."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Р§С‚Рѕ РІР·СЏС‚СЊ РЅР° РјРѕСЂСЃРєСѓСЋ РїСЂРѕРіСѓР»РєСѓ",
        teaser: "РљРѕСЂРѕС‚РєРёР№ СЃРїРёСЃРѕРє РІРµС‰РµР№ РїРµСЂРµРґ РІС‹С…РѕРґРѕРј РІ РјРѕСЂРµ."
      },
      {
        href: "/morskaya-progulka-s-detmi-arhipo-osipovka",
        title: "РњРѕСЂСЃРєР°СЏ РїСЂРѕРіСѓР»РєР° СЃ РґРµС‚СЊРјРё",
        teaser: "РћС‚РґРµР»СЊРЅС‹Р№ СЃРµРјРµР№РЅС‹Р№ СЃС†РµРЅР°СЂРёР№ СЃ РјСЏРіРєРёРј С‚РµРјРїРѕРј."
      },
      {
        href: "/progulka-na-zakate-arhipo-osipovka",
        title: "РџСЂРѕРіСѓР»РєР° РЅР° Р·Р°РєР°С‚Рµ",
        teaser: "Р’РµС‡РµСЂРЅРёР№ РјРѕСЂСЃРєРѕР№ С„РѕСЂРјР°С‚ СЃРѕ СЃРїРѕРєРѕР№РЅС‹Рј СЂРёС‚РјРѕРј."
      },
      {
        href: "/pogoda",
        title: "РћС‚РґС‹С… РїРѕ РїРѕРіРѕРґРµ",
        teaser: "РџСЂРѕРІРµСЂСЊС‚Рµ СѓСЃР»РѕРІРёСЏ РїРµСЂРµРґ РІС‹Р±РѕСЂРѕРј РјРѕСЂСЃРєРѕРіРѕ С„РѕСЂРјР°С‚Р°."
      }
    ]
  },
  "/kuda-shodit": {
    heading: "РЎРІСЏР·Р°РЅРЅС‹Рµ РІР°СЂРёР°РЅС‚С‹",
    description: "Р’С‹Р±РµСЂРёС‚Рµ СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі: С‡С‚Рѕ РїРѕСЃРјРѕС‚СЂРµС‚СЊ, РєСѓРґР° РїРѕР№С‚Рё РІРµС‡РµСЂРѕРј Рё С‡С‚Рѕ РїРѕРґРѕР№РґС‘С‚ СЃРµРјСЊРµ.",
    links: [
      {
        href: "/chto-posmotret-v-arhipo-osipovke",
        title: "Р§С‚Рѕ РїРѕСЃРјРѕС‚СЂРµС‚СЊ РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
        teaser: "Р РµР°Р»СЊРЅС‹Рµ С‚РѕС‡РєРё РґР»СЏ РїРµСЂРІРѕРіРѕ Р·РЅР°РєРѕРјСЃС‚РІР° СЃ РєСѓСЂРѕСЂС‚РѕРј."
      },
      {
        href: "/kuda-shodit-vecherom-v-arhipo-osipovke",
        title: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ РІРµС‡РµСЂРѕРј",
        teaser: "Р’РµС‡РµСЂРЅРёРµ РјР°СЂС€СЂСѓС‚С‹, Р·Р°РєР°С‚ Рё СЃРїРѕРєРѕР№РЅС‹Рµ С„РѕСЂРјР°С‚С‹."
      },
      {
        href: "/s-detmi",
        title: "Р§С‚Рѕ РІС‹Р±СЂР°С‚СЊ СЃ РґРµС‚СЊРјРё",
        teaser: "РЎРµРјРµР№РЅС‹Рµ РІР°СЂРёР°РЅС‚С‹ Р±РµР· РґР»РёРЅРЅС‹С… РїРµСЂРµС…РѕРґРѕРІ."
      },
      {
        href: "/pogoda",
        title: "РћС‚РґС‹С… РїРѕ РїРѕРіРѕРґРµ",
        teaser: "РљР°Рє Р±С‹СЃС‚СЂРѕ СЃРєРѕСЂСЂРµРєС‚РёСЂРѕРІР°С‚СЊ РїР»Р°РЅ РїРѕ РїРѕРіРѕРґРµ."
      },
      {
        href: "/morskie-progulki",
        title: "РџРѕСЃРјРѕС‚СЂРµС‚СЊ РјРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё",
        teaser: "Р•СЃР»Рё С…РѕС‚РёС‚Рµ РґРѕР±Р°РІРёС‚СЊ С„РѕСЂРјР°С‚ РЅР° РІРѕРґРµ."
      }
    ]
  }
};

const snapshotFaqOverrides = {
  "/morskie-progulki": [
    ["РљР°РєРѕР№ С„РѕСЂРјР°С‚ РјРѕСЂСЏ РІС‹Р±СЂР°С‚СЊ РІ РїРµСЂРІС‹Р№ СЂР°Р·?", "Р•СЃР»Рё РІРїРµСЂРІС‹Рµ, С‡Р°С‰Рµ РІС‹Р±РёСЂР°СЋС‚ 1 С‡Р°СЃ: СЃРїРѕРєРѕР№РЅС‹Р№ РІС‹С…РѕРґ, С„РѕС‚Рѕ Рё РєСѓРїР°РЅРёРµ Р±РµР· РїРµСЂРµРіСЂСѓР·Р°."],
    ["Р§С‚Рѕ РІС‹Р±СЂР°С‚СЊ РЅР° РјРѕСЂРµ СЃ РґРµС‚СЊРјРё?", "РЎРµРјСЊСЏРј РѕР±С‹С‡РЅРѕ СѓРґРѕР±РЅРµРµ РєРѕСЂРѕС‚РєРёР№ СЂРµР№СЃ РІ СЃРїРѕРєРѕР№РЅСѓСЋ РїРѕРіРѕРґСѓ Рё РјСЏРіРєРёР№ С‚РµРјРї Р±РµР· РґРѕР»РіРёС… РїРµСЂРµС…РѕРґРѕРІ."],
    ["Р§С‚Рѕ РґРµР»Р°С‚СЊ, РµСЃР»Рё РїРѕРґРЅСЏР»Р°СЃСЊ РІРѕР»РЅР°?", "Р•СЃР»Рё РјРѕСЂРµ СЃС‚Р°Р»Рѕ РЅРµСЃРїРѕРєРѕР№РЅС‹Рј, Р»СѓС‡С€Рµ РїРµСЂРµРЅРµСЃС‚Рё РІС‹С…РѕРґ Рё РІС‹Р±СЂР°С‚СЊ РЅР°Р·РµРјРЅС‹Р№ РІР°СЂРёР°РЅС‚: РІРѕРґРѕРїР°РґС‹, РїСЂРѕРіСѓР»РєСѓ РёР»Рё РІРµС‡РµСЂРЅРёР№ РјР°СЂС€СЂСѓС‚."],
    ["РњРѕР¶РЅРѕ Р»Рё РІС‹Р±СЂР°С‚СЊ РѕС‚РґС‹С… РЅР° СЃРµРіРѕРґРЅСЏ?", "Р”Р°. РќР°РїРёС€РёС‚Рµ РІ MAX вЂ” РїРѕРґСЃРєР°Р¶РµРј, РєР°РєРёРµ РІР°СЂРёР°РЅС‚С‹ Р°РєС‚СѓР°Р»СЊРЅС‹ СЃРµРіРѕРґРЅСЏ Рё С‡С‚Рѕ Р»СѓС‡С€Рµ РІС‹Р±СЂР°С‚СЊ РїРѕ РїРѕРіРѕРґРµ."],
    ["Р§С‚Рѕ РІР·СЏС‚СЊ СЃ СЃРѕР±РѕР№?", "Р’РѕРґСѓ, СѓРґРѕР±РЅСѓСЋ РѕР±СѓРІСЊ, СЃРѕР»РЅС†РµР·Р°С‰РёС‚Сѓ, Р»С‘РіРєСѓСЋ РѕРґРµР¶РґСѓ РѕС‚ РІРµС‚СЂР°. Р”Р»СЏ РјРѕСЂСЏ Рё РєСѓРїР°РЅРёСЏ вЂ” РїРѕР»РѕС‚РµРЅС†Рµ."],
    ["РљР°Рє РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РїРѕРґРѕР№РґС‘С‚ РёРјРµРЅРЅРѕ РЅР°Рј?", "РќР°РїРёС€РёС‚Рµ СЃРѕСЃС‚Р°РІ РєРѕРјРїР°РЅРёРё, РІРѕР·СЂР°СЃС‚ РґРµС‚РµР№, Р¶РµР»Р°РµРјРѕРµ РІСЂРµРјСЏ Рё С„РѕСЂРјР°С‚ вЂ” СЃРїРѕРєРѕР№РЅС‹Р№, РєСЂР°СЃРёРІС‹Р№, Р°РєС‚РёРІРЅС‹Р№ РёР»Рё СЃРµРјРµР№РЅС‹Р№."]
  ],
  "/pogoda": [
    ["РљР°РєР°СЏ РїРѕРіРѕРґР° СЃРµРіРѕРґРЅСЏ РїРѕРґС…РѕРґРёС‚ РґР»СЏ РјРѕСЂСЏ?", "Р”Р»СЏ РјРѕСЂСЏ РєРѕРјС„РѕСЂС‚РЅРµРµ СЃР»Р°Р±С‹Р№ РІРµС‚РµСЂ Рё СЃРїРѕРєРѕР№РЅР°СЏ РІРѕР»РЅР°; РїСЂРё РЅРµСЃС‚Р°Р±РёР»СЊРЅС‹С… СѓСЃР»РѕРІРёСЏС… Р»СѓС‡С€Рµ СЃСЂР°Р·Сѓ РїР»Р°РЅРёСЂРѕРІР°С‚СЊ РІР°СЂРёР°РЅС‚ РЅР° СЃСѓС€Рµ."],
    ["Р§С‚Рѕ РІС‹Р±СЂР°С‚СЊ СЃРµРјСЊРµ РїСЂРё Р¶Р°СЂРµ?", "РЎ РґРµС‚СЊРјРё С‡Р°С‰Рµ СѓРґРѕР±РЅС‹ СѓС‚СЂРµРЅРЅРёРµ Рё РІРµС‡РµСЂРЅРёРµ СЃР»РѕС‚С‹, Р° РІ РїРёРє Р¶Р°СЂС‹ вЂ” РєРѕСЂРѕС‚РєРёРµ РјР°СЂС€СЂСѓС‚С‹ Рё С‚РµРЅСЊ."],
    ["Р§С‚Рѕ РґРµР»Р°С‚СЊ РїСЂРё РІРµС‚СЂРµ Рё РІРѕР»РЅРµ?", "РЎРјРµСЃС‚РёС‚Рµ РїР»Р°РЅ РЅР° РЅР°Р·РµРјРЅС‹Рµ С‚РѕС‡РєРё: РЅР°Р±РµСЂРµР¶РЅСѓСЋ, РџРѕРґРІРµСЃРЅРѕР№ РјРѕСЃС‚ С‡РµСЂРµР· Р’СѓР»Р°РЅ, РњРёС…Р°Р№Р»РѕРІСЃРєРѕРµ СѓРєСЂРµРїР»РµРЅРёРµ РёР»Рё РІС‹РµР·Рґ Рє РІРѕРґРѕРїР°РґР°Рј."],
    ["РњРѕР¶РЅРѕ Р»Рё РІС‹Р±СЂР°С‚СЊ РѕС‚РґС‹С… РЅР° СЃРµРіРѕРґРЅСЏ?", "Р”Р°. РќР°РїРёС€РёС‚Рµ РІ MAX вЂ” РїРѕРґСЃРєР°Р¶РµРј, РєР°РєРёРµ РІР°СЂРёР°РЅС‚С‹ Р°РєС‚СѓР°Р»СЊРЅС‹ СЃРµРіРѕРґРЅСЏ Рё С‡С‚Рѕ Р»СѓС‡С€Рµ РІС‹Р±СЂР°С‚СЊ РїРѕ РїРѕРіРѕРґРµ."],
    ["Р§С‚Рѕ РІР·СЏС‚СЊ СЃ СЃРѕР±РѕР№?", "Р’РѕРґСѓ, СѓРґРѕР±РЅСѓСЋ РѕР±СѓРІСЊ, СЃРѕР»РЅС†РµР·Р°С‰РёС‚Сѓ, Р»С‘РіРєСѓСЋ РѕРґРµР¶РґСѓ РѕС‚ РІРµС‚СЂР°. Р”Р»СЏ РјРѕСЂСЏ Рё РєСѓРїР°РЅРёСЏ вЂ” РїРѕР»РѕС‚РµРЅС†Рµ."],
    ["РљР°Рє РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РїРѕРґРѕР№РґС‘С‚ РёРјРµРЅРЅРѕ РЅР°Рј?", "РќР°РїРёС€РёС‚Рµ СЃРѕСЃС‚Р°РІ РєРѕРјРїР°РЅРёРё, РІРѕР·СЂР°СЃС‚ РґРµС‚РµР№, Р¶РµР»Р°РµРјРѕРµ РІСЂРµРјСЏ Рё С„РѕСЂРјР°С‚ вЂ” СЃРїРѕРєРѕР№РЅС‹Р№, РєСЂР°СЃРёРІС‹Р№, Р°РєС‚РёРІРЅС‹Р№ РёР»Рё СЃРµРјРµР№РЅС‹Р№."]
  ],
  "/s-detmi": [
    ["РљР°РєРѕР№ СЃРµРјРµР№РЅС‹Р№ С„РѕСЂРјР°С‚ РІС‹Р±СЂР°С‚СЊ РІ РїРµСЂРІСѓСЋ РѕС‡РµСЂРµРґСЊ?", "РћР±С‹С‡РЅРѕ РЅР°С‡РёРЅР°СЋС‚ СЃ РєРѕСЂРѕС‚РєРѕР№ РїСЂРѕРіСѓР»РєРё: РјРѕСЂРµ РёР»Рё СЃРїРѕРєРѕР№РЅС‹Р№ РјР°СЂС€СЂСѓС‚ РЅР° СЃСѓС€Рµ Р±РµР· РґР»РёРЅРЅРѕР№ РґРѕСЂРѕРіРё."],
    ["РљСѓРґР° РїРѕР№С‚Рё СЃ РґРµС‚СЊРјРё, РµСЃР»Рё РЅРµ С…РѕС‡РµС‚СЃСЏ РєР°С‚РµСЂ?", "РџРѕРґРѕР№РґСѓС‚ РЅР°Р±РµСЂРµР¶РЅР°СЏ, Р¦РµРЅС‚СЂР°Р»СЊРЅС‹Р№ РїР»СЏР¶ Рё РєРѕСЂРѕС‚РєРёРµ РЅР°Р·РµРјРЅС‹Рµ С‚РѕС‡РєРё, РіРґРµ РјРѕР¶РЅРѕ РґРµР»Р°С‚СЊ РїР°СѓР·С‹."],
    ["Р§С‚Рѕ РґРµР»Р°С‚СЊ СЃРµРјСЊРµ РїСЂРё РІРµС‚СЂРµ?", "РџСЂРё РІРµС‚СЂРµ Р»СѓС‡С€Рµ РІС‹Р±СЂР°С‚СЊ РЅР°Р·РµРјРЅС‹Р№ СЃС†РµРЅР°СЂРёР№ Рё СЃРїРѕРєРѕР№РЅС‹Р№ С‚РµРјРї, Р° РІС‹С…РѕРґ РІ РјРѕСЂРµ РїРµСЂРµРЅРµСЃС‚Рё РЅР° Р±РѕР»РµРµ С‚РёС…РёРµ СѓСЃР»РѕРІРёСЏ."],
    ["РњРѕР¶РЅРѕ Р»Рё РІС‹Р±СЂР°С‚СЊ РѕС‚РґС‹С… РЅР° СЃРµРіРѕРґРЅСЏ?", "Р”Р°. РќР°РїРёС€РёС‚Рµ РІ MAX вЂ” РїРѕРґСЃРєР°Р¶РµРј, РєР°РєРёРµ РІР°СЂРёР°РЅС‚С‹ Р°РєС‚СѓР°Р»СЊРЅС‹ СЃРµРіРѕРґРЅСЏ Рё С‡С‚Рѕ Р»СѓС‡С€Рµ РІС‹Р±СЂР°С‚СЊ РїРѕ РїРѕРіРѕРґРµ."],
    ["Р§С‚Рѕ РІР·СЏС‚СЊ СЃ СЃРѕР±РѕР№?", "Р’РѕРґСѓ, СѓРґРѕР±РЅСѓСЋ РѕР±СѓРІСЊ, СЃРѕР»РЅС†РµР·Р°С‰РёС‚Сѓ, Р»С‘РіРєСѓСЋ РѕРґРµР¶РґСѓ РѕС‚ РІРµС‚СЂР°. Р”Р»СЏ РјРѕСЂСЏ Рё РєСѓРїР°РЅРёСЏ вЂ” РїРѕР»РѕС‚РµРЅС†Рµ."],
    ["РљР°Рє РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РїРѕРґРѕР№РґС‘С‚ РёРјРµРЅРЅРѕ РЅР°Рј?", "РќР°РїРёС€РёС‚Рµ СЃРѕСЃС‚Р°РІ РєРѕРјРїР°РЅРёРё, РІРѕР·СЂР°СЃС‚ РґРµС‚РµР№, Р¶РµР»Р°РµРјРѕРµ РІСЂРµРјСЏ Рё С„РѕСЂРјР°С‚ вЂ” СЃРїРѕРєРѕР№РЅС‹Р№, РєСЂР°СЃРёРІС‹Р№, Р°РєС‚РёРІРЅС‹Р№ РёР»Рё СЃРµРјРµР№РЅС‹Р№."]
  ],
  "/kuda-shodit": [
    ["РЎ С‡РµРіРѕ РЅР°С‡Р°С‚СЊ РїСЂРѕРіСѓР»РєСѓ РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ?", "РќР°С‡РЅРёС‚Рµ СЃ РџСЂРёРјРѕСЂСЃРєРѕРіРѕ Р±СѓР»СЊРІР°СЂР° Рё Р¦РµРЅС‚СЂР°Р»СЊРЅРѕРіРѕ РїР»СЏР¶Р°, Р° РґР°Р»СЊС€Рµ РґРѕР±Р°РІСЊС‚Рµ РѕРґРЅСѓ Р°РєС‚РёРІРЅРѕСЃС‚СЊ РїРѕ РІСЂРµРјРµРЅРё Рё РЅР°СЃС‚СЂРѕРµРЅРёСЋ."],
    ["РљСѓРґР° СЃС…РѕРґРёС‚СЊ СЃ РґРµС‚СЊРјРё Р±РµР· РїРµСЂРµРіСЂСѓР·Р°?", "Р’С‹Р±РёСЂР°Р№С‚Рµ РєРѕСЂРѕС‚РєРёР№ РєСЂСѓРі: РЅР°Р±РµСЂРµР¶РЅР°СЏ, РџРѕРґРІРµСЃРЅРѕР№ РјРѕСЃС‚ С‡РµСЂРµР· Р’СѓР»Р°РЅ Рё РѕРґРЅР° РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅР°СЏ С‚РѕС‡РєР° Р±РµР· РґР»РёРЅРЅС‹С… РїРµСЂРµРµР·РґРѕРІ."],
    ["Р§С‚Рѕ РІС‹Р±СЂР°С‚СЊ, РµСЃР»Рё РјРѕСЂРµ РІРѕР»РЅСѓРµС‚СЃСЏ?", "РЎРґРµР»Р°Р№С‚Рµ РЅР°Р·РµРјРЅС‹Р№ РјР°СЂС€СЂСѓС‚: Р“РѕСЂР° РЃР¶РёРє, РњРёС…Р°Р№Р»РѕРІСЃРєРѕРµ СѓРєСЂРµРїР»РµРЅРёРµ РёР»Рё РњСѓР·РµР№ С…Р»РµР±Р° Рё РІРёРЅР°, Р° РјРѕСЂРµ РѕСЃС‚Р°РІСЊС‚Рµ РЅР° СЃРїРѕРєРѕР№РЅС‹Р№ РґРµРЅСЊ."],
    ["РњРѕР¶РЅРѕ Р»Рё РІС‹Р±СЂР°С‚СЊ РѕС‚РґС‹С… РЅР° СЃРµРіРѕРґРЅСЏ?", "Р”Р°. РќР°РїРёС€РёС‚Рµ РІ MAX вЂ” РїРѕРґСЃРєР°Р¶РµРј, РєР°РєРёРµ РІР°СЂРёР°РЅС‚С‹ Р°РєС‚СѓР°Р»СЊРЅС‹ СЃРµРіРѕРґРЅСЏ Рё С‡С‚Рѕ Р»СѓС‡С€Рµ РІС‹Р±СЂР°С‚СЊ РїРѕ РїРѕРіРѕРґРµ."],
    ["Р§С‚Рѕ РІР·СЏС‚СЊ СЃ СЃРѕР±РѕР№?", "Р’РѕРґСѓ, СѓРґРѕР±РЅСѓСЋ РѕР±СѓРІСЊ, СЃРѕР»РЅС†РµР·Р°С‰РёС‚Сѓ, Р»С‘РіРєСѓСЋ РѕРґРµР¶РґСѓ РѕС‚ РІРµС‚СЂР°. Р”Р»СЏ РјРѕСЂСЏ Рё РєСѓРїР°РЅРёСЏ вЂ” РїРѕР»РѕС‚РµРЅС†Рµ."],
    ["РљР°Рє РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РїРѕРґРѕР№РґС‘С‚ РёРјРµРЅРЅРѕ РЅР°Рј?", "РќР°РїРёС€РёС‚Рµ СЃРѕСЃС‚Р°РІ РєРѕРјРїР°РЅРёРё, РІРѕР·СЂР°СЃС‚ РґРµС‚РµР№, Р¶РµР»Р°РµРјРѕРµ РІСЂРµРјСЏ Рё С„РѕСЂРјР°С‚ вЂ” СЃРїРѕРєРѕР№РЅС‹Р№, РєСЂР°СЃРёРІС‹Р№, Р°РєС‚РёРІРЅС‹Р№ РёР»Рё СЃРµРјРµР№РЅС‹Р№."]
  ]
};

function renderSnapshotRelatedLinks(pathname) {
  const config = snapshotRelatedLinks[pathname];
  if (!config) return "";

  const cards = config.links.map((item) => [
    `<a class="seo-link-card" href="${escapeHtml(withTrailingSlashPath(item.href))}" aria-label="${escapeHtml(item.title)}">`,
    `<span class="seo-link-title">${escapeHtml(item.title)}</span>`,
    `<span class="seo-link-teaser">${escapeHtml(item.teaser)}</span>`,
    '<span class="seo-link-cta" aria-hidden="true">в†’</span>',
    "</a>"
  ].join("")).join("");

  return [
    '<section class="seo-links section-card" aria-labelledby="seo-links-title">',
    `<div class="section-heading seo-links-head"><div><h2 id="seo-links-title">${escapeHtml(config.heading)}</h2><p>${escapeHtml(config.description)}</p></div></div>`,
    `<div class="seo-links-grid">${cards}</div>`,
    "</section>"
  ].join("");
}

function applySnapshotRelatedLinks(pathname, html) {
  const relatedSection = renderSnapshotRelatedLinks(pathname);
  if (!relatedSection) return html;

  if (/<section class="seo-links section-card" aria-labelledby="seo-links-title">/i.test(html)) {
    return html.replace(
      /<section class="seo-links section-card" aria-labelledby="seo-links-title">[\s\S]*?<\/section>/i,
      relatedSection
    );
  }

  return html.replace(
    /<section class="service-panel seo-cta" id="booking">/i,
    `${relatedSection}<section class="service-panel seo-cta" id="booking">`
  );
}

function renderFaqSectionMarkup(faqItems = []) {
  const articles = faqItems
    .map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`)
    .join("");
  return `<section class="faq-section section-card" aria-labelledby="seo-faq-title"><h2 id="seo-faq-title">Р§Р°СЃС‚С‹Рµ РІРѕРїСЂРѕСЃС‹</h2><div class="faq-grid">${articles}</div></section>`;
}

function applySnapshotFaqOverrides(pathname, html) {
  const faqItems = snapshotFaqOverrides[pathname];
  if (!Array.isArray(faqItems) || !faqItems.length) return html;

  let faqScriptPatched = false;
  const withJsonLd = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, jsonText) => {
    if (faqScriptPatched) return full;
    try {
      const data = JSON.parse(jsonText);
      if (data?.["@type"] !== "FAQPage" || !Array.isArray(data.mainEntity)) return full;
      data.mainEntity = faqItems.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      }));
      faqScriptPatched = true;
      return renderJsonLdScript(data);
    } catch {
      return full;
    }
  });

  return withJsonLd.replace(
    /<section class="faq-section section-card" aria-labelledby="seo-faq-title">[\s\S]*?<\/section>/,
    renderFaqSectionMarkup(faqItems)
  );
}

function toAbsoluteUrl(pathname) {
  return `${siteUrl}${withTrailingSlashPath(pathname)}`;
}

function appendJsonLdScripts(html, jsonLdList = []) {
  if (!Array.isArray(jsonLdList) || !jsonLdList.length) return html;
  const scriptMarkup = jsonLdList
    .map((jsonLd) => renderJsonLdScript(jsonLd, "    "))
    .join("\n");
  return html.includes("</head>")
    ? html.replace("</head>", `${scriptMarkup}\n  </head>`)
    : html;
}

function getTravelStructuredData() {
  const travelPath = "/travel/";
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: toAbsoluteUrl(travelPath),
      inLanguage: "ru-RU"
    },
    {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: siteName,
      url: toAbsoluteUrl(travelPath),
      telephone: contactPhone,
      areaServed: [
        { "@type": "Place", name: "РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР°" },
        { "@type": "Place", name: "РљСЂР°СЃРЅРѕРґР°СЂСЃРєРёР№ РєСЂР°Р№" }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "РџРѕРїСѓР»СЏСЂРЅС‹Рµ РЅР°РїСЂР°РІР»РµРЅРёСЏ РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      itemListElement: [
        { "@type": "ListItem", position: 1, url: toAbsoluteUrl("/morskie-progulki/"), name: "РњРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё" },
        { "@type": "ListItem", position: 2, url: toAbsoluteUrl("/vodopady/"), name: "Р’РѕРґРѕРїР°РґС‹" },
        { "@type": "ListItem", position: 3, url: toAbsoluteUrl("/s-detmi/"), name: "РЎ РґРµС‚СЊРјРё" },
        { "@type": "ListItem", position: 4, url: toAbsoluteUrl("/pogoda/"), name: "РџРѕРіРѕРґР°" },
        { "@type": "ListItem", position: 5, url: toAbsoluteUrl("/kuda-shodit/"), name: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ" }
      ]
    }
  ];
}

function getKontaktyStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: siteName,
      url: toAbsoluteUrl("/kontakty/"),
      telephone: contactPhone,
      areaServed: [
        { "@type": "Place", name: "РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР°" },
        { "@type": "Place", name: "РљСЂР°СЃРЅРѕРґР°СЂСЃРєРёР№ РєСЂР°Р№" }
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: contactPhone,
          areaServed: "RU",
          availableLanguage: ["ru"]
        }
      ]
    }
  ];
}

function getSnapshotStructuredData(pathname) {
  const snapshotMap = {
    "/morskie-progulki": {
      serviceName: "РњРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      serviceDescription: "Р’С‹С…РѕРґС‹ РІ РјРѕСЂРµ РЅР° РєР°С‚РµСЂРµ, РєСѓРїР°РЅРёРµ, СЂР°СЃРїРёСЃР°РЅРёРµ Рё СЃРµРјРµР№РЅС‹Рµ С„РѕСЂРјР°С‚С‹ РѕС‚РґС‹С…Р°.",
      listName: "РџРѕР»РµР·РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РїРѕ РјРѕСЂСЃРєРёРј РїСЂРѕРіСѓР»РєР°Рј",
      listPaths: [
        "/morskie-progulki/",
        "/chto-vzyat-na-morskuyu-progulku/",
        "/ceny-na-morskie-progulki-arhipo-osipovka/",
        "/morskaya-progulka-s-detmi-arhipo-osipovka/"
      ]
    },
    "/vodopady": {
      serviceName: "Р’РѕРґРѕРїР°РґС‹ СЂСЏРґРѕРј СЃ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРѕР№",
      serviceDescription: "РњР°СЂС€СЂСѓС‚С‹ Рє РІРѕРґРѕРїР°РґР°Рј Рё РїСЂРёСЂРѕРґРЅС‹Рј С‚РѕС‡РєР°Рј РІ С„РѕСЂРјР°С‚Рµ РЅР°Р·РµРјРЅРѕРіРѕ РѕС‚РґС‹С…Р° Сѓ РјРѕСЂСЏ.",
      listName: "РџРѕР»РµР·РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РїРѕ РІРѕРґРѕРїР°РґР°Рј Рё РјР°СЂС€СЂСѓС‚Р°Рј",
      listPaths: [
        "/vodopady/",
        "/kuda-shodit/",
        "/chto-posmotret-v-arhipo-osipovke/"
      ]
    },
    "/s-detmi": {
      serviceName: "РћС‚РґС‹С… СЃ РґРµС‚СЊРјРё РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      serviceDescription: "РЎРїРѕРєРѕР№РЅС‹Рµ СЃРµРјРµР№РЅС‹Рµ С„РѕСЂРјР°С‚С‹, РєРѕСЂРѕС‚РєРёРµ РїСЂРѕРіСѓР»РєРё Рё СЃС†РµРЅР°СЂРёРё СЃ РјСЏРіРєРёРј С‚РµРјРїРѕРј РґРЅСЏ.",
      listName: "РџРѕР»РµР·РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ СЃРµРјРµР№РЅРѕРіРѕ РѕС‚РґС‹С…Р°",
      listPaths: [
        "/s-detmi/",
        "/morskaya-progulka-s-detmi-arhipo-osipovka/",
        "/kuda-shodit/",
        "/pogoda/"
      ]
    },
    "/pogoda": {
      serviceName: "РџРѕРіРѕРґР° Рё РІС‹Р±РѕСЂ РјР°СЂС€СЂСѓС‚Р° РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      serviceDescription: "РђРєС‚СѓР°Р»СЊРЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РїРѕ РІС‹Р±РѕСЂСѓ С„РѕСЂРјР°С‚Р° РѕС‚РґС‹С…Р° РІ РјРѕСЂРµ, РіРѕСЂР°С… Рё РЅР°Р±РµСЂРµР¶РЅРѕР№.",
      listName: "РџРѕР»РµР·РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ РІС‹Р±РѕСЂР° РїРѕ РїРѕРіРѕРґРµ",
      listPaths: [
        "/pogoda/",
        "/morskie-progulki/",
        "/vodopady/",
        "/kuda-shodit/"
      ]
    },
    "/kuda-shodit": {
      serviceName: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      serviceDescription: "РРґРµРё РїСЂРѕРіСѓР»РѕРє Сѓ РјРѕСЂСЏ, РІ РіРѕСЂР°С… Рё РІРµС‡РµСЂРЅРёРµ РјР°СЂС€СЂСѓС‚С‹ РїРѕ РєСѓСЂРѕСЂС‚Сѓ.",
      listName: "РџРѕР»РµР·РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РґР»СЏ РїСЂРѕРіСѓР»РѕРє РїРѕ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ",
      listPaths: [
        "/kuda-shodit/",
        "/kuda-shodit-vecherom-v-arhipo-osipovke/",
        "/chto-posmotret-v-arhipo-osipovke/",
        "/s-detmi/",
        "/pogoda/"
      ]
    }
  };

  const snapshotConfig = snapshotMap[pathname];
  if (!snapshotConfig) return [];

  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: snapshotConfig.serviceName,
      description: snapshotConfig.serviceDescription,
      areaServed: [
        { "@type": "Place", name: "РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР°" },
        { "@type": "Place", name: "РљСЂР°СЃРЅРѕРґР°СЂСЃРєРёР№ РєСЂР°Р№" }
      ],
      provider: {
        "@type": "TravelAgency",
        name: siteName,
        url: toAbsoluteUrl("/travel/")
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: snapshotConfig.listName,
      itemListElement: snapshotConfig.listPaths.map((pagePath, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: toAbsoluteUrl(pagePath)
      }))
    }
  ];
}

function getPoiStructuredData(pathname) {
  if (pathname !== "/chto-posmotret-v-arhipo-osipovke") return [];

  const pageUrl = toAbsoluteUrl("/chto-posmotret-v-arhipo-osipovke/");
  const poiNames = [
    "РџСЂРёРјРѕСЂСЃРєРёР№ Р±СѓР»СЊРІР°СЂ",
    "Р“РѕСЂР° РЃР¶РёРє",
    "РњРёС…Р°Р№Р»РѕРІСЃРєРѕРµ СѓРєСЂРµРїР»РµРЅРёРµ",
    "РњСѓР·РµР№ С…Р»РµР±Р° Рё РІРёРЅР°",
    "Р¦РµРЅС‚СЂР°Р»СЊРЅС‹Р№ РїР»СЏР¶",
    "РџРѕРґРІРµСЃРЅРѕР№ РјРѕСЃС‚ С‡РµСЂРµР· Р’СѓР»Р°РЅ"
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Р РµР°Р»СЊРЅС‹Рµ С‚РѕС‡РєРё Рё РјР°СЂС€СЂСѓС‚С‹ РЅР° РєР°СЂС‚Рµ",
      itemListElement: poiNames.map((poiName, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "TouristAttraction",
          name: poiName,
          url: pageUrl
        }
      }))
    }
  ];
}

async function writeRuntimeHomeBlocksModule() {
  const runtimeModule = [
    `export const HOME_SECTION_ORDER = ${JSON.stringify(HOME_SECTION_ORDER, null, 2)};`,
    `export const HOME_BLOCKS = ${JSON.stringify(HOME_BLOCKS, null, 2)};`,
    ""
  ].join("\n");
  await writeFile(path.join(dist, "home-blocks.js"), runtimeModule, "utf8");
}

async function writeRuntimeCatalogRenderer() {
  const renderer = await readFile(path.join(projectRoot, "catalog-renderer.js"), "utf8");
  await writeFile(
    path.join(dist, "catalog-renderer.js"),
    renderer.replace("./home-blocks.mjs?v=20260506-home-icons-clean", "./home-blocks.js?v=20260507-static-mime"),
    "utf8"
  );
}

async function collectTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectTextFiles(fullPath);
    return /\.(?:html|css|js|mjs|txt|xml)$/i.test(entry.name) ? [fullPath] : [];
  }));
  return files.flat();
}

async function copyReferencedPublicAssets() {
  const textFiles = await collectTextFiles(dist);
  const assetPaths = new Set();
  const assetPattern = /(?:https?:\/\/[^/"')\s]+\/|(?:\.\.\/|\.\/|\/)?)((?:fotoref|videoref)\/[^"')\s?#]+)/g;

  for (const filePath of textFiles) {
    const text = await readFile(filePath, "utf8");
    for (const match of text.matchAll(assetPattern)) {
      assetPaths.add(match[1].replace(/\\/g, "/"));
    }
  }

  await Promise.all([...assetPaths].map(async (assetPath) => {
    const source = path.join(projectRoot, assetPath);
    const target = path.join(dist, assetPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }));
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(path.join(dist, "data"), { recursive: true });

await Promise.all([
  copyFile(path.join(projectRoot, "styles.css"), path.join(dist, "styles.css")),
  copyFile(path.join(projectRoot, "_headers"), path.join(dist, "_headers")),
  copyFile(path.join(projectRoot, "llms.txt"), path.join(dist, "llms.txt")),
  copyFile(path.join(projectRoot, "activities-catalog.js"), path.join(dist, "activities-catalog.js")),
  copyFile(path.join(projectRoot, "data", "content-fallback.json"), path.join(dist, "data", "content-fallback.json")),
  writeRuntimeCatalogRenderer(),
  writeRuntimeHomeBlocksModule(),
  copyFile(path.join(projectRoot, "weather-widget.js"), path.join(dist, "weather-widget.js")),
  copyFile(path.join(projectRoot, "hero-media.js"), path.join(dist, "hero-media.js")),
  copyFile(path.join(projectRoot, "legal.js"), path.join(dist, "legal.js"))
]);

const travelRoot = path.join(dist, "travel");
await mkdir(travelRoot, { recursive: true });
const homeHtml = normalizeFooterShell(
  normalizeLandingHeroShell(
    await readFile(path.join(projectRoot, "index.html"), "utf8"),
    { brandHref: "#top", fallbackPrimaryHref: "#popular" }
  ),
  { homeHref: "/travel/" }
);
await writeFile(
  path.join(travelRoot, "index.html"),
  appendJsonLdScripts(homeHtml, getTravelStructuredData()),
  "utf8"
);
await writeRouteHtml("/", renderRedirectPage({
  toPath: "/travel/",
  canonicalPath: "/travel/",
  title: "РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР° СЃРµРіРѕРґРЅСЏ вЂ” /travel",
  robotsContent: "index, follow"
}));

await Promise.all([
  ...activitiesCatalog.map(async (activity) => {
    const pageDir = path.join(travelRoot, getActivitySlug(activity));
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), renderServicePage(activity), "utf8");
  }),
  ...categoryPages.map(async (category) => {
    const pageDir = path.join(travelRoot, category.slug);
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), renderCategoryPage(category), "utf8");
  }),
  ...snapshotSeoPaths.map(async (pathname) => {
    const pageDir = path.join(dist, pathname.slice(1));
    await mkdir(pageDir, { recursive: true });
    const snapshotFile = path.join(projectRoot, "seo-snapshots", pathname.slice(1), "index.html");
    const rawSnapshotHtml = await readFile(snapshotFile, "utf8");
    const snapshotHtml = appendJsonLdScripts(
      deferSnapshotCardPhotos(applyCmsCatalogToSnapshot(
        pathname,
        applySnapshotRelatedLinks(
          pathname,
          applySnapshotFaqOverrides(pathname, normalizeSnapshotHtml(rawSnapshotHtml))
        )
      )),
      getSnapshotStructuredData(pathname)
    );
    const html = normalizeFooterShell(
      ensureQuadDirectionCard(
        normalizeLandingHeroShell(snapshotHtml, { fallbackPrimaryHref: "#popular" })
      ),
      { homeHref: "/travel/" }
    );
    await writeFile(path.join(pageDir, "index.html"), html, "utf8");
  }),
  ...newSeoPages.map(async (page) => {
    const pageDir = path.join(dist, page.path.slice(1));
    await mkdir(pageDir, { recursive: true });
    await writeFile(
      path.join(pageDir, "index.html"),
      appendJsonLdScripts(renderNewSeoPage(page.path), getPoiStructuredData(page.path)),
      "utf8"
    );
  }),
  ...canonicalLegalRoutes.map(async (route) => {
    const pageDir = path.join(dist, route.slice(1));
    await mkdir(pageDir, { recursive: true });
    const legalHtml = renderLegalPage(route);
    await writeFile(
      path.join(pageDir, "index.html"),
      route === "/kontakty" ? appendJsonLdScripts(legalHtml, getKontaktyStructuredData()) : legalHtml,
      "utf8"
    );
  })
]);

await Promise.all(aliasRedirects.map(async ([aliasPath, canonicalPath]) => {
  await writeRouteHtml(aliasPath, renderRedirectPage({
    toPath: canonicalPath,
    canonicalPath,
    title: `РџРµСЂРµР°РґСЂРµСЃР°С†РёСЏ РЅР° ${canonicalPath}`
  }));
}));

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapPaths.map((pathname) => `  <url><loc>${toAbsoluteUrl(pathname)}</loc></url>`),
  "</urlset>"
].join("\n");
await writeFile(path.join(dist, "sitemap.xml"), sitemapXml, "utf8");

const robotsTxt = [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${toAbsoluteUrl("/sitemap.xml")}`
].join("\n");
await writeFile(path.join(dist, "robots.txt"), robotsTxt, "utf8");

await copyReferencedPublicAssets();

console.log("Static landing and SEO pages built to dist/");


