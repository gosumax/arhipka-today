const quadHref = "/travel/kvadrotsikly-ekstrim/";

export const contactPhone = "+7 979 033-97-39";
export const contactPhoneHref = "+79790339739";
export const maxLink = "https://max.ru/u/f9LHodD0cOKLzWwiUsSgrCMCJuT_ZWsnGPwU8AH5qBO8vgOCIXlfd98nK";

export const headerNavItems = [
  { href: "/morskie-progulki/", label: "РњРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё" },
  { href: "/vodopady/", label: "Р’РѕРґРѕРїР°РґС‹" },
  { href: "/ekskursii/", label: "Р­РєСЃРєСѓСЂСЃРёРё" },
  { href: quadHref, label: "РљРІР°РґСЂРѕ Рё СЌРЅРґСѓСЂРѕ" },
  { href: "/s-detmi/", label: "РЎ РґРµС‚СЊРјРё" },
  { href: "/pogoda/", label: "РџРѕРіРѕРґР°" },
  { href: "/kontakty/", label: "РљРѕРЅС‚Р°РєС‚С‹" }
];

const footerDescription = "Р›РѕРєР°Р»СЊРЅС‹Р№ РіРёРґ РїРѕ РѕС‚РґС‹С…Сѓ: РјРѕСЂРµ, РІРѕРґРѕРїР°РґС‹, РјР°СЂС€СЂСѓС‚С‹ Рё РёРґРµРё РґР»СЏ СЃРµРјРµР№РЅРѕРіРѕ РґРѕСЃСѓРіР°.";

export const footerPopularLinks = [
  { href: "/otdyh/", label: "РћС‚РґС‹С… РІ РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєРµ" },
  { href: "/pogoda/", label: "РџРѕРіРѕРґР° Рё С‚РµРјРїРµСЂР°С‚СѓСЂР° РјРѕСЂСЏ" },
  { href: "/morskie-progulki/", label: "РњРѕСЂСЃРєРёРµ РїСЂРѕРіСѓР»РєРё" },
  { href: "/vodopady/", label: "Р’РѕРґРѕРїР°РґС‹" },
  { href: "/ekskursii/", label: "Р­РєСЃРєСѓСЂСЃРёРё" },
  { href: "/s-detmi/", label: "РЎ РґРµС‚СЊРјРё" },
  { href: quadHref, label: "РљРІР°РґСЂРѕ Рё СЌРЅРґСѓСЂРѕ" },
  { href: "/kuda-shodit/", label: "РљСѓРґР° СЃС…РѕРґРёС‚СЊ" },
  { href: "/progulka-na-zakate-arhipo-osipovka/", label: "РџСЂРѕРіСѓР»РєР° РЅР° Р·Р°РєР°С‚Рµ" },
  { href: "/iz-krasnodara/", label: "РР· РљСЂР°СЃРЅРѕРґР°СЂР°" }
];

const footerDocumentLinks = [
  { href: "/privacy/", label: "РџРѕР»РёС‚РёРєР° РѕР±СЂР°Р±РѕС‚РєРё РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С…" },
  { href: "/personal-data-consent/", label: "РЎРѕРіР»Р°СЃРёРµ РЅР° РѕР±СЂР°Р±РѕС‚РєСѓ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С…" },
  { href: "/marketing-consent/", label: "РЎРѕРіР»Р°СЃРёРµ РЅР° РїРѕР»СѓС‡РµРЅРёРµ СЂРµРєР»Р°РјРЅС‹С… СЃРѕРѕР±С‰РµРЅРёР№" },
  { href: "/cookie-policy/", label: "РџРѕР»РёС‚РёРєР° cookie" },
  { href: "/kontakty/", label: "РљРѕРЅС‚Р°РєС‚С‹" }
];

const quadCard = '<a class="seo-link-card" href="/travel/kvadrotsikly-ekstrim/" aria-label="РљРІР°РґСЂРѕ Рё СЌРЅРґСѓСЂРѕ"><span class="seo-link-title">РљРІР°РґСЂРѕ Рё СЌРЅРґСѓСЂРѕ</span><span class="seo-link-teaser">РљРІР°РґСЂРѕС†РёРєР»С‹, СЌРЅРґСѓСЂРѕ Рё Р°РєС‚РёРІРЅС‹Рµ РјР°СЂС€СЂСѓС‚С‹ 2,5-3 С‡Р°СЃР°.</span><span class="seo-link-cta" aria-hidden="true">в†’</span></a>';

function normalizePrimaryHref(href = "") {
  const value = String(href || "").trim();
  return value || "#popular";
}

function renderMenuItems() {
  return headerNavItems.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");
}

function renderBrand(brandHref = "/travel/") {
  return `<a class="brand" href="${brandHref}" aria-label="РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР° СЃРµРіРѕРґРЅСЏ"><span class="brand-mark" aria-hidden="true"><picture><source type="image/webp" srcset="/fotoref/logo.webp" /><img src="/fotoref/logo.webp" alt="" /></picture></span><span><strong>РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР°</strong><small>СЃРµРіРѕРґРЅСЏ</small></span></a>`;
}

function renderHeaderActions() {
  return `<div class="header-actions"><a class="button button-ghost header-call-button" href="tel:${contactPhoneHref}">РџРѕР·РІРѕРЅРёС‚СЊ</a><a class="button button-ghost header-call-button" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
}

function renderMobileActions(primaryHref = "#popular") {
  const href = normalizePrimaryHref(primaryHref);
  return `<div class="mobile-menu-actions"><a class="button button-ghost" href="tel:${contactPhoneHref}">РџРѕР·РІРѕРЅРёС‚СЊ</a><a class="button button-primary" href="${href}">Р’С‹Р±СЂР°С‚СЊ РЅР°РїСЂР°РІР»РµРЅРёРµ</a><a class="button button-ghost" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
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
    `<div class="footer-brand"><a class="brand" href="${homeHref}"><span class="brand-mark" aria-hidden="true"><picture><source type="image/webp" srcset="/fotoref/logo.webp" /><img src="/fotoref/logo.webp" alt="" /></picture></span><span><strong>РђСЂС…РёРїРѕ-РћСЃРёРїРѕРІРєР° СЃРµРіРѕРґРЅСЏ</strong></span></a><p>${footerDescription}</p></div>`,
    renderFooterColumn("РџРѕРїСѓР»СЏСЂРЅРѕРµ", footerPopularLinks),
    renderFooterColumn("Р”РѕРєСѓРјРµРЅС‚С‹", footerDocumentLinks),
    `<div><h3>РљРѕРЅС‚Р°РєС‚С‹</h3><a class="text-button phone-reveal-button" href="tel:${contactPhoneHref}">${contactPhone}</a><a href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a><p class="contact-legal">Р”Р»СЏ Р±С‹СЃС‚СЂРѕРіРѕ РїРѕРґР±РѕСЂР° РјР°СЂС€СЂСѓС‚Р° РЅР°РїРёС€РёС‚Рµ РІ MAX РёР»Рё РїРѕР·РІРѕРЅРёС‚Рµ: РѕС‚РІРµС‚РёРј РїРѕ РїРѕРіРѕРґРµ, С„РѕСЂРјР°С‚Сѓ Рё РІСЂРµРјРµРЅРё РѕС‚РґС‹С…Р°.</p></div>`,
    "</footer>"
  ].join("");
}

export function renderUnifiedHeroActions({ primaryHref = "#popular", classTail = "" } = {}) {
  const href = normalizePrimaryHref(primaryHref);
  return `<div class="hero-actions${classTail}"><a class="button button-primary" href="${href}">Р’С‹Р±СЂР°С‚СЊ РЅР°РїСЂР°РІР»РµРЅРёРµ</a><a class="button button-ghost" href="tel:${contactPhoneHref}">РџРѕР·РІРѕРЅРёС‚СЊ</a><a class="button button-ghost" href="${maxLink}" target="_blank" rel="noopener noreferrer">MAX</a></div>`;
}

function renderNav(className, ariaLabel) {
  return `<nav class="${className}" aria-label="${ariaLabel}">${renderMenuItems()}</nav>`;
}

function renderHeader({ headerClass, brandHref, primaryHref }) {
  return [
    `<header class="${headerClass}">`,
    renderBrand(brandHref),
    renderNav("main-nav", "РћСЃРЅРѕРІРЅР°СЏ РЅР°РІРёРіР°С†РёСЏ"),
    renderHeaderActions(),
    '<details class="mobile-menu">',
    '<summary class="mobile-menu-toggle" aria-label="РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ"><span class="mobile-menu-toggle-icon" aria-hidden="true"></span><span class="sr-only">РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ</span></summary>',
    '<div class="mobile-menu-panel">',
    renderNav("mobile-menu-nav", "РњРѕР±РёР»СЊРЅР°СЏ РЅР°РІРёРіР°С†РёСЏ"),
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

