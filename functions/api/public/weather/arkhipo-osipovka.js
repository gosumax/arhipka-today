const locationName = "Архипо-Осиповка";
const coordinates = { latitude: 44.3719, longitude: 38.5297 };
const weatherCacheTtl = 20 * 60 * 1000;
const marineCacheTtl = 2 * 60 * 60 * 1000;
const requestTimeoutMs = 8000;

const caches = {
  weather: { expiresAt: 0, value: null },
  marine: { expiresAt: 0, value: null },
  combined: null
};

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

function roundOrNull(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number * 10) / 10;
}

function getSeaText(waveHeight) {
  if (!Number.isFinite(waveHeight)) return "нет данных сейчас";
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
    timezone: "Europe/Moscow",
    forecast_days: "1",
    wind_speed_unit: "ms"
  });
  const json = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  const current = json.current || {};
  const value = {
    airTemperature: roundOrNull(current.temperature_2m),
    weatherText: weatherCodes.get(current.weather_code) || "нет данных сейчас",
    windSpeed: roundOrNull(current.wind_speed_10m),
    windDirection: roundOrNull(current.wind_direction_10m),
    windGust: roundOrNull(current.wind_gusts_10m)
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

async function getPublicWeather(request) {
  const url = new URL(request.url);
  const forceError = url.searchParams.get("forceError") === "1";
  try {
    if (forceError) throw new Error("Forced weather fallback");
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const [weatherResult, marineResult] = await Promise.allSettled([
      getWeatherData(forceRefresh),
      getMarineData(forceRefresh)
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
      weatherText: "нет данных сейчас",
      windSpeed: null,
      windDirection: null,
      windGust: null,
      seaTemperature: null,
      waveHeight: null,
      seaText: "нет данных сейчас",
      recommendation: "Сейчас не удалось обновить погоду. Уточните условия перед выходом в море.",
      isFallback: true,
      isPartial: true
    };
  }
}

export async function onRequestGet({ request }) {
  const payload = await getPublicWeather(request);
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
