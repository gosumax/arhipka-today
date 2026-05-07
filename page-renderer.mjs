import { activitiesCatalog } from "./activities-catalog.js";
import {
  contactPhone,
  contactPhoneHref,
  maxLink,
  renderUnifiedFooter,
  renderUnifiedHeroActions,
  renderUnifiedHeroHeader,
  renderUnifiedServiceHeader
} from "./hero-header-shell.mjs";

export const imageClassByKey = {
  sea: "sea-bg",
  waterfall: "waterfall-bg",
  kids: "kids-bg",
  sunset: "sunset-bg",
  sunsetBoat: "sunset-boat-bg",
  route: "route-bg",
  jeep: "jeep-bg",
  sup: "sup-bg",
  diving: "diving-bg",
  divingShip: "diving-ship-bg",
  stalactiteGrotto: "stalactite-grotto-bg",
  waterfallStairs: "waterfall-stairs-bg",
  eagleRock: "eagle-rock-bg",
  silverWaterfalls: "silver-waterfalls-bg",
  speedBoat: "speed-boat-bg",
  classicBoat: "classic-boat-bg",
  privateBoat: "private-boat-bg",
  seaFishing: "sea-fishing-bg",
  jetski: "jetski-bg",
  dolmenVillage: "dolmen-village-bg",
  yinYangPark: "yin-yang-park-bg",
  lavenderFarm: "lavender-farm-bg",
  lezginkaMountains: "lezginka-mountains-bg",
  busTour: "bus-tour-bg",
  horseRide: "horse-ride-bg",
  enduro: "enduro-bg",
  quad: "quad-bg",
  pshadaWaterfalls: "pshada-waterfalls-bg",
  kuagoWaterfalls: "kuago-waterfalls-bg",
  enduroPro: "enduro-pro-bg",
  quadPrivate: "quad-private-bg",
  horse2h: "horse-2h-bg",
  horse3h: "horse-3h-bg"
};

export const categoryPages = [
  {
    slug: "more",
    label: "Море",
    title: "Морские прогулки и активности",
    lead: "Катер, купание, SUP, дайвинг и рыбалка в Архипо-Осиповке.",
    categoryIds: ["sea"],
    imageKey: "sea",
    tags: ["Катера", "Купание", "Рыбалка", "SUP", "Дайвинг"]
  },
  {
    slug: "vodopady-dzhipping",
    label: "Водопады / джиппинг",
    title: "Водопады и горные маршруты",
    lead: "Поездки к водопадам, джип-маршруты и красивые природные локации.",
    categoryIds: ["waterfalls", "jeeping"],
    imageKey: "jeep",
    tags: ["Пшадские", "Бжидские", "Куаго", "Дольмены", "Горы"]
  },
  {
    slug: "kvadrotsikly-ekstrim",
    label: "Квадро и эндуро",
    title: "Квадроциклы и эндуро",
    lead: "Квадроциклы, эндуро и активные маршруты 2,5-3 часа для тех, кто выбирает драйв.",
    categoryIds: ["quads"],
    imageKey: "quad",
    tags: ["Квадро", "Эндуро", "Горы", "Активно"]
  },
  {
    slug: "ekskursii",
    label: "Экскурсии",
    title: "Экскурсии в Архипо-Осиповке",
    lead: "Подборка маршрутов на день: природа, виды и интересные места.",
    includeIds: [
      "pshada-waterfalls-jeep",
      "stalactite-grotto-jeep",
      "bzhid-waterfalls-jeep",
      "silver-waterfalls",
      "kuago-waterfalls-jeep",
      "dolmen-village-jeep",
      "yin-yang-park",
      "lavender-farm",
      "eagle-rock",
      "lezginka-mountains",
      "bus-tour",
      "horse-1h",
      "horse-2h",
      "horse-3h"
    ],
    imageKey: "route",
    tags: ["Маршруты", "Горы", "Водопады", "Фото", "Семейно"]
  },
  {
    slug: "s-detmi",
    label: "С детьми",
    title: "Отдых с детьми в Архипо-Осиповке",
    lead: "Спокойные форматы и семейные маршруты с удобной длительностью.",
    categoryIds: ["kids"],
    imageKey: "kids",
    tags: ["Семейно", "Мягкий темп", "Прогулки", "Море", "Маршруты"]
  }
];

const siteName = "Архипо-Осиповка сегодня";
const siteDomain = "архипо-осиповка-сегодня.online";
const canonicalBaseUrl = "https://arhipka-today.ru";
export const consentVersion = "2026-05-03";

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const safeJsonLdStringify = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ({
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
})[char]);

const withTrailingSlash = (url = "") => {
  if (!url || url === "/" || url.endsWith("/")) return url;
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/api/")) return url;
  const match = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const path = match?.[1] || url;
  const query = match?.[2] || "";
  const hash = match?.[3] || "";
  if (path === "/" || path.endsWith("/") || /\.[a-z0-9]+$/i.test(path)) return url;
  return `${path}/${query}${hash}`;
};

export const getActivitySlug = (activity) => activity.slug || activity.id;
export const getActivityPath = (activity) => `/travel/${getActivitySlug(activity)}/`;
export const getCategoryPath = (category) => `/travel/${category.slug}/`;

function getSlugFromPath(pathname) {
  return decodeURIComponent(pathname).replace(/^\/travel\/?/, "").replace(/\/+$/, "");
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function renderHeader() {
  return renderUnifiedServiceHeader({ primaryHref: "/travel/#popular" });
}

function renderPage({ title, description, canonicalPath, body, jsonLd, bodyClass = "", includeHeader = true }) {
  const canonicalUrl = canonicalPath.startsWith("http://") || canonicalPath.startsWith("https://")
    ? canonicalPath
    : `${canonicalBaseUrl}${withTrailingSlash(canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`)}`;
  const socialImageUrl = `${canonicalBaseUrl}/fotoref/more-hero.jpg`;
  const ogType = canonicalUrl === `${canonicalBaseUrl}/travel/` ? "website" : "article";
  const bodyClassAttr = bodyClass ? ` class="${escapeHtml(bodyClass)}"` : "";
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${socialImageUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="Архипка Travel" />
    <meta property="og:locale" content="ru_RU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${socialImageUrl}" />
    <link rel="stylesheet" href="/styles.css?v=20260507-mobile-menu-close" />
    <link rel="preload" as="image" href="/fotoref/more-hero-mobile.jpg" media="(max-width: 760px)" fetchpriority="high" />
    <link rel="preload" as="image" href="/fotoref/more-hero.jpg" media="(min-width: 761px)" fetchpriority="high" />
    <script type="application/ld+json">${safeJsonLdStringify(jsonLd)}</script>
  </head>
  <body${bodyClassAttr}>
    <div class="site-shell">
      ${includeHeader ? renderHeader() : ""}
      ${body}
      ${renderUnifiedFooter({ homeHref: "/travel/" })}
    </div>
    <script src="/hero-media.js?v=20260507-mobile-menu-close" defer></script>
    <script src="/legal.js" defer></script>
  </body>
</html>`;
}

function renderList(items = []) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function getIncluded(activity) {
  return unique(activity.includes || []).slice(0, 10);
}

function getRoutePoints(activity) {
  return unique(activity.route || []).slice(0, 10);
}

function getFaq(activity) {
  return (activity.faq || []).slice(0, 10);
}

function getBestFor(activity) {
  return unique(activity.bestFor || []).slice(0, 6);
}

function getWhatToBring(activity) {
  return unique(activity.whatToBring || []).slice(0, 6);
}

function getContextualMaxCta(activity) {
  if (activity?.ctaLabel) return activity.ctaLabel;

  const ids = activity?.categoryIds || [];
  const slug = getActivitySlug(activity);

  if (slug === "lavender-farm") return "Уточнить лучшее время для фото";
  if (ids.includes("horses")) return "Подобрать конную прогулку по опыту";
  if (ids.includes("waterfalls") || ids.includes("jeeping")) return "Спросить, какие водопады выбрать";
  if (ids.includes("quads")) return "Уточнить сложность маршрута";
  if (ids.includes("sea") || ids.includes("diving") || ids.includes("sup")) return "Уточнить выход в море сегодня";
  if (ids.includes("kids")) return "Спросить, какой формат подойдет детям";
  if (ids.includes("evening")) return "Подобрать вечерний маршрут";
  return "Уточнить цену и свободное время";
}

function renderServiceSeeAlso(activity) {
  const slug = getActivitySlug(activity);
  const relatedBySlug = {
    "classic-boat-1h": [
      ["/travel/speed-boat-2h", "Скоростная морская прогулка 2 часа"],
      ["/travel/speed-boat-3h", "Скоростная морская прогулка 3 часа"],
      ["/travel/private-boat", "Индивидуальный катер"],
      ["/travel/sea-fishing-2h", "Морская рыбалка"],
      ["/progulka-na-zakate-arhipo-osipovka", "Прогулка на закате"],
      ["/ceny-na-morskie-progulki-arhipo-osipovka", "Цены на морские прогулки"],
      ["/morskaya-progulka-s-detmi-arhipo-osipovka", "Морская прогулка с детьми"],
      ["/chto-vzyat-na-morskuyu-progulku", "Что взять на морскую прогулку"]
    ],
    "speed-boat-2h": [
      ["/travel/classic-boat-1h", "Спокойная морская прогулка"],
      ["/travel/speed-boat-3h", "Скоростная морская прогулка 3 часа"],
      ["/travel/private-boat", "Индивидуальный катер"],
      ["/morskie-progulki", "Все морские прогулки"],
      ["/progulka-na-zakate-arhipo-osipovka", "Прогулка на закате"],
      ["/ceny-na-morskie-progulki-arhipo-osipovka", "Цены на морские прогулки"],
      ["/kuda-shodit-vecherom-v-arhipo-osipovke", "Куда сходить вечером"],
      ["/chto-vzyat-na-morskuyu-progulku", "Что взять на морскую прогулку"]
    ],
    "private-boat": [
      ["/travel/classic-boat-1h", "Классическая морская прогулка"],
      ["/travel/speed-boat-2h", "Скоростной катер"],
      ["/progulka-na-zakate-arhipo-osipovka", "Прогулка на закате"],
      ["/ceny-na-morskie-progulki-arhipo-osipovka", "Цены на морские прогулки"],
      ["/morskaya-progulka-s-detmi-arhipo-osipovka", "Морская прогулка с детьми"],
      ["/kuda-shodit-vecherom-v-arhipo-osipovke", "Вечерние маршруты у моря"]
    ],
    "sea-fishing-2h": [
      ["/travel/classic-boat-1h", "Спокойная морская прогулка"],
      ["/travel/private-boat", "Индивидуальный катер"],
      ["/morskie-progulki", "Все морские прогулки"],
      ["/progulka-na-zakate-arhipo-osipovka", "Прогулка на закате"],
      ["/ceny-na-morskie-progulki-arhipo-osipovka", "Цены на морские прогулки"]
    ],
    "speed-boat-3h": [
      ["/travel/classic-boat-1h", "Классическая морская прогулка"],
      ["/travel/speed-boat-2h", "Скоростная морская прогулка 2 часа"],
      ["/travel/private-boat", "Индивидуальный катер"],
      ["/morskie-progulki", "Все морские прогулки"],
      ["/progulka-na-zakate-arhipo-osipovka", "Прогулка на закате"],
      ["/ceny-na-morskie-progulki-arhipo-osipovka", "Цены на морские прогулки"]
    ],
    "enduro-1h": [
      ["/travel/quad-25-3h", "Квадроциклы 2.5-3 часа"],
      ["/travel/enduro-pro", "Эндуро PRO"],
      ["/travel/quad-private", "Индивидуальный квадро-тур"],
      ["/travel/kvadrotsikly-ekstrim", "Все квадроциклы и эндуро"],
      ["/kuda-shodit", "Куда сходить в Архипо-Осиповке"]
    ],
    "enduro-pro": [
      ["/travel/enduro-1h", "Эндуро (1 час)"],
      ["/travel/quad-25-3h", "Квадроциклы 2.5-3 часа"],
      ["/travel/quad-private", "Индивидуальный квадро-тур"],
      ["/travel/kvadrotsikly-ekstrim", "Все квадроциклы и эндуро"],
      ["/kuda-shodit", "Куда сходить в Архипо-Осиповке"]
    ],
    "quad-25-3h": [
      ["/travel/enduro-1h", "Эндуро (1 час)"],
      ["/travel/enduro-pro", "Эндуро PRO"],
      ["/travel/quad-private", "Индивидуальный квадро-тур"],
      ["/travel/kvadrotsikly-ekstrim", "Все квадроциклы и эндуро"],
      ["/kuda-shodit", "Куда сходить в Архипо-Осиповке"]
    ],
    "quad-private": [
      ["/travel/quad-25-3h", "Квадроциклы 2.5-3 часа"],
      ["/travel/enduro-1h", "Эндуро (1 час)"],
      ["/travel/enduro-pro", "Эндуро PRO"],
      ["/travel/kvadrotsikly-ekstrim", "Все квадроциклы и эндуро"],
      ["/kuda-shodit", "Куда сходить в Архипо-Осиповке"]
    ]
  };
  const related = relatedBySlug[slug];
  if (!related?.length) return "";

  return [
    '<section class="service-panel" aria-labelledby="service-related-title">',
    '<h2 id="service-related-title">\u0421\u043c\u043e\u0442\u0440\u0438\u0442\u0435 \u0442\u0430\u043a\u0436\u0435</h2>',
    '<ul class="service-list">',
    related.map(([href, label]) => `<li><a href="${withTrailingSlash(href)}">${escapeHtml(label)}</a></li>`).join(""),
    "</ul>",
    "</section>"
  ].join("");
}

function renderFacts(activity) {
  const facts = [
    ["Длительность", activity.duration || "Уточняется"],
    ["Цена", activity.price || "По запросу"],
    ["Старт", activity.startTimes || "По согласованию"],
    ["Место старта", activity.location || "Уточняется"]
  ];

  return [
    '<div class="service-facts" aria-label="Ключевые параметры услуги">',
    facts.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong><em>${escapeHtml(value)}</em></span>`).join(""),
    "</div>"
  ].join("");
}

function renderTags(tags = []) {
  return `<div class="content-tags">${tags.slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function hasStructuredOfferPrice(priceValue = "") {
  const normalized = String(priceValue || "").toLowerCase();
  if (!normalized) return false;
  if (/по\s*запрос/.test(normalized)) return false;
  return /\d/.test(normalized);
}

function renderDirectionsSection() {
  const directionLinks = [
    ["/travel/more/", "Морские прогулки", "Катер, купание и морские форматы отдыха."],
    ["/travel/vodopady-dzhipping/", "Водопады", "Маршруты к водопадам и выезды в горы."],
    ["/travel/ekskursii/", "Экскурсии", "Подборка маршрутов на день и интересных мест."],
    ["/travel/kvadrotsikly-ekstrim/", "Квадро и эндуро", "Квадроциклы, эндуро и активные маршруты 2,5-3 часа."],
    ["/travel/s-detmi/", "С детьми", "Спокойные форматы и семейные сценарии отдыха."],
    ["/pogoda/", "Погода", "Погода и море перед выбором маршрута на сегодня."]
  ];

  return [
    '<section class="seo-links section-card" aria-labelledby="category-directions-title">',
    '<div class="section-heading seo-links-head"><div><h2 id="category-directions-title">Другие направления</h2><p>Единый набор разделов для быстрого выбора формата отдыха.</p></div></div>',
    '<div class="seo-links-grid">',
    directionLinks.map(([href, title, teaser]) => `<a class="seo-link-card" href="${href}" aria-label="${escapeHtml(title)}"><span class="seo-link-title">${escapeHtml(title)}</span><span class="seo-link-teaser">${escapeHtml(teaser)}</span><span class="seo-link-cta" aria-hidden="true">→</span></a>`).join(""),
    "</div>",
    "</section>"
  ].join("");
}

export function getCategoryActivities(category) {
  if (!category) return [];
  if (Array.isArray(category.includeIds) && category.includeIds.length) {
    const set = new Set(category.includeIds);
    return activitiesCatalog.filter((activity) => set.has(getActivitySlug(activity)));
  }

  const ids = new Set(category.categoryIds || []);
  return activitiesCatalog.filter((activity) => (activity.categoryIds || []).some((id) => ids.has(id)));
}

function getActivityEntityLabel(activity) {
  const title = String(activity?.title || "").toLowerCase();
  const category = String(activity?.category || "").toLowerCase();
  const slug = String(getActivitySlug(activity) || "").toLowerCase();
  const context = `${title} ${category} ${slug}`;

  if (/(приморский|набереж)/i.test(context)) return "Приморский бульвар в Архипо-Осиповке, Краснодарский край";
  if (/(гора.*ежик|гора.*ёжик|ежик|ёжик)/i.test(context)) return "Гора Ёжик и вид на море в Архипо-Осиповке";
  if (/(михайловск|укреплен)/i.test(context)) return "Михайловское укрепление в Архипо-Осиповке";
  if (/(музей|хлеба и вина)/i.test(context)) return "Музей хлеба и вина в Архипо-Осиповке";
  if (/(вулан|мост)/i.test(context)) return "Подвесной мост через реку Вулан в Архипо-Осиповке";
  if (/(центральный пляж|закат)/i.test(context)) return "Центральный пляж Архипо-Осиповки на закате";
  if (/(квадро|эндуро)/i.test(context)) return "Квадро и эндуро в Архипо-Осиповке";
  if (/(джип|водопад|kuago|pshada)/i.test(context)) return "Водопады и горные маршруты рядом с Архипо-Осиповкой";
  if (/(с детьми|семейн|дет)/i.test(context)) return "Отдых с детьми в Архипо-Осиповке у Чёрного моря";
  if (/(погод|ветер|волна)/i.test(context)) return "Погода в Архипо-Осиповке и состояние Чёрного моря";
  if (/(море|катер|морск|рыбал|sup|дайв|гидроцикл|jetski)/i.test(context)) return "Морская прогулка на катере в Архипо-Осиповке, Чёрное море";
  if (/(вечер|закат)/i.test(context)) return "Прогулка на закате у Чёрного моря в Архипо-Осиповке";

  return `${activity.title} в Архипо-Осиповке`;
}

function getEntityDataValue(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function renderActivityCard(activity, compact = true) {
  const imageClass = imageClassByKey[activity.imageKey] || "route-bg";
  const tags = [...(activity.bestFor || []), ...(activity.tags || [])].slice(0, 3);
  const entityLabel = getActivityEntityLabel(activity);
  return [
    `<a class="activity-card${compact ? " activity-card-compact" : ""}" href="${getActivityPath(activity)}" aria-label="${escapeHtml(activity.title)}">`,
    `<div class="activity-cover image-placeholder card-photo ${imageClass} card-photo-lazy" role="img" aria-label="${escapeHtml(entityLabel)}" data-entity="${escapeHtml(getEntityDataValue(entityLabel))}"><span class="badge badge-float">${escapeHtml(activity.category)}</span></div>`,
    '<div class="activity-body">',
    `<div class="activity-title-row"><h3>${escapeHtml(activity.title)}</h3><span class="format-badge">${escapeHtml(activity.format || "Формат")}</span></div>`,
    `<p>${escapeHtml(activity.shortDescription || activity.short || "")}</p>`,
    `<div class="activity-facts"><span>${escapeHtml(activity.price || "По запросу")}</span><span>${escapeHtml(activity.duration || "Уточняется")}</span><span>${escapeHtml(activity.location || "")}</span></div>`,
    `<div class="activity-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`,
    '<div class="activity-actions"><span class="text-button button-small">Подробнее</span><span class="activity-arrow" aria-hidden="true">></span></div>',
    "</div>",
    "</a>"
  ].join("");
}

const legalDocuments = {
  "/privacy": {
    title: "Политика обработки персональных данных",
    description: "Правила обработки и защиты персональных данных на сайте.",
    content: `
      <h1>Политика обработки персональных данных</h1>
      <p class="muted">Версия ${consentVersion}.</p>
      <p>Мы обрабатываем персональные данные только в объеме, необходимом для связи с пользователем и подбора отдыха.</p>
      <h2>Какие данные могут обрабатываться</h2>
      <ul><li>Имя и контактные данные, которые пользователь сообщает при обращении.</li><li>Технические данные: IP-адрес, cookie, user-agent.</li></ul>
      <h2>Цели обработки</h2>
      <ul><li>Ответ на обращение пользователя.</li><li>Подбор подходящего формата отдыха.</li><li>Выполнение требований законодательства РФ.</li></ul>
      <h2>Контакты оператора</h2>
      <p>Контактный телефон: <a href="tel:${contactPhoneHref}">${contactPhone}</a></p>
      <p>MAX: <a href="${maxLink}" target="_blank" rel="noopener noreferrer">${maxLink}</a></p>
    `
  },
  "/personal-data-consent": {
    title: "Согласие на обработку персональных данных",
    description: "Форма согласия пользователя на обработку персональных данных.",
    content: `
      <h1>Согласие на обработку персональных данных</h1>
      <p class="muted">Версия ${consentVersion}.</p>
      <p>Пользователь подтверждает согласие на обработку персональных данных, переданных через формы или мессенджер MAX, для целей обратной связи и подбора отдыха.</p>
      <p>Согласие действует до его отзыва пользователем в установленном законом порядке.</p>
    `
  },
  "/marketing-consent": {
    title: "Согласие на получение рекламных сообщений",
    description: "Согласие на получение информационных и рекламных сообщений.",
    content: `
      <h1>Согласие на получение рекламных сообщений</h1>
      <p class="muted">Версия ${consentVersion}.</p>
      <p>Пользователь вправе отдельно согласиться на получение рекламных и информационных сообщений. Отказ или отзыв согласия не влияет на возможность получить консультацию по отдыху.</p>
    `
  },
  "/cookie-policy": {
    title: "Политика cookie",
    description: "Порядок использования cookie-файлов на сайте.",
    content: `
      <h1>Политика cookie</h1>
      <p class="muted">Версия ${consentVersion}.</p>
      <p>Сайт использует технические cookie, необходимые для корректной работы страниц. Аналитические cookie могут применяться только при наличии соответствующего основания.</p>
      <h2>Управление cookie</h2>
      <p>Пользователь может отключить или ограничить cookie в настройках браузера.</p>
    `
  },
  "/kontakty": {
    title: "Контакты",
    description: "Контакты сайта и оператора персональных данных.",
    content: `
      <h1>Контакты</h1>
      <p>По вопросам прогулок и экскурсий:</p>
      <p><a class="button button-primary" href="tel:${contactPhoneHref}">${contactPhone}</a></p>
      <p><a class="button button-ghost" href="tel:${contactPhoneHref}">Позвонить</a></p>
      <p>Сайт: ${siteDomain}</p>
    `
  }
};

legalDocuments["/contacts"] = legalDocuments["/kontakty"];
legalDocuments["/privacy-policy"] = legalDocuments["/privacy"];

export function renderLegalPage(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const doc = legalDocuments[normalizedPath];
  if (!doc) return null;

  const canonicalPathByAlias = {
    "/contacts": "/kontakty",
    "/privacy-policy": "/privacy"
  };

  return renderPage({
    title: doc.title,
    description: doc.description,
    canonicalPath: `${canonicalBaseUrl}${withTrailingSlash(canonicalPathByAlias[normalizedPath] || normalizedPath)}`,
    body: `<main class="legal-page"><article class="legal-document section-card">${doc.content}</article></main>`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: doc.title,
      description: doc.description
    }
  });
}

export function renderServicePage(activity) {
  const imageClass = imageClassByKey[activity.imageKey] || "route-bg";
  const title = `${activity.title} в Архипо-Осиповке`;
  const serviceDescription = activity.description || activity.shortDescription || activity.short || "";
  const description = `${serviceDescription} Цена: ${activity.price}. Длительность: ${activity.duration}.`;
  const included = getIncluded(activity);
  const routePoints = getRoutePoints(activity);
  const faq = getFaq(activity);
  const bestFor = getBestFor(activity);
  const whatToBring = getWhatToBring(activity);
  const weatherAdvice = activity.weatherAdvice || "Погодные условия уточняются перед стартом.";
  const childrenAdvice = activity.childrenAdvice || "Подходит ли формат детям — уточняйте заранее.";
  const contextualCtaText = getContextualMaxCta(activity);

  const body = [
    '<main class="service-page service-page-hero">',
    `<section class="service-hero service-hero-cover section-card ${imageClass}">`,
    '<div class="service-hero-copy">',
    `<p class="eyebrow catalog-eyebrow">${escapeHtml(activity.category)}</p>`,
    `<h1>${escapeHtml(title)}</h1>`,
    '<div class="service-hero-meta">',
    renderFacts(activity),
    "</div>",
    "</div>",
    "</section>",
    '<section class="service-layout">',
    '<div class="service-main">',
    `<section class="service-panel"><h2>Описание</h2><p>${escapeHtml(serviceDescription)}</p></section>`,
    '<section class="service-panel"><h2>Кому подходит</h2>' + renderList(bestFor) + "</section>",
    '<section class="service-panel"><h2>Что входит</h2>' + renderList(included) + "</section>",
    '<section class="service-panel"><h2>Маршрут / формат</h2>' + renderList(routePoints) + "</section>",
    '<section class="service-panel"><h2>Что взять с собой</h2>' + renderList(whatToBring) + "</section>",
    '<section class="service-panel"><h2>Важно по погоде</h2><p>' + escapeHtml(weatherAdvice) + "</p></section>",
    '<section class="service-panel"><h2>Подходит ли детям</h2><p>' + escapeHtml(childrenAdvice) + "</p></section>",
    renderServiceSeeAlso(activity),
    '<section class="service-panel"><h2>Частые вопросы</h2><div class="service-faq">',
    faq.map((item) => `<article><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join(""),
    `</div><p class="scenario-actions"><a class="button button-ghost" href="tel:${contactPhoneHref}">Позвонить</a></p></section>`,
    "</div>",
    '<aside class="service-aside">',
    '<section class="service-panel service-booking" id="booking">',
    "<h2>Заявка</h2>",
    "<p>Для заявки укажите дату, количество человек и желаемый формат отдыха.</p>",
    '<div class="booking-actions">',
    `<a class="button button-ghost" href="tel:${contactPhoneHref}">Позвонить</a>`,
    `<a class="button button-primary" href="tel:${contactPhoneHref}">${contactPhone}</a>`,
    "</div>",
    "</section>",
    "</aside>",
    "</section>",
    "</main>"
  ].join("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: title,
    description,
    touristType: activity.audience,
    provider: {
      "@type": "TouristInformationCenter",
      name: siteName,
      telephone: contactPhone
    }
  };

  if (hasStructuredOfferPrice(activity.price)) {
    jsonLd.offers = {
      "@type": "Offer",
      priceSpecification: activity.price,
      availability: "https://schema.org/InStock"
    };
  }

  return renderPage({
    title: `${title} - цена, расписание, маршрут`,
    description,
    canonicalPath: withTrailingSlash(getActivityPath(activity)),
    body,
    bodyClass: "service-hero-page",
    jsonLd
  });
}

export function renderCategoryPage(category) {
  const items = getCategoryActivities(category);
  const description = `${category.lead} Подборка включает ${items.length} вариантов отдыха с отдельными страницами услуг.`;
  const heading = /в\s+Архипо-Осиповке/i.test(category.title)
    ? category.title
    : `${category.title} в Архипо-Осиповке`;
  const body = [
    '<main class="service-page service-category-page" id="top">',
    '<section class="hero section-card travel-hero-mobile-image" aria-labelledby="hero-title">',
    renderUnifiedHeroHeader({ primaryHref: "#category-services-title" }),
    '<video class="hero-video" muted loop playsinline autoplay preload="none" poster="/fotoref/more-hero.jpg" data-src="/videoref/hero-beach-lite.mp4" aria-hidden="true"></video>',
    '<picture class="hero-image-mobile" aria-hidden="true"><source type="image/webp" media="(max-width: 760px)" srcset="/fotoref/more-hero-mobile.webp" /><source media="(max-width: 760px)" srcset="/fotoref/more-hero-mobile.jpg" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" width="2172" height="724" loading="eager" decoding="sync" fetchpriority="high" /></picture>',
    '<div class="hero-overlay" aria-hidden="true"></div>',
    '<div class="hero-copy">',
    `<p class="eyebrow">${escapeHtml(category.label || category.title)}</p>`,
    `<h1 id="hero-title">${escapeHtml(heading)}</h1>`,
    `<p class="hero-lead">${escapeHtml(category.lead)}</p>`,
    renderUnifiedHeroActions({
      primaryHref: "#category-services-title",
      classTail: category.slug === "kvadrotsikly-ekstrim" ? " hero-actions-lowered" : ""
    }),
    '</div>',
    '</section>',
    '<section class="popular-section service-category-section" aria-labelledby="category-services-title">',
    '<div class="section-heading"><div><p class="eyebrow catalog-eyebrow">Каталог</p><h2 id="category-services-title">Услуги направления</h2></div><a href="/travel/#popular">На главную →</a></div>',
    `<div class="popular-grid service-category-grid">${items.map((activity) => renderActivityCard(activity, true)).join("")}</div>`,
    '</section>',
    renderDirectionsSection(),
    '</main>'
  ].join("");

  return renderPage({
    title: `${category.title} - Архипо-Осиповка`,
    description,
    canonicalPath: withTrailingSlash(getCategoryPath(category)),
    body,
    includeHeader: false,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.title,
      description,
      hasPart: items.map((activity) => ({
        "@type": "TouristTrip",
        name: activity.title,
        url: getActivityPath(activity)
      }))
    }
  });
}

export function renderTravelPage(pathname) {
  const slug = getSlugFromPath(pathname);
  if (!slug) return null;

  const category = categoryPages.find((item) => item.slug === slug);
  if (category) return renderCategoryPage(category);

  const activity = activitiesCatalog.find((item) => getActivitySlug(item) === slug);
  return activity ? renderServicePage(activity) : null;
}








