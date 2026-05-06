import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { activitiesCatalog } from "../activities-catalog.js";
import { HOME_BLOCKS, HOME_SECTION_ORDER } from "../home-blocks.mjs";
import { categoryPages, getActivitySlug, renderCategoryPage, renderLegalPage, renderServicePage } from "../page-renderer.mjs";
import { newSeoPages, renderNewSeoPage } from "../seo-new-pages.mjs";
import { ensureQuadDirectionCard, normalizeFooterShell, normalizeLandingHeroShell } from "../hero-header-shell.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");
const dist = path.join(projectRoot, "dist");
const siteUrl = (process.env.SITE_URL || process.env.BASE_URL || "https://arhipka-today.ru").replace(/\/+$/, "");
const siteOrigin = new URL(siteUrl).origin;
const siteName = "Архипка Travel";
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

function renderRedirectPage({ toPath, canonicalPath = toPath, title = "Переадресация" }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${/^https?:\/\//i.test(canonicalPath) ? canonicalPath : `${siteUrl}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`}" />
    <meta http-equiv="refresh" content="0;url=${toPath}" />
  </head>
  <body>
    <p>Переход на <a href="${toPath}">${toPath}</a>.</p>
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
    /class="([^"]*\bimage-placeholder\b[^"]*\bcard-photo\b(?![^"]*\bcard-photo-lazy\b)[^"]*)"/g,
    'class="$1 card-photo-lazy"'
  );
}

const snapshotRelatedLinks = {
  "/pogoda": {
    heading: "Связанные варианты",
    description: "Переходите к формату, который лучше подходит по текущей погоде и состоянию моря.",
    links: [
      {
        href: "/morskie-progulki",
        title: "Посмотреть морские прогулки",
        teaser: "Если море спокойное и хотите формат на воде."
      },
      {
        href: "/vodopady",
        title: "Водопады",
        teaser: "Если жарко, ветрено или нужна наземная альтернатива."
      },
      {
        href: "/kuda-shodit-vecherom-v-arhipo-osipovke",
        title: "Куда сходить вечером",
        teaser: "Если нужен спокойный вечерний сценарий у моря."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Что взять на морскую прогулку",
        teaser: "Если идёте на катер и хотите быстро собраться."
      }
    ]
  },
  "/s-detmi": {
    heading: "Связанные варианты",
    description: "Короткие и понятные переходы для семейного отдыха без перегруза.",
    links: [
      {
        href: "/morskaya-progulka-s-detmi-arhipo-osipovka",
        title: "Морская прогулка с детьми",
        teaser: "Спокойные семейные форматы по длительности и ритму."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Что взять на морскую прогулку",
        teaser: "Чек-лист, чтобы с детьми ничего не забыть."
      },
      {
        href: "/kuda-shodit",
        title: "Куда сходить",
        teaser: "Идеи наземных маршрутов и прогулок с детьми."
      },
      {
        href: "/pogoda",
        title: "Отдых по погоде",
        teaser: "Что выбрать семье в жару, ветер или волну."
      },
      {
        href: "/morskie-progulki",
        title: "Посмотреть морские прогулки",
        teaser: "Если нужен короткий и спокойный формат на море."
      }
    ]
  },
  "/morskie-progulki": {
    heading: "Связанные варианты",
    description: "Помогает быстро перейти от идеи выхода в море к формату, цене и подготовке.",
    links: [
      {
        href: "/ceny-na-morskie-progulki-arhipo-osipovka",
        title: "Цены на морские прогулки",
        teaser: "Сравните стоимость по длительности и формату."
      },
      {
        href: "/chto-vzyat-na-morskuyu-progulku",
        title: "Что взять на морскую прогулку",
        teaser: "Короткий список вещей перед выходом в море."
      },
      {
        href: "/morskaya-progulka-s-detmi-arhipo-osipovka",
        title: "Морская прогулка с детьми",
        teaser: "Отдельный семейный сценарий с мягким темпом."
      },
      {
        href: "/progulka-na-zakate-arhipo-osipovka",
        title: "Прогулка на закате",
        teaser: "Вечерний морской формат со спокойным ритмом."
      },
      {
        href: "/pogoda",
        title: "Отдых по погоде",
        teaser: "Проверьте условия перед выбором морского формата."
      }
    ]
  },
  "/kuda-shodit": {
    heading: "Связанные варианты",
    description: "Выберите следующий шаг: что посмотреть, куда пойти вечером и что подойдёт семье.",
    links: [
      {
        href: "/chto-posmotret-v-arhipo-osipovke",
        title: "Что посмотреть в Архипо-Осиповке",
        teaser: "Реальные точки для первого знакомства с курортом."
      },
      {
        href: "/kuda-shodit-vecherom-v-arhipo-osipovke",
        title: "Куда сходить вечером",
        teaser: "Вечерние маршруты, закат и спокойные форматы."
      },
      {
        href: "/s-detmi",
        title: "Что выбрать с детьми",
        teaser: "Семейные варианты без длинных переходов."
      },
      {
        href: "/pogoda",
        title: "Отдых по погоде",
        teaser: "Как быстро скорректировать план по погоде."
      },
      {
        href: "/morskie-progulki",
        title: "Посмотреть морские прогулки",
        teaser: "Если хотите добавить формат на воде."
      }
    ]
  }
};

const snapshotFaqOverrides = {
  "/morskie-progulki": [
    ["Какой формат моря выбрать в первый раз?", "Если впервые, чаще выбирают 1 час: спокойный выход, фото и купание без перегруза."],
    ["Что выбрать на море с детьми?", "Семьям обычно удобнее короткий рейс в спокойную погоду и мягкий темп без долгих переходов."],
    ["Что делать, если поднялась волна?", "Если море стало неспокойным, лучше перенести выход и выбрать наземный вариант: водопады, прогулку или вечерний маршрут."],
    ["Можно ли выбрать отдых на сегодня?", "Да. Напишите в MAX — подскажем, какие варианты актуальны сегодня и что лучше выбрать по погоде."],
    ["Что взять с собой?", "Воду, удобную обувь, солнцезащиту, лёгкую одежду от ветра. Для моря и купания — полотенце."],
    ["Как понять, что подойдёт именно нам?", "Напишите состав компании, возраст детей, желаемое время и формат — спокойный, красивый, активный или семейный."]
  ],
  "/pogoda": [
    ["Какая погода сегодня подходит для моря?", "Для моря комфортнее слабый ветер и спокойная волна; при нестабильных условиях лучше сразу планировать вариант на суше."],
    ["Что выбрать семье при жаре?", "С детьми чаще удобны утренние и вечерние слоты, а в пик жары — короткие маршруты и тень."],
    ["Что делать при ветре и волне?", "Сместите план на наземные точки: набережную, Подвесной мост через Вулан, Михайловское укрепление или выезд к водопадам."],
    ["Можно ли выбрать отдых на сегодня?", "Да. Напишите в MAX — подскажем, какие варианты актуальны сегодня и что лучше выбрать по погоде."],
    ["Что взять с собой?", "Воду, удобную обувь, солнцезащиту, лёгкую одежду от ветра. Для моря и купания — полотенце."],
    ["Как понять, что подойдёт именно нам?", "Напишите состав компании, возраст детей, желаемое время и формат — спокойный, красивый, активный или семейный."]
  ],
  "/s-detmi": [
    ["Какой семейный формат выбрать в первую очередь?", "Обычно начинают с короткой прогулки: море или спокойный маршрут на суше без длинной дороги."],
    ["Куда пойти с детьми, если не хочется катер?", "Подойдут набережная, Центральный пляж и короткие наземные точки, где можно делать паузы."],
    ["Что делать семье при ветре?", "При ветре лучше выбрать наземный сценарий и спокойный темп, а выход в море перенести на более тихие условия."],
    ["Можно ли выбрать отдых на сегодня?", "Да. Напишите в MAX — подскажем, какие варианты актуальны сегодня и что лучше выбрать по погоде."],
    ["Что взять с собой?", "Воду, удобную обувь, солнцезащиту, лёгкую одежду от ветра. Для моря и купания — полотенце."],
    ["Как понять, что подойдёт именно нам?", "Напишите состав компании, возраст детей, желаемое время и формат — спокойный, красивый, активный или семейный."]
  ],
  "/kuda-shodit": [
    ["С чего начать прогулку в Архипо-Осиповке?", "Начните с Приморского бульвара и Центрального пляжа, а дальше добавьте одну активность по времени и настроению."],
    ["Куда сходить с детьми без перегруза?", "Выбирайте короткий круг: набережная, Подвесной мост через Вулан и одна дополнительная точка без длинных переездов."],
    ["Что выбрать, если море волнуется?", "Сделайте наземный маршрут: Гора Ёжик, Михайловское укрепление или Музей хлеба и вина, а море оставьте на спокойный день."],
    ["Можно ли выбрать отдых на сегодня?", "Да. Напишите в MAX — подскажем, какие варианты актуальны сегодня и что лучше выбрать по погоде."],
    ["Что взять с собой?", "Воду, удобную обувь, солнцезащиту, лёгкую одежду от ветра. Для моря и купания — полотенце."],
    ["Как понять, что подойдёт именно нам?", "Напишите состав компании, возраст детей, желаемое время и формат — спокойный, красивый, активный или семейный."]
  ]
};

function renderSnapshotRelatedLinks(pathname) {
  const config = snapshotRelatedLinks[pathname];
  if (!config) return "";

  const cards = config.links.map((item) => [
    `<a class="seo-link-card" href="${escapeHtml(withTrailingSlashPath(item.href))}" aria-label="${escapeHtml(item.title)}">`,
    `<span class="seo-link-title">${escapeHtml(item.title)}</span>`,
    `<span class="seo-link-teaser">${escapeHtml(item.teaser)}</span>`,
    '<span class="seo-link-cta" aria-hidden="true">→</span>',
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
  return `<section class="faq-section section-card" aria-labelledby="seo-faq-title"><h2 id="seo-faq-title">Частые вопросы</h2><div class="faq-grid">${articles}</div></section>`;
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
        { "@type": "Place", name: "Архипо-Осиповка" },
        { "@type": "Place", name: "Краснодарский край" }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Популярные направления в Архипо-Осиповке",
      itemListElement: [
        { "@type": "ListItem", position: 1, url: toAbsoluteUrl("/morskie-progulki/"), name: "Морские прогулки" },
        { "@type": "ListItem", position: 2, url: toAbsoluteUrl("/vodopady/"), name: "Водопады" },
        { "@type": "ListItem", position: 3, url: toAbsoluteUrl("/s-detmi/"), name: "С детьми" },
        { "@type": "ListItem", position: 4, url: toAbsoluteUrl("/pogoda/"), name: "Погода" },
        { "@type": "ListItem", position: 5, url: toAbsoluteUrl("/kuda-shodit/"), name: "Куда сходить" }
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
        { "@type": "Place", name: "Архипо-Осиповка" },
        { "@type": "Place", name: "Краснодарский край" }
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
      serviceName: "Морские прогулки в Архипо-Осиповке",
      serviceDescription: "Выходы в море на катере, купание, расписание и семейные форматы отдыха.",
      listName: "Полезные страницы по морским прогулкам",
      listPaths: [
        "/morskie-progulki/",
        "/chto-vzyat-na-morskuyu-progulku/",
        "/ceny-na-morskie-progulki-arhipo-osipovka/",
        "/morskaya-progulka-s-detmi-arhipo-osipovka/"
      ]
    },
    "/vodopady": {
      serviceName: "Водопады рядом с Архипо-Осиповкой",
      serviceDescription: "Маршруты к водопадам и природным точкам в формате наземного отдыха у моря.",
      listName: "Полезные страницы по водопадам и маршрутам",
      listPaths: [
        "/vodopady/",
        "/kuda-shodit/",
        "/chto-posmotret-v-arhipo-osipovke/"
      ]
    },
    "/s-detmi": {
      serviceName: "Отдых с детьми в Архипо-Осиповке",
      serviceDescription: "Спокойные семейные форматы, короткие прогулки и сценарии с мягким темпом дня.",
      listName: "Полезные страницы для семейного отдыха",
      listPaths: [
        "/s-detmi/",
        "/morskaya-progulka-s-detmi-arhipo-osipovka/",
        "/kuda-shodit/",
        "/pogoda/"
      ]
    },
    "/pogoda": {
      serviceName: "Погода и выбор маршрута в Архипо-Осиповке",
      serviceDescription: "Актуальные рекомендации по выбору формата отдыха в море, горах и набережной.",
      listName: "Полезные страницы для выбора по погоде",
      listPaths: [
        "/pogoda/",
        "/morskie-progulki/",
        "/vodopady/",
        "/kuda-shodit/"
      ]
    },
    "/kuda-shodit": {
      serviceName: "Куда сходить в Архипо-Осиповке",
      serviceDescription: "Идеи прогулок у моря, в горах и вечерние маршруты по курорту.",
      listName: "Полезные страницы для прогулок по Архипо-Осиповке",
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
        { "@type": "Place", name: "Архипо-Осиповка" },
        { "@type": "Place", name: "Краснодарский край" }
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
    "Приморский бульвар",
    "Гора Ёжик",
    "Михайловское укрепление",
    "Музей хлеба и вина",
    "Центральный пляж",
    "Подвесной мост через Вулан"
  ];

  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Реальные точки и маршруты на карте",
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
  await writeFile(path.join(dist, "home-blocks.mjs"), runtimeModule, "utf8");
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

await Promise.all([
  copyFile(path.join(projectRoot, "styles.css"), path.join(dist, "styles.css")),
  copyFile(path.join(projectRoot, "_headers"), path.join(dist, "_headers")),
  copyFile(path.join(projectRoot, "llms.txt"), path.join(dist, "llms.txt")),
  copyFile(path.join(projectRoot, "activities-catalog.js"), path.join(dist, "activities-catalog.js")),
  copyFile(path.join(projectRoot, "catalog-renderer.js"), path.join(dist, "catalog-renderer.js")),
  writeRuntimeHomeBlocksModule(),
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
  title: "Архипо-Осиповка сегодня — /travel"
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
    const snapshotHtml = appendJsonLdScripts(
      deferSnapshotCardPhotos(applySnapshotRelatedLinks(
        pathname,
        applySnapshotFaqOverrides(pathname, normalizeSnapshotHtml(await readFile(snapshotFile, "utf8")))
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
    title: `Переадресация на ${canonicalPath}`
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

