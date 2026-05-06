import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { activitiesCatalog } from "../activities-catalog.js";
import { HOME_BLOCKS, HOME_SECTION_ORDER } from "../home-blocks.mjs";
import { categoryPages, getActivitySlug } from "../page-renderer.mjs";
import { newSeoPages } from "../seo-new-pages.mjs";

const EXPECTED_SECTION_ORDER = [
  "quick-choice",
  "popular-directions",
  "by-situation",
  "map-points",
  "sea-trips",
  "family",
  "active",
  "faq-trust"
];

const REQUIRED_CARD_FIELDS = [
  "id",
  "title",
  "description",
  "href",
  "cta",
  "audience",
  "duration",
  "price",
  "value",
  "important",
  "sourceMeta"
];

const REQUIRED_POPULAR_TITLES = [
  "Морские прогулки",
  "Водопады и джиппинг",
  "Экскурсии",
  "Квадро и эндуро",
  "С детьми",
  "Погода и что делать сегодня"
];

const ALLOWED_ENGLISH_UI_TERMS = ["MAX", "SUP", "Google Maps"];
const LEGAL_ROUTES = ["/privacy/", "/personal-data-consent/", "/marketing-consent/", "/cookie-policy/", "/kontakty/"];

const errors = [];
const warnings = [];
const needsDataCards = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function asNormalizedRoute(pathname = "") {
  const trimmed = String(pathname || "").trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("/")) return trimmed;
  if (trimmed === "/") return "/";

  const [withoutHash] = trimmed.split("#");
  const [withoutQuery] = withoutHash.split("?");
  if (!withoutQuery) return "";
  if (withoutQuery.endsWith("/")) return withoutQuery;
  return `${withoutQuery}/`;
}

function extractRouteFromHref(href) {
  if (typeof href !== "string" || !href.trim()) return null;
  const value = href.trim();
  if (/^https?:\/\//i.test(value) || /^mailto:/i.test(value) || /^tel:/i.test(value)) {
    return null;
  }
  if (!value.startsWith("/")) return null;
  return asNormalizedRoute(value);
}

function isValuePresent(value) {
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null;
}

function hasUnexpectedEnglish(text) {
  if (typeof text !== "string" || !text.trim()) return false;
  let cleaned = text;
  for (const allowed of ALLOWED_ENGLISH_UI_TERMS) {
    const escaped = allowed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(escaped, "gi"), "");
  }
  return /[A-Za-z]{2,}/.test(cleaned);
}

function containsMojibake(text) {
  if (typeof text !== "string") return false;
  if (text.includes("�")) return true;
  return /[ЃѓЉЊЋЏђљњќћџÐÑÃÂ]/.test(text);
}

async function collectExistingRoutes() {
  const routes = new Set(["/travel/"]);

  for (const route of LEGAL_ROUTES) {
    routes.add(asNormalizedRoute(route));
  }

  for (const activity of activitiesCatalog) {
    routes.add(asNormalizedRoute(`/travel/${getActivitySlug(activity)}`));
  }

  for (const category of categoryPages) {
    routes.add(asNormalizedRoute(`/travel/${category.slug}`));
  }

  for (const page of newSeoPages) {
    routes.add(asNormalizedRoute(page.path));
  }

  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const snapshotDir = path.join(projectRoot, "seo-snapshots");
  const snapshotEntries = await readdir(snapshotDir, { withFileTypes: true });
  for (const entry of snapshotEntries) {
    if (!entry.isDirectory()) continue;
    routes.add(asNormalizedRoute(`/${entry.name}`));
  }

  return routes;
}

function validateSectionOrder() {
  if (!Array.isArray(HOME_SECTION_ORDER)) {
    addError("HOME_SECTION_ORDER должен быть массивом.");
    return;
  }

  if (HOME_SECTION_ORDER.length !== EXPECTED_SECTION_ORDER.length) {
    addError(
      `HOME_SECTION_ORDER должен содержать ровно ${EXPECTED_SECTION_ORDER.length} секций, сейчас: ${HOME_SECTION_ORDER.length}.`
    );
  }

  for (let i = 0; i < EXPECTED_SECTION_ORDER.length; i += 1) {
    if (HOME_SECTION_ORDER[i] !== EXPECTED_SECTION_ORDER[i]) {
      addError(
        `Нарушен порядок секций: позиция ${i + 1}, ожидается "${EXPECTED_SECTION_ORDER[i]}", получено "${HOME_SECTION_ORDER[i]}".`
      );
    }
  }
}

function validateSectionsExist() {
  for (const sectionId of HOME_SECTION_ORDER) {
    if (!HOME_BLOCKS[sectionId]) {
      addError(`Секция "${sectionId}" есть в HOME_SECTION_ORDER, но отсутствует в HOME_BLOCKS.`);
    }
  }
}

function validatePopularDirections() {
  const popularSection = HOME_BLOCKS["popular-directions"];
  if (!popularSection || !Array.isArray(popularSection.cards)) {
    addError('Секция "popular-directions" отсутствует или не содержит cards.');
    return;
  }

  const lowerTitles = new Set(popularSection.cards.map((card) => String(card?.title || "").trim().toLowerCase()));
  for (const title of REQUIRED_POPULAR_TITLES) {
    if (!lowerTitles.has(title.toLowerCase())) {
      addError(`В popular-directions отсутствует обязательное направление: "${title}".`);
    }
  }
}

function validateRequiredQuadLink(allCards) {
  const requiredHref = "/travel/kvadrotsikly-ekstrim/";
  const hasRequired = allCards.some((entry) => extractRouteFromHref(entry.card.href) === requiredHref);
  if (!hasRequired) {
    addError(`Обязательная ссылка "${requiredHref}" не найдена в HOME_BLOCKS.`);
  }
}

function validateCardContent(existingRoutes) {
  const allCards = [];

  for (const sectionId of HOME_SECTION_ORDER) {
    const section = HOME_BLOCKS[sectionId];
    if (!section) continue;

    if (!Array.isArray(section.cards) || section.cards.length === 0) {
      addError(`Секция "${sectionId}" должна содержать непустой массив cards.`);
      continue;
    }

    const idsInSection = new Map();
    const hrefsInSection = new Map();

    section.cards.forEach((card, index) => {
      const cardRef = `${sectionId}[${index}]`;
      allCards.push({ sectionId, card });

      if (!card || typeof card !== "object") {
        addError(`${cardRef}: карточка должна быть объектом.`);
        return;
      }

      for (const field of REQUIRED_CARD_FIELDS) {
        if (!isValuePresent(card[field])) {
          addError(`${cardRef}: отсутствует обязательное поле "${field}".`);
        }
      }

      if (card.id) {
        const idCount = idsInSection.get(card.id) || 0;
        idsInSection.set(card.id, idCount + 1);
      }

      if (card.href) {
        const hrefCount = hrefsInSection.get(card.href) || 0;
        hrefsInSection.set(card.href, hrefCount + 1);
      }

      const coreFields = [card.title, card.description, card.audience, card.duration, card.price, card.value, card.important, card.cta];
      if (coreFields.every((value) => !isValuePresent(value))) {
        addError(`${cardRef}: обнаружена пустая карточка.`);
      }

      const route = extractRouteFromHref(card.href);
      if (!route) {
        addError(`${cardRef}: href "${card.href}" должен вести на внутренний маршрут проекта.`);
      } else if (!existingRoutes.has(route)) {
        addError(`${cardRef}: href "${card.href}" не найден среди существующих маршрутов проекта.`);
      }

      if (hasUnexpectedEnglish(card.title)) {
        addError(`${cardRef}: title содержит английскую UI-фразу вне разрешенных исключений.`);
      }
      if (hasUnexpectedEnglish(card.cta)) {
        addError(`${cardRef}: cta содержит английскую UI-фразу вне разрешенных исключений.`);
      }
      if (hasUnexpectedEnglish(card.description)) {
        addError(`${cardRef}: description содержит английскую UI-фразу вне разрешенных исключений.`);
      }

      if (card.needsData === true) {
        needsDataCards.push({
          sectionId,
          id: card.id,
          title: card.title,
          href: card.href
        });

        if (card.fallbackAllowed !== true) {
          addWarning(`${cardRef}: needsData=true без явного fallbackAllowed=true.`);
        }
      }
    });

    for (const [id, count] of idsInSection.entries()) {
      if (count > 1) {
        addError(`Секция "${sectionId}": дублируется id "${id}" (${count} раза).`);
      }
    }

    for (const [href, count] of hrefsInSection.entries()) {
      if (count <= 1) continue;
      const duplicatedCards = section.cards.filter((card) => card?.href === href);
      const allFallbackDuplicates = duplicatedCards.every((card) => card?.needsData === true && card?.fallbackAllowed === true);
      if (!allFallbackDuplicates) {
        addError(`Секция "${sectionId}": дублируется href "${href}" (${count} раза) без явного fallback-сценария.`);
      }
    }
  }

  validateRequiredQuadLink(allCards);
}

function validateNoMojibake() {
  const payload = JSON.stringify({ HOME_SECTION_ORDER, HOME_BLOCKS });
  if (containsMojibake(payload)) {
    addError("В home-blocks обнаружены символы кракозябр или replacement character (�).");
  }
}

async function run() {
  const existingRoutes = await collectExistingRoutes();

  validateSectionOrder();
  validateSectionsExist();
  validatePopularDirections();
  validateCardContent(existingRoutes);
  validateNoMojibake();

  console.log("validate-home report");
  console.log(`Sections checked: ${HOME_SECTION_ORDER.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (needsDataCards.length) {
    console.log("needsData cards (WARN):");
    needsDataCards.forEach((entry) => {
      console.log(`- [${entry.sectionId}] ${entry.id} | ${entry.title} | ${entry.href}`);
    });
  }

  if (warnings.length) {
    console.log("Warnings list:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length) {
    console.log("Errors list:");
    errors.forEach((error) => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("OK: HOME_BLOCKS validation passed.");
}

run().catch((error) => {
  console.error("validate-home fatal error:", error);
  process.exitCode = 1;
});

