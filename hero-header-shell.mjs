const quadHref = "/travel/kvadrotsikly-ekstrim/";

export const contactPhone = "+7 979 033-97-39";
export const contactPhoneHref = "+79790339739";
export const maxLink = "https://max.ru/u/f9LHodD0cOKLzWwiUsSgrCMCJuT_ZWsnGPwU8AH5qBO8vgOCIXlfd98nK";

export const headerNavItems = [
  { href: "/morskie-progulki/", label: "Морские прогулки" },
  { href: "/vodopady/", label: "Водопады" },
  { href: "/ekskursii/", label: "Экскурсии" },
  { href: quadHref, label: "Квадро и эндуро" },
  { href: "/s-detmi/", label: "С детьми" },
  { href: "/pogoda/", label: "Погода" },
  { href: "/kontakty/", label: "Контакты" }
];

const footerDescription = "Локальный гид по отдыху: море, водопады, маршруты и идеи для семейного досуга.";

export const footerPopularLinks = [
  { href: "/otdyh/", label: "Отдых в Архипо-Осиповке" },
  { href: "/pogoda/", label: "Погода и температура моря" },
  { href: "/morskie-progulki/", label: "Морские прогулки" },
  { href: "/vodopady/", label: "Водопады" },
  { href: "/ekskursii/", label: "Экскурсии" },
  { href: "/s-detmi/", label: "С детьми" },
  { href: quadHref, label: "Квадро и эндуро" },
  { href: "/kuda-shodit/", label: "Куда сходить" },
  { href: "/progulka-na-zakate-arhipo-osipovka/", label: "Прогулка на закате" },
  { href: "/iz-krasnodara/", label: "Из Краснодара" }
];

const footerDocumentLinks = [
  { href: "/privacy/", label: "Политика обработки персональных данных" },
  { href: "/personal-data-consent/", label: "Согласие на обработку персональных данных" },
  { href: "/marketing-consent/", label: "Согласие на получение рекламных сообщений" },
  { href: "/cookie-policy/", label: "Политика cookie" },
  { href: "/kontakty/", label: "Контакты" }
];

const quadCard = '<a class="seo-link-card" href="/travel/kvadrotsikly-ekstrim/" aria-label="Квадро и эндуро"><span class="seo-link-title">Квадро и эндуро</span><span class="seo-link-teaser">Квадроциклы, эндуро и активные маршруты 2,5-3 часа.</span><span class="seo-link-cta" aria-hidden="true">→</span></a>';

function normalizePrimaryHref(href = "") {
  const value = String(href || "").trim();
  return value || "#popular";
}

function renderMenuItems() {
  return headerNavItems.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");
}

function renderBrand(brandHref = "/travel/") {
  return `<a class="brand" href="${brandHref}" aria-label="Архипо-Осиповка сегодня"><span class="brand-mark" aria-hidden="true"><picture><source type="image/webp" srcset="/fotoref/logo.webp" /><img src="/fotoref/logo.png" alt="" /></picture></span><span><strong>Архипо-Осиповка</strong><small>сегодня</small></span></a>`;
}

function renderHeaderActions() {
  return `<div class="header-actions"><a class="button button-ghost header-call-button" href="tel:${contactPhoneHref}">Позвонить</a><a class="button button-ghost header-call-button" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
}

function renderMobileActions(primaryHref = "#popular") {
  const href = normalizePrimaryHref(primaryHref);
  return `<div class="mobile-menu-actions"><a class="button button-ghost" href="tel:${contactPhoneHref}">Позвонить</a><a class="button button-primary" href="${href}">Выбрать направление</a><a class="button button-ghost" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
}

function renderFooterLinks(items = []) {
  const seen = new Set();
  const uniqueItems = items.filter((item) => {
    if (!item?.href || seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
  return uniqueItems.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");
}

function renderFooterColumn(title, items) {
  return `<div><h3>${title}</h3>${renderFooterLinks(items)}</div>`;
}

export function renderUnifiedFooter({ homeHref = "/travel/", footerClassName = "site-footer section-card" } = {}) {
  return [
    `<footer class="${footerClassName}" id="contacts">`,
    `<div class="footer-brand"><a class="brand" href="${homeHref}"><span class="brand-mark" aria-hidden="true"><picture><source type="image/webp" srcset="/fotoref/logo.webp" /><img src="/fotoref/logo.png" alt="" /></picture></span><span><strong>Архипо-Осиповка сегодня</strong></span></a><p>${footerDescription}</p></div>`,
    renderFooterColumn("Популярное", footerPopularLinks),
    renderFooterColumn("Документы", footerDocumentLinks),
    `<div><h3>Контакты</h3><a class="text-button phone-reveal-button" href="tel:${contactPhoneHref}">${contactPhone}</a><a href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a><p class="contact-legal">Для быстрого подбора маршрута напишите в MAX или позвоните: ответим по погоде, формату и времени отдыха.</p></div>`,
    "</footer>"
  ].join("");
}

export function renderUnifiedHeroActions({ primaryHref = "#popular", classTail = "" } = {}) {
  const href = normalizePrimaryHref(primaryHref);
  return `<div class="hero-actions${classTail}"><a class="button button-primary" href="${href}">Выбрать направление</a><a class="button button-ghost" href="tel:${contactPhoneHref}">Позвонить</a><a class="button button-ghost" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
}

function renderNav(className, ariaLabel) {
  return `<nav class="${className}" aria-label="${ariaLabel}">${renderMenuItems()}</nav>`;
}

function renderHeader({ headerClass, brandHref, primaryHref }) {
  return [
    `<header class="${headerClass}">`,
    renderBrand(brandHref),
    renderNav("main-nav", "Основная навигация"),
    renderHeaderActions(),
    '<details class="mobile-menu">',
    '<summary class="mobile-menu-toggle" aria-label="Открыть меню"><span class="mobile-menu-toggle-icon" aria-hidden="true"></span><span class="sr-only">Открыть меню</span></summary>',
    '<div class="mobile-menu-panel">',
    renderNav("mobile-menu-nav", "Мобильная навигация"),
    renderMobileActions(primaryHref),
    "</div>",
    "</details>",
    "</header>"
  ].join("");
}

export function renderUnifiedHeroHeader({ brandHref = "/travel/", primaryHref = "#popular" } = {}) {
  return renderHeader({
    headerClass: "site-header hero-header",
    brandHref,
    primaryHref
  });
}

export function renderUnifiedServiceHeader({ brandHref = "/travel/", primaryHref = "/travel/#popular" } = {}) {
  return renderHeader({
    headerClass: "site-header service-header section-card",
    brandHref,
    primaryHref
  });
}

export function getPrimaryHeroHref(fragment = "", fallback = "#popular") {
  const match = String(fragment || "").match(/<a[^>]*class="[^"]*button-primary[^"]*"[^>]*href="([^"]+)"/i);
  return normalizePrimaryHref(match?.[1] || fallback);
}

export function normalizeLandingHeroShell(html, { fallbackPrimaryHref = "#popular", brandHref = "/travel/" } = {}) {
  if (!/<section[^>]*class="[^"]*hero[^"]*"/i.test(html)) return html;

  const primaryHref = getPrimaryHeroHref(html, fallbackPrimaryHref);
  let updated = html.replace(
    /<header class="site-header hero-header">[\s\S]*?<\/header>/i,
    renderUnifiedHeroHeader({ brandHref, primaryHref })
  );

  updated = updated.replace(
    /<div class="hero-actions([^"]*)">[\s\S]*?<\/div>/i,
    (_match, classTail = "") => renderUnifiedHeroActions({ primaryHref, classTail })
  );

  return updated;
}

export function normalizeFooterShell(html, { homeHref = "/travel/", footerClassName = "site-footer section-card" } = {}) {
  if (!/<footer[^>]*class="[^"]*site-footer[^"]*"/i.test(html)) return html;
  return html.replace(
    /<footer[^>]*class="[^"]*site-footer[^"]*"[^>]*>[\s\S]*?<\/footer>/i,
    renderUnifiedFooter({ homeHref, footerClassName })
  );
}

export function ensureQuadDirectionCard(html) {
  return html.replace(/(<div class="seo-links-grid">[\s\S]*?)(<\/div>)/i, (_match, start, end) => {
    if (start.includes(quadHref)) return `${start}${end}`;
    return `${start}${quadCard}${end}`;
  });
}
