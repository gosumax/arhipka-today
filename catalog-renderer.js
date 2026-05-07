import { activitiesCatalog } from "./activities-catalog.js";
import { HOME_BLOCKS, HOME_SECTION_ORDER } from "./home-blocks.mjs?v=20260506-home-icons-clean";

const imageClassByKey = {
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

const sectionRoot = document.querySelector("[data-home-sections]");

const sectionMeta = {
  "quick-choice": {
    anchorId: "quick-choice"
  },
  "popular-directions": {
    anchorId: "popular",
    action: {
      label: "Смотреть все направления",
      href: "/travel/"
    }
  },
  "by-situation": {
    anchorId: "by-situation"
  },
  "map-points": {
    anchorId: "realnye-tochki-i-marshruty",
    action: {
      label: "Смотреть все точки на карте",
      href: "/chto-posmotret-v-arhipo-osipovke/#realnye-tochki-i-marshruty-na-karte"
    }
  },
  "sea-trips": {
    anchorId: "sea-trips"
  },
  family: {
    anchorId: "family"
  },
  active: {
    anchorId: "active",
    action: {
      label: "Смотреть все активности",
      href: "/travel/kvadrotsikly-ekstrim/"
    }
  },
  "faq-trust": {
    anchorId: "faq"
  }
};

const iconByCardId = {
  "quick-sea": "wave",
  "quick-family": "family",
  "quick-active": "activity",
  "quick-waterfalls": "mountains",
  "quick-sunset": "sunset",
  "quick-free-walk": "route",
  "situation-with-kids": "family",
  "situation-sea": "wave",
  "situation-active": "bike",
  "situation-evening": "moon",
  "situation-hot": "umbrella",
  "situation-windy": "wind",
  "situation-no-car": "bus",
  "situation-budget": "wallet"
};

const familyMiniIconByIndex = ["beach", "park", "food"];

const homeIconSvgByKey = {
  activity: '<path d="M17 34l7-18 5 10h8"/><path d="M13 28l7-4"/><path d="M10 36h28"/><circle cx="14" cy="18" r="3"/>',
  beach: '<path d="M11 32c5-4 10-6 16-6s9 2 12 6"/><path d="M16 26l8-14 8 14"/><path d="M24 12v26"/><path d="M12 38h24"/><circle cx="35" cy="14" r="4"/>',
  bike: '<circle cx="15" cy="32" r="6"/><circle cx="34" cy="32" r="6"/><path d="M21 32l5-11 8 11"/><path d="M26 21h-7l-4 11"/><path d="M29 16h5"/><path d="M24 14l5 2"/>',
  bus: '<rect x="11" y="14" width="26" height="20" rx="5"/><path d="M15 22h18"/><path d="M17 34v4"/><path d="M31 34v4"/><circle cx="18" cy="29" r="1.5"/><circle cx="30" cy="29" r="1.5"/>',
  family: '<circle cx="18" cy="18" r="4"/><circle cx="31" cy="19" r="3.5"/><circle cx="25" cy="28" r="3"/><path d="M10 34c1.5-6 5-9 8-9s6.5 3 8 9"/><path d="M26 28c1.5-3 3.5-5 6-5 3 0 5.5 3 6.5 8"/><path d="M18 38c1-4 3.5-6 7-6s6 2 7 6"/>',
  food: '<path d="M17 12v24"/><path d="M12 12v9c0 3 2 5 5 5s5-2 5-5v-9"/><path d="M31 12c4 4 5 10 1 15v9"/><path d="M31 12v24"/>',
  mountains: '<path d="M8 36l12-20 7 11 5-8 8 17H8z"/><path d="M20 16l2 8 5 3"/><path d="M32 19l-1 8 4-2"/><path d="M11 36c5-5 10-5 15 0s9 3 14 0"/>',
  moon: '<path d="M31 10c-8 2-13 8-13 15 0 8 6 13 14 13 3 0 6-1 8-3-3 1-7 0-10-3-6-5-5-15 1-22z"/><path d="M14 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>',
  park: '<path d="M12 34h24"/><path d="M24 14v20"/><path d="M14 24l10-12 10 12"/><path d="M16 28l8-10 8 10"/><path d="M18 34v-6h12v6"/>',
  route: '<path d="M16 34c-5-3-7-6-7-10 0-5 3-8 7-8s7 3 7 8c0 4-2 7-7 10z"/><circle cx="16" cy="24" r="2"/><path d="M23 34h5c6 0 9-3 9-7s-3-7-8-7h-2"/><path d="M31 15l6 5-6 5"/>',
  sunset: '<path d="M10 32h28"/><path d="M15 32a9 9 0 0 1 18 0"/><path d="M24 11v6"/><path d="M13 17l4 4"/><path d="M35 17l-4 4"/><path d="M12 38c4-2 8-2 12 0s8 2 12 0"/>',
  umbrella: '<path d="M10 24c3-8 9-12 14-12s11 4 14 12H10z"/><path d="M24 12v26"/><path d="M24 38c0 3 5 3 5-1"/><path d="M14 24c2-3 5-3 7 0"/><path d="M21 24c2-3 5-3 7 0"/><path d="M28 24c2-3 5-3 7 0"/>',
  wallet: '<rect x="10" y="16" width="28" height="20" rx="5"/><path d="M14 16l18-6 3 6"/><path d="M29 25h10v8H29a4 4 0 0 1 0-8z"/><circle cx="32" cy="29" r="1"/>',
  wave: '<path d="M8 31c4 0 4-4 8-4s4 4 8 4 4-4 8-4 4 4 8 4"/><path d="M10 37c4 0 4-3 8-3s4 3 8 3 4-3 8-3"/><path d="M13 25c3-8 10-12 18-10-4 2-6 5-6 9 4-2 8-1 12 2"/><circle cx="34" cy="14" r="3"/>',
  wind: '<path d="M9 18h21c4 0 4-6 0-6-2 0-3 1-4 2"/><path d="M9 26h28c4 0 4-6 0-6-2 0-3 1-4 2"/><path d="M9 34h18c4 0 4 6 0 6-2 0-3-1-4-2"/>'
};

const activitiesById = new Map(activitiesCatalog.map((activity) => [activity.id, activity]));
const activitiesBySlug = new Map(activitiesCatalog.map((activity) => [activity.slug || activity.id, activity]));

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

function normalizeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function normalizeHref(value) {
  if (typeof value !== "string") return "/travel/";
  const href = value.trim();
  return href || "/travel/";
}

function extractSlugFromTravelHref(href) {
  const match = String(href || "").match(/^\/travel\/([^/?#]+)(?:\/|$)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

function getActivityForCard(card) {
  if (!card || typeof card !== "object") return null;

  const activityId = card.sourceMeta?.activityId;
  if (activityId && activitiesById.has(activityId)) return activitiesById.get(activityId);

  const slug = extractSlugFromTravelHref(card.href);
  if (slug && activitiesBySlug.has(slug)) return activitiesBySlug.get(slug);

  return null;
}

function inferImageClass(card, sectionId, activity) {
  const manualImageClass = typeof card?.imageClass === "string" ? card.imageClass.trim() : "";
  if (manualImageClass) return manualImageClass;

  if (activity?.id === "sup-vulan" || activity?.slug === "sup-vulan") {
    return "sup-vulan-bg";
  }

  if (activity?.imageKey && imageClassByKey[activity.imageKey]) {
    return imageClassByKey[activity.imageKey];
  }

  const href = String(card?.href || "");
  const title = String(card?.title || "");
  if (/центральный пляж|закат/i.test(title) || /zakate/i.test(href)) return "sunset-bg";
  if (/приморский|набереж/i.test(title)) return "sea-bg";
  if (/мост|вулан/i.test(title)) return "route-bg";
  if (/музей|укрепление/i.test(title)) return "route-bg";
  if (/джип/i.test(title)) return "jeep-bg";
  if (/SUP|сап/i.test(title)) return "sup-bg";
  if (/дайв/i.test(title)) return "diving-bg";
  if (/ежик/i.test(title)) return "eagle-rock-bg";
  if (/дельфинарий|аквапарк/i.test(title)) return "kids-bg";
  if (/квадро|эндуро|ekstrim/i.test(`${title} ${href}`)) return "quad-bg";
  if (/море|катер|morskie-progulki|\/travel\/more\//i.test(`${title} ${href}`)) return "sea-bg";
  if (/водопад|dzhipping|джип/i.test(`${title} ${href}`)) return "waterfall-bg";
  if (/s-detmi|дет/i.test(`${title} ${href}`)) return "kids-bg";
  if (/экскур|маршрут|kuda-shodit|chto-posmotret/i.test(`${title} ${href}`)) return "route-bg";
  if (sectionId === "active") return "quad-bg";
  if (sectionId === "map-points") return "route-bg";
  if (sectionId === "sea-trips") return "sea-bg";
  return "route-bg";
}

function compactMeta(value, fallback = "Уточнить") {
  return normalizeText(value, fallback)
    .replace(/^Обычно\s+/i, "")
    .replace(/^Около\s+/i, "около ");
}

function normalizeEntityAttribute(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function inferCardEntityLabel(card, sectionId, activity) {
  const manualLabel = normalizeText(card?.entityLabel || "", "");
  if (manualLabel) return manualLabel;

  const title = String(card?.title || "");
  const href = String(card?.href || "");
  const context = `${title} ${href}`.toLowerCase();

  if (/(приморский|набереж)/i.test(context)) return "Приморский бульвар в Архипо-Осиповке, Краснодарский край";
  if (/(гора\s*ёжик|гора\s*ежик|ежик)/i.test(context)) return "Гора Ёжик и вид на море в Архипо-Осиповке";
  if (/(михайловск|укреплен)/i.test(context)) return "Михайловское укрепление в Архипо-Осиповке";
  if (/(музей|хлеба и вина)/i.test(context)) return "Музей хлеба и вина в Архипо-Осиповке";
  if (/(центральный пляж|закат)/i.test(context)) return "Центральный пляж Архипо-Осиповки на закате";
  if (/(подвесн|мост|вулан)/i.test(context)) return "Подвесной мост через реку Вулан в Архипо-Осиповке";
  if (/(квадро|эндуро)/i.test(context)) return "Квадро и эндуро в Архипо-Осиповке";
  if (/(водопад|джиппинг|dzhipping)/i.test(context)) return "Водопады и горные маршруты рядом с Архипо-Осиповкой";
  if (/(с детьми|семейн)/i.test(context)) return "Отдых с детьми в Архипо-Осиповке у Чёрного моря";
  if (/(погод|ветер|волна)/i.test(context)) return "Погода в Архипо-Осиповке и состояние Чёрного моря";
  if (/(море|катер|морск)/i.test(context)) return "Морская прогулка на катере в Архипо-Осиповке";
  if (/(вечер|закат)/i.test(context)) return "Прогулка на закате у Чёрного моря в Архипо-Осиповке";

  if (sectionId === "map-points") return "Реальная точка маршрута в Архипо-Осиповке, Краснодарский край";
  if (sectionId === "sea-trips") return "Морской маршрут в Архипо-Осиповке, Чёрное море";
  if (sectionId === "active") return "Активный маршрут в Архипо-Осиповке";
  if (sectionId === "family") return "Семейный маршрут в Архипо-Осиповке";

  const activityTitle = normalizeText(activity?.title || "", "");
  if (activityTitle) return `${activityTitle} в Архипо-Осиповке`;

  return "";
}

function renderCardPhoto(card, sectionId, className = "home-card-photo") {
  const activity = getActivityForCard(card);
  const imageClass = inferImageClass(card, sectionId, activity);
  const entityLabel = inferCardEntityLabel(card, sectionId, activity);
  const lazyClass = activity?.id === "sup-vulan" || activity?.slug === "sup-vulan" ? "" : " card-photo-lazy";
  if (entityLabel) {
    return `<div class="${className} image-placeholder card-photo ${imageClass}${lazyClass}" role="img" aria-label="${escapeHtml(entityLabel)}" data-entity="${escapeHtml(normalizeEntityAttribute(entityLabel))}"></div>`;
  }
  return `<div class="${className} image-placeholder card-photo ${imageClass}${lazyClass}" aria-hidden="true"></div>`;
}

function renderHomeIcon(iconKey) {
  const key = homeIconSvgByKey[iconKey] ? iconKey : "route";
  return `<svg class="home-icon-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${homeIconSvgByKey[key]}</svg>`;
}

function renderIconBadge(iconKey, className) {
  const key = homeIconSvgByKey[iconKey] ? iconKey : "route";
  return `<span class="${className} ${className}--${key}" aria-hidden="true">${renderHomeIcon(key)}</span>`;
}

function getSectionAction(block, sectionId) {
  return block?.action || sectionMeta[sectionId]?.action || null;
}

function renderSectionHead(sectionId, titleId) {
  const block = HOME_BLOCKS[sectionId];
  const title = normalizeText(block?.title, sectionId);
  const lead = normalizeText(block?.lead, "");
  const action = getSectionAction(block, sectionId);
  const leadMarkup = lead ? `<p>${escapeHtml(lead)}</p>` : "";
  const actionMarkup = action?.href && action?.label
    ? `<a class="home-section__link" href="${normalizeHref(action.href)}">${escapeHtml(action.label)} <span aria-hidden="true">→</span></a>`
    : "";

  return [
    '<div class="home-section__head">',
    `<div><h2 id="${titleId}">${escapeHtml(title)}</h2>${leadMarkup}</div>`,
    actionMarkup,
    "</div>"
  ].join("");
}

function renderSectionShell(sectionId, bodyMarkup, modifier = "") {
  const block = HOME_BLOCKS[sectionId];
  if (!block) return "";

  const meta = sectionMeta[sectionId] || {};
  const anchorId = meta.anchorId || sectionId;
  const titleId = `${sectionId}-title`;
  const modifierClass = modifier ? ` ${modifier}` : "";

  return [
    `<section class="home-section${modifierClass}" id="${anchorId}" data-home-section-id="${sectionId}" aria-labelledby="${titleId}">`,
    renderSectionHead(sectionId, titleId),
    bodyMarkup,
    "</section>"
  ].join("");
}

function renderQuickChoiceTile(card, sectionId) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Направление");
  const description = normalizeText(card?.description, "Подобрать формат");
  const iconKey = iconByCardId[card?.id] || "route";

  return [
    `<a class="home-choice-tile" href="${href}">`,
    renderIconBadge(iconKey, "home-choice-icon"),
    "<span>",
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(description)}</small>`,
    "</span>",
    "</a>"
  ].join("");
}

function renderQuickChoiceSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-choice-grid">${block.cards.map((card) => renderQuickChoiceTile(card, sectionId)).join("")}</div>`;
  return renderSectionShell(sectionId, body, "home-section--quick-choice");
}

function renderDirectionCard(card, sectionId) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Направление");
  const description = normalizeText(card?.description, "Короткое описание направления.");
  const cta = sectionId === "popular-directions" ? "Смотреть" : normalizeText(card?.cta, "Смотреть");

  return [
    `<a class="home-direction-card" href="${href}">`,
    renderCardPhoto(card, sectionId, "home-direction-photo"),
    '<span class="home-direction-body">',
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(description)}</small>`,
    `<span class="home-mini-button">${escapeHtml(cta)}</span>`,
    "</span>",
    "</a>"
  ].join("");
}

function renderPopularDirectionsSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-directions-grid">${block.cards.map((card) => renderDirectionCard(card, sectionId)).join("")}</div>`;
  return renderSectionShell(sectionId, body, "home-section--popular-directions");
}

function renderScenarioCard(card) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Сценарий");
  const description = normalizeText(card?.description, "Подходящий вариант на сегодня.");
  const iconKey = iconByCardId[card?.id] || "route";

  return [
    `<a class="home-scenario-card" href="${href}">`,
    renderIconBadge(iconKey, "home-scenario-icon"),
    "<span>",
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(description)}</small>`,
    '<em>Посмотреть варианты <span aria-hidden="true">→</span></em>',
    "</span>",
    "</a>"
  ].join("");
}

function renderBySituationSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-advisor-panel"><div class="home-scenarios-grid">${block.cards.map(renderScenarioCard).join("")}</div></div>`;
  return renderSectionShell(sectionId, body, "home-section--by-situation");
}

function renderRouteCard(card, sectionId) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Точка на карте");
  const price = card?.needsData === true ? "уточнить" : compactMeta(card?.price, "уточнить");
  const duration = compactMeta(card?.duration, "30-60 минут");
  const cta = normalizeText(card?.cta, "Маршрут");

  return [
    `<a class="home-route-card" href="${href}">`,
    renderCardPhoto(card, sectionId, "home-route-photo"),
    '<span class="home-route-body">',
    `<strong>${escapeHtml(title)}</strong>`,
    `<span class="home-route-meta"><span>${escapeHtml(price)}</span><span>${escapeHtml(duration)}</span></span>`,
    `<span class="home-route-action"><span>${escapeHtml(cta)}</span><i aria-hidden="true">⌖</i></span>`,
    "</span>",
    "</a>"
  ].join("");
}

function renderMapPointsSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-map-grid">${block.cards.map((card) => renderRouteCard(card, sectionId)).join("")}</div>`;
  return renderSectionShell(sectionId, body, "home-section--map-points");
}

function renderSeaTripCard(card, sectionId) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Морская прогулка");
  const duration = compactMeta(card?.duration, "По расписанию");
  const audience = normalizeText(card?.audience, "Уточнить, кому подходит");
  const important = card?.needsData === true
    ? "По погоде и расписанию"
    : normalizeText(card?.important, "Условия уточняются перед выходом");
  const cta = normalizeText(card?.cta, "Узнать расписание");

  return [
    `<a class="home-service-card" href="${href}">`,
    renderCardPhoto(card, sectionId, "home-service-photo"),
    '<span class="home-service-body">',
    `<strong>${escapeHtml(title)}</strong>`,
    '<span class="home-service-facts">',
    `<small><b>Длительность:</b> ${escapeHtml(duration)}</small>`,
    `<small><b>Кому подходит:</b> ${escapeHtml(audience)}</small>`,
    `<small><b>Важно:</b> ${escapeHtml(important)}</small>`,
    "</span>",
    `<span class="home-service-cta">${escapeHtml(cta)}</span>`,
    "</span>",
    "</a>"
  ].join("");
}

function renderSeaTripsSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-sea-grid">${block.cards.map((card) => renderSeaTripCard(card, sectionId)).join("")}</div>`;
  return renderSectionShell(sectionId, body, "home-section--sea-trips");
}

function renderFamilySection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  const panel = block?.panel || {};
  if (!block) return "";

  const anchorId = sectionMeta[sectionId]?.anchorId || sectionId;
  const titleId = `${sectionId}-title`;
  const title = normalizeText(panel.title || block.title, "Для семей с детьми");
  const text = normalizeText(panel.text, "Подберите спокойный формат для семейного дня.");
  const checklist = Array.isArray(panel.checklist) ? panel.checklist : [];
  const miniLinks = Array.isArray(panel.miniLinks) ? panel.miniLinks : [];
  const cta = normalizeText(panel.cta, "Посмотреть варианты с детьми");
  const href = normalizeHref(panel.href || block.cards?.[0]?.href);

  return [
    `<section class="home-section home-section--family" id="${anchorId}" data-home-section-id="${sectionId}" aria-labelledby="${titleId}">`,
    '<div class="home-family-panel">',
    '<div class="home-family-media image-placeholder card-photo family-main-bg card-photo-lazy" role="img" aria-label="Семья с детьми на отдыхе в Архипо-Осиповке у Чёрного моря" data-entity="semya-s-detmi-v-arhipo-osipovke"></div>',
    '<div class="home-family-copy">',
    `<h2 id="${titleId}">${escapeHtml(title)}</h2>`,
    `<p>${escapeHtml(text)}</p>`,
    `<ul>${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    `<a class="home-primary-button" href="${href}">${escapeHtml(cta)}</a>`,
    "</div>",
    `<div class="home-family-links">${miniLinks.map((link, index) => [
      `<a href="${normalizeHref(link.href)}">`,
      renderIconBadge(familyMiniIconByIndex[index] || "route", "home-family-mini-icon"),
      '<span class="home-family-link-copy">',
      `<strong>${escapeHtml(link.title)}</strong>`,
      `<small>${escapeHtml(link.description)}</small>`,
      "</span>",
      '<span class="home-family-arrow" aria-hidden="true">→</span>',
      "</a>"
    ].join("")).join("")}</div>`,
    "</div>",
    "</section>"
  ].join("");
}

function renderActiveCard(card, sectionId) {
  const href = normalizeHref(card?.href);
  const title = normalizeText(card?.title, "Активность");
  const description = normalizeText(card?.description, "Активный формат отдыха.");

  return [
    `<a class="home-active-card" href="${href}">`,
    renderCardPhoto(card, sectionId, "home-active-photo"),
    '<span class="home-active-body">',
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(description)}</small>`,
    '<i aria-hidden="true">→</i>',
    "</span>",
    "</a>"
  ].join("");
}

function renderActiveSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const body = `<div class="home-active-grid">${block.cards.map((card) => renderActiveCard(card, sectionId)).join("")}</div>`;
  return renderSectionShell(sectionId, body, "home-section--active");
}

function getFirstLink(selector) {
  const link = document.querySelector(selector);
  if (!link) return null;
  return {
    href: link.getAttribute("href") || "",
    label: normalizeText(link.textContent, "")
  };
}

function formatPhoneFromHref(href) {
  const digits = String(href || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return "";
}

function renderFaqTrustSection(sectionId) {
  const block = HOME_BLOCKS[sectionId];
  if (!block || !Array.isArray(block.cards) || !block.cards.length) return "";

  const trust = block.trust || {};
  const contact = block.contact || {};
  const phoneLink = getFirstLink('a[href^="tel:"]');
  const maxLink = getFirstLink('a[href*="max.ru"]');
  const phoneHref = phoneLink?.href || "/kontakty/";
  const phoneLabel = /\d/.test(phoneLink?.label || "")
    ? phoneLink.label
    : formatPhoneFromHref(phoneHref) || phoneLink?.label || "Позвонить";
  const maxHref = maxLink?.href || "/kontakty/";
  const trustItems = Array.isArray(trust.items) ? trust.items : [];

  const faqMarkup = [
    '<div class="home-faq-column">',
    block.cards.map((card, index) => [
      `<details class="home-faq-item"${index === 0 ? " open" : ""}>`,
      `<summary>${escapeHtml(normalizeText(card.title, "Вопрос"))}</summary>`,
      `<p>${escapeHtml(normalizeText(card.description, "Ответ уточняется."))}</p>`,
      "</details>"
    ].join("")).join(""),
    "</div>"
  ].join("");

  const trustMarkup = [
    '<div class="home-trust-panel">',
    `<h3>${escapeHtml(normalizeText(trust.title, "Отдыхайте с уверенностью"))}</h3>`,
    `<ul>${trustItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    "</div>"
  ].join("");

  const contactMarkup = [
    '<div class="home-contact-panel">',
    `<h3>${escapeHtml(normalizeText(contact.title, "Нужна помощь?"))}</h3>`,
    `<p>${escapeHtml(normalizeText(contact.text, "Поможем выбрать подходящий вариант."))}</p>`,
    `<a class="home-contact-phone" href="${escapeHtml(phoneHref)}">${escapeHtml(phoneLabel)}</a>`,
    `<a class="home-primary-button" href="${escapeHtml(maxHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(normalizeText(contact.cta, "Написать в MAX"))}</a>`,
    "</div>"
  ].join("");

  const body = `<div class="home-faq-trust-grid">${faqMarkup}${trustMarkup}${contactMarkup}</div>`;
  return renderSectionShell(sectionId, body, "home-section--faq-trust");
}

const renderersBySectionId = {
  "quick-choice": renderQuickChoiceSection,
  "popular-directions": renderPopularDirectionsSection,
  "by-situation": renderBySituationSection,
  "map-points": renderMapPointsSection,
  "sea-trips": renderSeaTripsSection,
  family: renderFamilySection,
  active: renderActiveSection,
  "faq-trust": renderFaqTrustSection
};

function renderSection(sectionId) {
  const renderer = renderersBySectionId[sectionId];
  return renderer ? renderer(sectionId) : "";
}

function enableLazyCardPhotos() {
  const lazyPhotos = [...document.querySelectorAll(".card-photo-lazy")];
  if (!lazyPhotos.length) return;

  const revealPhoto = (node) => {
    node.classList.remove("card-photo-lazy");
  };

  if (!("IntersectionObserver" in window)) {
    lazyPhotos.forEach(revealPhoto);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealPhoto(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "240px 0px" }
  );

  lazyPhotos.forEach((node) => observer.observe(node));
}

function renderHomeSections() {
  if (!sectionRoot) return;

  const markup = HOME_SECTION_ORDER.map((sectionId) => renderSection(sectionId)).join("");
  sectionRoot.innerHTML = markup;
  enableLazyCardPhotos();
}

renderHomeSections();
