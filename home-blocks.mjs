import { activitiesCatalog } from "./activities-catalog.js";
import { newSeoPages } from "./seo-new-pages.mjs";

export const HOME_SECTION_ORDER = [
  "quick-choice",
  "popular-directions",
  "by-situation",
  "map-points",
  "sea-trips",
  "family",
  "active",
  "faq-trust"
];

const activitiesById = new Map(activitiesCatalog.map((activity) => [activity.id, activity]));
const seoPagesByPath = new Map(newSeoPages.map((page) => [page.path, page]));

const seoCardEntries = newSeoPages.flatMap((page) =>
  (page.blocks || []).flatMap((block) =>
    Array.isArray(block.cards)
      ? block.cards.map((card) => ({ page, card }))
      : []
  )
);
const mapPointByTitle = new Map(seoCardEntries.map((entry) => [entry.card.title, entry]));

function getActivityCardBase(activityId, overrides = {}) {
  const activity = activitiesById.get(activityId);
  if (!activity) {
    throw new Error(`home-blocks: activity not found: ${activityId}`);
  }

  const shortDescription = activity.shortDescription || activity.short || activity.description || "";
  const valueFromIncludes = Array.isArray(activity.includes) && activity.includes.length
    ? activity.includes.slice(0, 2).join("; ")
    : "Уточнить, что входит в формат";

  return {
    id: activity.id,
    title: activity.title,
    description: shortDescription,
    audience: activity.audience || "Уточнить, кому подходит",
    duration: activity.duration || "Уточнить длительность",
    price: activity.price || "уточнить",
    value: valueFromIncludes,
    important: activity.limits || activity.weatherAdvice || "Условия уточняются перед выездом",
    cta: "Смотреть детали",
    href: `/travel/${activity.slug || activity.id}/`,
    sourceMeta: {
      source: "activities-catalog.js",
      activityId: activity.id,
      activitySlug: activity.slug || activity.id
    },
    ...overrides
  };
}

function getMapPointCardBase(title, overrides = {}) {
  const sourceEntry = mapPointByTitle.get(title);
  const sourceCard = sourceEntry?.card;
  if (!sourceCard) {
    throw new Error(`home-blocks: map point not found: ${title}`);
  }
  const sourcePath = sourceEntry?.page?.path || "/chto-posmotret-v-arhipo-osipovke";
  const sourceHref = sourcePath.endsWith("/") ? sourcePath : `${sourcePath}/`;

  return {
    id: `map-${String(title).toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`,
    title: sourceCard.title,
    description: sourceCard.description || "Точка и режим посещения зависят от условий дня.",
    audience: "Семьи, пары и друзья",
    duration: "Уточнить перед выходом",
    price: "уточнить",
    value: "Готовая точка на карте и удобный сценарий для прогулки",
    important: "Режим работы и доступность лучше проверить в день посещения.",
    cta: "Открыть в Google Maps",
    href: sourceHref,
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: sourcePath,
      routeQuery: sourceCard.routeQuery || ""
    },
    refs: {
      routeQuery: sourceCard.routeQuery || ""
    },
    ...overrides
  };
}

const quickChoiceCards = [
  {
    id: "quick-sea",
    title: "Хочу море",
    description: "Пляжи, прогулки, купание",
    audience: "Тем, кто хочет море сегодня",
    duration: "От короткой прогулки до части дня",
    price: "уточнить",
    value: "Быстрый переход к морским форматам и пляжным сценариям",
    important: "Выход в море и купание зависят от погоды.",
    cta: "Смотреть море",
    href: "/travel/more/",
    entityLabel: "Морская прогулка на катере в Архипо-Осиповке, Чёрное море",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "more"
    }
  },
  {
    id: "quick-family",
    title: "Я с детьми",
    description: "Безопасно и интересно",
    audience: "Семьи с детьми",
    duration: "Обычно 1-4 часа",
    price: "уточнить",
    value: "Подборка форматов для семейного дня без перегруза",
    important: "Состав маршрута зависит от возраста детей и погоды.",
    cta: "Смотреть с детьми",
    href: "/s-detmi/",
    entityLabel: "Семейный отдых с детьми в Архипо-Осиповке у Чёрного моря",
    sourceMeta: {
      source: "index.html",
      section: "family"
    }
  },
  {
    id: "quick-active",
    title: "Активный отдых",
    description: "Экстрим и приключения",
    audience: "Активные гости и компании друзей",
    duration: "Обычно 1-3 часа",
    price: "уточнить",
    value: "Переход в активные маршруты с рельефом и движением",
    important: "Нужна удобная закрытая обувь и учет погодных условий.",
    cta: "Смотреть активное",
    href: "/travel/kvadrotsikly-ekstrim/",
    entityLabel: "Квадро и эндуро в Архипо-Осиповке, маршруты по рельефу",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "kvadrotsikly-ekstrim"
    }
  },
  {
    id: "quick-waterfalls",
    title: "Водопады и горы",
    description: "Природа и красивые виды",
    audience: "Тем, кто выбирает природу и поездки в горы",
    duration: "Обычно 3-6 часов",
    price: "уточнить",
    value: "Наземные маршруты, если хочется природы или море неспокойное",
    important: "Маршрут зависит от погоды и состояния дороги.",
    cta: "Смотреть водопады",
    href: "/travel/vodopady-dzhipping/",
    entityLabel: "Водопады и горные маршруты рядом с Архипо-Осиповкой, Краснодарский край",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "vodopady-dzhipping"
    }
  },
  {
    id: "quick-sunset",
    title: "Вечер / закат",
    description: "Романтика и красивые кадры",
    audience: "Пары, друзья и семьи",
    duration: "Обычно 1.5-3 часа",
    price: "уточнить",
    value: "Вечерний сценарий у моря без дневной жары",
    important: "Комфортно стартовать за 1-1.5 часа до заката.",
    cta: "Смотреть вечер",
    href: "/kuda-shodit-vecherom-v-arhipo-osipovke/",
    entityLabel: "Прогулка на закате у Чёрного моря в Архипо-Осиповке",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/kuda-shodit-vecherom-v-arhipo-osipovke"
    }
  },
  {
    id: "quick-free-walk",
    title: "Бесплатно погулять",
    description: "Лучшие бесплатные места",
    audience: "Тем, кто хочет прогулку без лишних затрат",
    duration: "Обычно 30-90 минут",
    price: "бесплатно",
    value: "Быстрый переход к прогулочным точкам рядом с курортом",
    important: "Комфортнее выбирать утро или вечер в жаркий день.",
    cta: "Смотреть прогулки",
    href: "/kuda-shodit/",
    entityLabel: "Приморский бульвар и прогулочные места в Архипо-Осиповке",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/kuda-shodit"
    }
  }
];

const popularDirectionsCards = [
  {
    id: "popular-sea",
    title: "Морские прогулки",
    description: "Катера и форматы по длительности: от короткого спокойного выхода до более насыщенного маршрута.",
    audience: "Семьи, пары, друзья",
    duration: "Обычно 1-3 часа",
    price: "уточнить",
    value: "Выбор морского формата под темп дня",
    important: "Выход зависит от погодных условий и рекомендаций экипажа.",
    cta: "Смотреть морские варианты",
    href: "/travel/more/",
    entityLabel: "Морские прогулки на катере в Архипо-Осиповке, Чёрное море",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "more"
    }
  },
  {
    id: "popular-waterfalls",
    imageClass: "kuago-waterfalls-bg",
    title: "Водопады и джиппинг",
    description: "Горные маршруты к водопадам и природным точкам, когда хочется сменить ритм или море неспокойное.",
    audience: "Любители природы, семьи, пары",
    duration: "Обычно 4-6 часов",
    price: "уточнить",
    value: "Наземный сценарий на полдня или день",
    important: "Финальный маршрут зависит от погоды и состояния дорог.",
    cta: "Открыть раздел",
    href: "/travel/vodopady-dzhipping/",
    entityLabel: "Водопады и джиппинг в Краснодарском крае рядом с Архипо-Осиповкой",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "vodopady-dzhipping"
    }
  },
  {
    id: "popular-excursions",
    title: "Экскурсии",
    description: "Готовые маршруты на день: природные точки, обзорные форматы и семейные сценарии.",
    audience: "Семьи, пары, компании друзей",
    duration: "От 2 часов до целого дня",
    price: "уточнить",
    value: "Понятная структура дня без перегруза",
    important: "Лучше уточнить длительность и точки программы заранее.",
    cta: "Смотреть экскурсии",
    href: "/travel/ekskursii/",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "ekskursii"
    }
  },
  {
    id: "popular-quad-enduro",
    title: "Квадро и эндуро",
    description: "Активные маршруты по рельефу для тех, кто хочет динамику и яркие впечатления.",
    audience: "Активные гости и компании",
    duration: "Обычно 1-3 часа",
    price: "уточнить",
    value: "Отдельное направление с активным форматом",
    important: "Сложность и темп подбираются по опыту и погоде.",
    cta: "Открыть активный раздел",
    href: "/travel/kvadrotsikly-ekstrim/",
    entityLabel: "Квадро и эндуро в Архипо-Осиповке, активный отдых в горах",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "kvadrotsikly-ekstrim"
    }
  },
  {
    id: "popular-family",
    title: "С детьми",
    description: "Семейные форматы в спокойном ритме: короткие маршруты, понятная логистика, удобные остановки.",
    audience: "Семьи с детьми",
    duration: "Обычно 1-4 часа",
    price: "уточнить",
    value: "Подборка семейных вариантов без перегруза",
    important: "Учитывайте возраст ребенка, жару и время старта.",
    cta: "Смотреть семейные форматы",
    href: "/travel/s-detmi/",
    entityLabel: "Отдых с детьми в Архипо-Осиповке, спокойные семейные маршруты",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "s-detmi"
    }
  },
  {
    id: "popular-weather",
    imageClass: "popular-weather-today-bg",
    title: "Погода и что делать сегодня",
    description: "Переход к актуальной погоде и рекомендациям, чтобы выбрать подходящий формат на текущий день.",
    audience: "Тем, кто планирует по реальным условиям",
    duration: "5-10 минут",
    price: "бесплатно",
    value: "Быстрый выбор: море или наземные сценарии",
    important: "При ветре и волне лучше выбрать альтернативные маршруты.",
    cta: "Открыть погодный раздел",
    href: "/pogoda/",
    entityLabel: "Погода в Архипо-Осиповке и состояние Чёрного моря",
    sourceMeta: {
      source: "index.html",
      section: "navigation+faq"
    }
  }
];

const bySituationCards = [
  {
    id: "situation-with-kids",
    title: "Если вы с детьми",
    description: "Спокойные места и развлечения для всей семьи.",
    audience: "Семьи с детьми",
    duration: "Обычно 1-4 часа",
    price: "уточнить",
    value: "Готовый сценарий для семейного дня",
    important: "Лучше выбирать утренние или вечерние слоты в жаркий день.",
    cta: "Посмотреть варианты",
    href: "/s-detmi/",
    sourceMeta: {
      source: "index.html",
      section: "scenario-grid"
    }
  },
  {
    id: "situation-sea",
    title: "Если хочется моря",
    description: "Лучшие пляжи и морские прогулки.",
    audience: "Тем, кто хочет море сегодня",
    duration: "От короткой прогулки до части дня",
    price: "уточнить",
    value: "Быстрый переход к морским форматам",
    important: "Выход в море и купание зависят от погоды.",
    cta: "Посмотреть варианты",
    href: "/travel/more/",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "more"
    }
  },
  {
    id: "situation-active",
    title: "Если хочется активного отдыха",
    description: "Адреналин, маршруты, незабываемые эмоции.",
    audience: "Активные гости и компании",
    duration: "Обычно 1-6 часов",
    price: "уточнить",
    value: "Быстрый переход в активные направления",
    important: "Учитывайте уровень подготовки и погоду перед стартом.",
    cta: "Посмотреть варианты",
    href: "/travel/kvadrotsikly-ekstrim/",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "kvadrotsikly-ekstrim"
    }
  },
  {
    id: "situation-evening",
    title: "Если нужен спокойный вечер",
    description: "Романтика, закаты и тихие уютные места.",
    audience: "Пары, друзья и семьи",
    duration: "Обычно 1.5-3 часа",
    price: "уточнить",
    value: "Вечерний сценарий с понятным маршрутом",
    important: "Комфортно стартовать за 1-1.5 часа до заката.",
    cta: "Посмотреть варианты",
    href: "/kuda-shodit-vecherom-v-arhipo-osipovke/",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/kuda-shodit-vecherom-v-arhipo-osipovke"
    }
  },
  {
    id: "situation-hot",
    title: "Если жарко",
    description: "Где укрыться в тени и освежиться.",
    audience: "Все форматы отдыха",
    duration: "Обычно 30-90 минут",
    price: "бесплатно и платные точки по выбору",
    value: "Легкий маршрут без перегрева",
    important: "Лучше планировать утро, тень и вечерние блоки.",
    cta: "Посмотреть варианты",
    href: "/arhipo-osipovka-za-odin-den/",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/arhipo-osipovka-za-odin-den"
    }
  },
  {
    id: "situation-windy",
    title: "Если ветрено",
    description: "Что делать, когда на море ветер.",
    audience: "Все форматы отдыха",
    duration: "Обычно 2-6 часов",
    price: "уточнить",
    value: "План Б на день с упором на сушу",
    important: "Маршрут подбирается по фактической погоде в день поездки.",
    cta: "Посмотреть варианты",
    href: "/travel/vodopady-dzhipping/",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "vodopady-dzhipping"
    }
  },
  {
    id: "situation-no-car",
    title: "Если без машины",
    description: "Доступные места рядом и на транспорте.",
    audience: "Гости без личного транспорта",
    duration: "Обычно 30-90 минут",
    price: "бесплатно и платные точки по выбору",
    value: "Пешие и близкие сценарии без сложной логистики",
    important: "Проверяйте расстояние и обратный путь заранее.",
    cta: "Посмотреть варианты",
    href: "/kuda-shodit/",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/kuda-shodit"
    }
  },
  {
    id: "situation-budget",
    title: "Если бюджет ограничен",
    description: "Интересные места бесплатно и недорого.",
    audience: "Гости, которые хотят прогулку без лишних затрат",
    duration: "Обычно 30-90 минут",
    price: "бесплатно",
    value: "Бесплатные точки и прогулочные сценарии",
    important: "Комфортнее выбирать утро или вечер в жаркий день.",
    cta: "Посмотреть варианты",
    href: "/chto-posmotret-v-arhipo-osipovke/",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/chto-posmotret-v-arhipo-osipovke"
    }
  }
];

const mapPointsCards = [
  getMapPointCardBase("Приморский бульвар и набережная", {
    title: "Приморский бульвар",
    description: "Прогулка у моря в Архипо-Осиповке, кафе рядом и понятный старт маршрута.",
    duration: "Обычно 1-2 часа",
    price: "бесплатно",
    audience: "Семьи, пары, друзья",
    important: "Комфортнее утром или после дневной жары.",
    href: "/kuda-shodit/",
    cta: "Маршрут",
    imageClass: "map-primorsky-bg",
    entityLabel: "Приморский бульвар в Архипо-Осиповке, Краснодарский край"
  }),
  getMapPointCardBase("Гора Ёжик, смотровая площадка", {
    title: "Гора Ёжик",
    description: "Смотровая точка в Архипо-Осиповке для видов на бухту Чёрного моря и фото.",
    duration: "Обычно 1-1.5 часа",
    price: "бесплатно",
    audience: "Пары, друзья, любители фото",
    important: "Лучше ехать в ясную погоду к закату или утром.",
    href: "/kuda-shodit-vecherom-v-arhipo-osipovke/",
    cta: "Маршрут",
    imageClass: "map-ezhik-bg",
    entityLabel: "Гора Ёжик и вид на море в Архипо-Осиповке"
  }),
  getMapPointCardBase("Михайловское укрепление", {
    description: "Историческая точка в Архипо-Осиповке для спокойной познавательной прогулки.",
    duration: "Обычно 45-90 минут",
    price: "уточнить стоимость входа",
    audience: "Семьи, гости с интересом к истории",
    important: "Проверьте режим работы и билеты в день посещения.",
    href: "/chto-posmotret-v-arhipo-osipovke/",
    cta: "Маршрут",
    imageClass: "map-fort-bg",
    entityLabel: "Михайловское укрепление в Архипо-Осиповке"
  }),
  getMapPointCardBase("Музей хлеба и вина", {
    description: "Спокойный семейный блок в Архипо-Осиповке в середине дня.",
    duration: "Обычно 45-90 минут",
    price: "уточнить",
    audience: "Семьи, пары",
    important: "Режим и стоимость посещения лучше уточнять заранее.",
    href: "/chto-posmotret-v-arhipo-osipovke/#muzei-hleba-i-vina",
    cta: "Маршрут",
    imageClass: "map-museum-bg",
    entityLabel: "Музей хлеба и вина в Архипо-Осиповке"
  }),
  getMapPointCardBase("Центральный пляж на закате", {
    description: "Пауза у воды в Архипо-Осиповке для спокойного финала дня и фото.",
    duration: "Обычно 40-90 минут",
    price: "бесплатно",
    audience: "Пары, семьи, друзья",
    important: "Комфортно за 30-60 минут до заката.",
    href: "/kuda-shodit-vecherom-v-arhipo-osipovke/#centralnyi-plyazh-na-zakate",
    cta: "Маршрут",
    imageClass: "map-sunset-beach-bg",
    entityLabel: "Центральный пляж Архипо-Осиповки на закате"
  }),
  getMapPointCardBase("Подвесной мост через Вулан", {
    description: "Короткая прогулка через реку Вулан в Архипо-Осиповке в спокойном темпе.",
    duration: "Обычно 40-90 минут",
    price: "бесплатно",
    audience: "Семьи с детьми, пары",
    important: "Подходит как короткая прогулка в спокойном темпе.",
    href: "/arhipo-osipovka-za-odin-den/",
    cta: "Маршрут",
    imageClass: "map-vulan-bridge-bg",
    entityLabel: "Подвесной мост через реку Вулан в Архипо-Осиповке"
  })
];

const seaTripsCards = [
  getActivityCardBase("classic-boat-1h", {
    title: "Катер 1 час",
    description: "Спокойная прогулка на катере к красивым морским точкам.",
    cta: "Узнать расписание",
    entityLabel: "Морская прогулка на катере в Архипо-Осиповке"
  }),
  getActivityCardBase("speed-boat-2h", {
    title: "Скоростная прогулка 2 часа",
    cta: "Узнать расписание"
  }),
  getActivityCardBase("speed-boat-3h", {
    imageClass: "speed-boat-3h-bg",
    title: "Скоростная прогулка 3 часа",
    cta: "Узнать расписание",
    entityLabel: "Морская прогулка на закате в Архипо-Осиповке, Чёрное море"
  }),
  {
    id: "sea-sunset-walk-fallback",
    title: "Прогулка на закате",
    description: "Вечерний морской сценарий, который зависит от погоды и расписания.",
    audience: "Пары, друзья, семьи",
    duration: "Обычно вечерний слот",
    price: "уточнить",
    value: "Выбор вечернего формата с мягким светом и спокойным темпом",
    important: "Время старта привязано к закату и погоде.",
    cta: "Узнать расписание",
    href: "/progulka-na-zakate-arhipo-osipovka/",
    entityLabel: "Прогулка на закате у Чёрного моря в Архипо-Осиповке",
    sourceMeta: {
      source: "fallback + seo-snapshot",
      reason: "В каталоге нет отдельной activity-сущности",
      relatedRoute: "/progulka-na-zakate-arhipo-osipovka/"
    },
    needsData: true,
    fallbackAllowed: true
  },
  getActivityCardBase("private-boat", {
    id: "sea-private-boat",
    title: "Индивидуальный катер",
    cta: "Узнать расписание"
  })
];

const familyCards = [
  {
    id: "family-guide",
    title: "Семейный маршрут без перегруза",
    description: "Подборка спокойных форматов: короткие морские выходы, понятная логистика и мягкий темп.",
    audience: "Семьи с детьми",
    duration: "Обычно 1-4 часа",
    price: "уточнить",
    value: "Переход в раздел, где удобно выбирать по возрасту и ритму дня",
    important: "Лучше планировать утро и вечер, избегая пикового зноя.",
    cta: "Открыть раздел с детьми",
    href: "/s-detmi/",
    entityLabel: "Отдых с детьми в Архипо-Осиповке у Чёрного моря",
    sourceMeta: {
      source: "index.html + page-renderer.mjs",
      section: "kids"
    }
  },
  getActivityCardBase("classic-boat-1h", {
    id: "family-classic-boat",
    cta: "Смотреть короткий морской формат"
  }),
  getActivityCardBase("speed-boat-2h", {
    id: "family-speed-boat",
    cta: "Смотреть насыщенный семейный формат"
  }),
  getActivityCardBase("bus-tour", {
    id: "family-bus-tour",
    cta: "Смотреть обзорный формат"
  })
];

const activeCards = [
  {
    id: "active-direction",
    title: "Квадро и эндуро",
    description: "Маршруты по горам и рельефу.",
    audience: "Активные гости, компании друзей",
    duration: "Обычно 1-3 часа",
    price: "уточнить",
    value: "Быстрый переход в раздел активного отдыха",
    important: "Маршрут подбирается по погоде и опыту участников.",
    cta: "Смотреть",
    href: "/travel/kvadrotsikly-ekstrim/",
    entityLabel: "Квадро и эндуро в Архипо-Осиповке, активный отдых по рельефу",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "kvadrotsikly-ekstrim"
    }
  },
  getActivityCardBase("enduro-1h", {
    id: "active-enduro",
    title: "Эндуро",
    description: "Короткий активный маршрут по подготовленным трассам.",
    cta: "Смотреть"
  }),
  getActivityCardBase("pshada-waterfalls-jeep", {
    id: "active-jeeping",
    title: "Джиппинг",
    description: "Горы, реки и внедорожные маршруты.",
    cta: "Смотреть",
    entityLabel: "Джиппинг по горным маршрутам рядом с Архипо-Осиповкой"
  }),
  getActivityCardBase("silver-waterfalls", {
    id: "active-waterfalls",
    title: "Водопады",
    description: "Прохлада и природа горного края.",
    cta: "Смотреть",
    entityLabel: "Водопады рядом с Архипо-Осиповкой, Краснодарский край"
  }),
  getActivityCardBase("sup-vulan", {
    id: "active-sup-diving",
    title: "SUP / дайвинг",
    description: "Море, сап-борд и подводный мир.",
    cta: "Смотреть"
  })
];

const faqTrustCards = [
  {
    id: "faq-with-kids",
    title: "Можно ли с детьми?",
    description: "Да, но лучше выбирать короткие маршруты, спокойный темп и формат по возрасту ребенка.",
    audience: "Семьи с детьми",
    duration: "1-4 часа",
    price: "уточнить",
    value: "Помогает выбрать семейный формат без перегруза",
    important: "Учитывайте возраст ребенка, жару и время старта.",
    cta: "Посмотреть ответ",
    href: "/s-detmi/",
    sourceMeta: {
      source: "index.html + page-renderer.mjs",
      section: "faq"
    }
  },
  {
    id: "faq-what-to-take",
    title: "Что взять на море?",
    description: "Воду, головной убор, защиту от солнца и вещи, которые нужны именно вашему формату прогулки.",
    audience: "Гости, которые выходят к морю",
    duration: "5-10 минут на подготовку",
    price: "бесплатно",
    value: "Чек-лист перед выходом к морю",
    important: "Список лучше уточнять под выбранный формат и погоду.",
    cta: "Посмотреть ответ",
    href: "/chto-vzyat-na-morskuyu-progulku/",
    sourceMeta: {
      source: "seo-new-pages.mjs",
      seoPath: "/chto-vzyat-na-morskuyu-progulku"
    }
  },
  {
    id: "faq-weather",
    title: "Что если погода испортится?",
    description: "Морские форматы зависят от ветра и волны; в такой день можно выбрать наземные маршруты.",
    audience: "Все гости",
    duration: "5-10 минут на проверку",
    price: "бесплатно",
    value: "План Б для дня с ветром или волной",
    important: "Финальное решение по морю зависит от погоды и организаторов.",
    cta: "Посмотреть ответ",
    href: "/pogoda/",
    sourceMeta: {
      source: "index.html",
      section: "faq"
    }
  },
  {
    id: "faq-alcohol",
    title: "Можно ли с алкоголем?",
    description: "Правила зависят от формата. Для морских и активных маршрутов лучше уточнять ограничения заранее.",
    audience: "Компании взрослых гостей",
    duration: "Уточнить перед бронированием",
    price: "уточнить",
    value: "Помогает заранее понять правила конкретного формата",
    important: "Безопасность и правила организатора важнее планов на отдых.",
    cta: "Посмотреть ответ",
    href: "/morskie-progulki/",
    sourceMeta: {
      source: "index.html",
      section: "faq"
    }
  },
  {
    id: "faq-dolphins",
    title: "Есть ли дельфины?",
    description: "Встречи в море не гарантируются. Это зависит от сезона, погоды и маршрута.",
    audience: "Гости, которые выбирают морскую прогулку",
    duration: "Зависит от маршрута",
    price: "уточнить",
    value: "Честное ожидание без обещаний увидеть дельфинов",
    important: "Не стоит планировать прогулку только ради гарантированной встречи.",
    cta: "Посмотреть ответ",
    href: "/travel/more/",
    sourceMeta: {
      source: "page-renderer.mjs",
      categorySlug: "more"
    }
  },
  {
    id: "faq-booking",
    title: "Как забронировать?",
    description: "Напишите в MAX или позвоните: подскажем формат, время и что важно уточнить до выхода.",
    audience: "Гости, которым нужен быстрый подбор",
    duration: "Обычно несколько минут",
    price: "бесплатно",
    value: "Прямая связь перед бронированием",
    important: "Популярные слоты лучше уточнять заранее.",
    cta: "Посмотреть ответ",
    href: "/kontakty/",
    sourceMeta: {
      source: "index.html",
      section: "contacts"
    }
  },
  {
    id: "faq-contact",
    title: "Как связаться?",
    description: "Телефон и MAX доступны в шапке и в контактах. Можно описать состав компании и желаемый формат.",
    audience: "Все гости",
    duration: "Обычно несколько минут",
    price: "бесплатно",
    value: "Понятный переход к прямой помощи",
    important: "Для быстрого ответа сразу укажите дату, время и состав компании.",
    cta: "Посмотреть ответ",
    href: "/travel/#contacts",
    sourceMeta: {
      source: "index.html",
      section: "contacts"
    }
  }
];

export const HOME_BLOCKS = {
  "quick-choice": {
    id: "quick-choice",
    title: "Быстрый выбор направления",
    cards: quickChoiceCards
  },
  "popular-directions": {
    id: "popular-directions",
    title: "Популярные направления",
    action: {
      label: "Смотреть все направления",
      href: "/travel/"
    },
    cards: popularDirectionsCards
  },
  "by-situation": {
    id: "by-situation",
    title: "Что выбрать по ситуации",
    lead: "Мы подскажем, что подойдет именно вам.",
    cards: bySituationCards
  },
  "map-points": {
    id: "map-points",
    title: "Реальные точки и маршруты на карте",
    action: {
      label: "Смотреть все точки на карте",
      href: "/chto-posmotret-v-arhipo-osipovke/"
    },
    cards: mapPointsCards
  },
  "sea-trips": {
    id: "sea-trips",
    title: "Морские прогулки",
    cards: seaTripsCards
  },
  family: {
    id: "family",
    title: "Для семей с детьми",
    panel: {
      title: "Для семей с детьми",
      text: "Архипо-Осиповка подходит для отдыха с детьми, если выбрать правильный формат.",
      checklist: [
        "безопасные и проверенные места",
        "короткие маршруты без переутомления",
        "что взять с собой",
        "чего лучше избегать с маленькими детьми"
      ],
      cta: "Посмотреть варианты с детьми",
      href: "/s-detmi/",
      miniLinks: [
        {
          title: "Пляжи для детей",
          description: "Мелкое море и удобный вход",
          href: "/s-detmi/"
        },
        {
          title: "Развлечения и парки",
          description: "Аквапарк, аттракционы и игровые площадки",
          href: "/s-detmi/"
        },
        {
          title: "Кафе и питание",
          description: "Где вкусно и удобно накормить детей",
          href: "/s-detmi/"
        }
      ]
    },
    cards: familyCards
  },
  active: {
    id: "active",
    title: "Активный отдых",
    action: {
      label: "Смотреть все активности",
      href: "/travel/kvadrotsikly-ekstrim/"
    },
    cards: activeCards
  },
  "faq-trust": {
    id: "faq-trust",
    title: "FAQ и доверие",
    trust: {
      title: "Отдыхайте с уверенностью",
      items: [
        "проверенные маршруты и партнёры",
        "актуальная информация",
        "честные цены без скрытых доплат",
        "забота о безопасности"
      ]
    },
    contact: {
      title: "Нужна помощь?",
      text: "Поможем выбрать подходящий вариант.",
      cta: "Написать в MAX"
    },
    cards: faqTrustCards
  }
};
