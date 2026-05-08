(() => {
  const coordinates = { latitude: 44.3719, longitude: 38.5297 };
  const weatherEndpoint = "/api/public/weather/arkhipo-osipovka";
  const dataVersion = "20260508-weather-stable";
  const storageKey = "arkhipka.weather.last.v2";
  const requestTimeoutMs = 8000;
  const cacheBusterMs = 5 * 60 * 1000;
  const fallbackMessage = "Сейчас live-обновление погоды недоступно. Показываем резервную сводку, перед выходом в море уточните условия.";

  const staticFallbackWeather = {
    updatedAt: "2026-05-07T09:00:00+03:00",
    airTemperature: 18,
    weatherText: "Резервная сводка",
    windSpeed: 3,
    windDirection: 90,
    windGust: 5,
    seaTemperature: 13,
    waveHeight: 0.3,
    seaText: "Небольшая волна",
    recommendation: "Live-данные временно недоступны: перед морем уточните ветер и волну у капитана.",
    isFallback: true,
    isStaticFallback: true
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

  const debugWeather = (level, message, details) => {
    if (!window.console || typeof window.console[level] !== "function") return;
    window.console[level](`[weather-widget] ${message}`, details || "");
  };

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const isFiniteNumber = (value) => (
    value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
  );

  const roundOrNull = (value) => (
    isFiniteNumber(value) ? Math.round(Number(value) * 10) / 10 : null
  );

  const hasUsableWeatherData = (weather) => {
    if (!weather || typeof weather !== "object") return false;
    return [
      weather.airTemperature,
      weather.seaTemperature,
      weather.windSpeed,
      weather.waveHeight
    ].some(isFiniteNumber);
  };

  const normalizeWeather = (weather, extra = {}) => ({
    ...weather,
    airTemperature: roundOrNull(weather.airTemperature),
    seaTemperature: roundOrNull(weather.seaTemperature),
    windSpeed: roundOrNull(weather.windSpeed),
    windDirection: roundOrNull(weather.windDirection),
    windGust: roundOrNull(weather.windGust),
    waveHeight: roundOrNull(weather.waveHeight),
    updatedAt: weather.updatedAt || new Date().toISOString(),
    ...extra
  });

  const formatTemperature = (value) => {
    if (!isFiniteNumber(value)) return "уточняется";
    const rounded = Math.round(Number(value));
    return `${rounded > 0 ? "+" : ""}${rounded}°C`;
  };

  const formatWind = (value) => (
    isFiniteNumber(value) ? `${Math.round(Number(value))} м/с` : "уточняется"
  );

  const getSeaText = (waveHeight) => {
    if (!isFiniteNumber(waveHeight)) return "уточняется";
    const height = Number(waveHeight);
    if (height < 0.25) return "Спокойно";
    if (height < 0.6) return "Небольшая волна";
    if (height < 1.0) return "Есть волна";
    return "Сильное волнение";
  };

  const formatWave = (value, seaText = "") => {
    if (!isFiniteNumber(value)) return "уточняется";
    const height = Number(value);
    const formattedHeight = height.toFixed(1).replace(".", ",");
    const state = seaText && seaText !== "уточняется" ? seaText.toLowerCase() : (height < 0.6 ? "спокойно" : "есть волна");
    return `${formattedHeight} м / ${state}`;
  };

  const formatUpdatedAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `обновлено: ${new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow"
    }).format(date)}`;
  };

  const formatWindDirection = (degrees) => {
    if (!isFiniteNumber(degrees)) return "";
    const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const index = Math.round(Number(degrees) / 45) % directions.length;
    return directions[index];
  };

  const formatWindDetail = (weather) => {
    const parts = [];
    const direction = formatWindDirection(weather.windDirection);
    if (direction) parts.push(direction);
    if (isFiniteNumber(weather.windGust)) parts.push(`порывы до ${Math.round(Number(weather.windGust))} м/с`);
    return parts.length ? parts.join(", ") : "порывы уточняются";
  };

  const getRecommendation = ({ windSpeed, waveHeight }) => {
    const hasWind = isFiniteNumber(windSpeed);
    const hasWave = isFiniteNumber(waveHeight);
    const strongWind = hasWind && Number(windSpeed) >= 9;
    const highWave = hasWave && Number(waveHeight) >= 1;
    const mediumWind = hasWind && Number(windSpeed) >= 6;
    const noticeableWave = hasWave && Number(waveHeight) >= 0.6;

    if (strongWind || highWave) {
      return "Для моря условия могут быть некомфортными, рассмотрите водопады или прогулку по берегу.";
    }
    if (mediumWind || noticeableWave) {
      return "Перед выходом лучше уточнить условия у капитана.";
    }
    if (hasWind && hasWave) {
      return "Море спокойное, можно смотреть морские прогулки.";
    }
    return "Перед выходом лучше уточнить условия у капитана.";
  };

  const getFallbackStatus = (weather) => {
    if (weather.isCachedFallback) {
      return "Live-обновление временно недоступно. Показываем последнюю сохранённую сводку.";
    }
    if (weather.isStaticFallback) {
      return fallbackMessage;
    }
    if (weather.isFallback) {
      return fallbackMessage;
    }
    if (weather.isPartial) {
      return "Часть погодных источников временно недоступна, но сводка частично обновлена.";
    }
    return "Свежая туристическая сводка для выбора отдыха сегодня.";
  };

  const applyWeather = (weather) => {
    setText("[data-weather-air]", formatTemperature(weather.airTemperature));
    setText("[data-weather-sea]", formatTemperature(weather.seaTemperature));
    setText("[data-weather-wind]", formatWind(weather.windSpeed));
    setText("[data-weather-wave]", formatWave(weather.waveHeight, weather.seaText));
    setText("[data-weather-text]", weather.weatherText || "погодные условия уточняются");
    setText("[data-weather-sea-text]", weather.seaText || getSeaText(weather.waveHeight));
    setText("[data-weather-wind-detail]", formatWindDetail(weather));
    setText("[data-weather-wave-detail]", weather.seaText || getSeaText(weather.waveHeight));
    setText("[data-weather-status]", getFallbackStatus(weather));
    setText("[data-weather-updated]", formatUpdatedAt(weather.updatedAt));
    setText("[data-weather-recommendation]", weather.recommendation || getRecommendation(weather));
  };

  const readStoredWeather = () => {
    try {
      const raw = window.localStorage && window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return hasUsableWeatherData(parsed) ? normalizeWeather(parsed, { isCachedFallback: true }) : null;
    } catch (error) {
      debugWeather("warn", "Не удалось прочитать сохранённую погоду", error);
      return null;
    }
  };

  const storeWeather = (weather) => {
    if (!hasUsableWeatherData(weather) || weather.isFallback || weather.isStaticFallback || weather.isCachedFallback) return;
    try {
      if (window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(weather));
      }
    } catch (error) {
      debugWeather("warn", "Не удалось сохранить погоду", error);
    }
  };

  const applyFallback = (reason) => {
    debugWeather("warn", "Переход на fallback", reason);
    applyWeather(readStoredWeather() || normalizeWeather(staticFallbackWeather));
  };

  const createAbortController = () => (
    typeof AbortController === "function" ? new AbortController() : null
  );

  const fetchJson = async (url, signal) => {
    const response = await fetch(url, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`weather ${response.status}`);
    return response.json();
  };

  const getEndpointUrl = () => {
    const url = new URL(weatherEndpoint, window.location.origin);
    url.searchParams.set("v", dataVersion);
    url.searchParams.set("b", String(Math.floor(Date.now() / cacheBusterMs)));
    return url.toString();
  };

  const settle = (promise) => promise
    .then((value) => ({ status: "fulfilled", value }))
    .catch((reason) => ({ status: "rejected", reason }));

  const getWeatherFromEndpoint = async (signal) => {
    const weather = normalizeWeather(await fetchJson(getEndpointUrl(), signal), { source: "same-origin" });
    if (!hasUsableWeatherData(weather)) throw new Error("empty same-origin weather payload");
    return weather;
  };

  const getWeatherFromOpenMeteo = async (signal) => {
    const forecastParams = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      timezone: "Europe/Moscow",
      forecast_days: "1",
      wind_speed_unit: "ms"
    });
    const marineParams = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: "sea_surface_temperature,wave_height",
      timezone: "Europe/Moscow",
      forecast_days: "1"
    });

    const forecastPromise = fetchJson(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, signal);
    const marinePromise = fetchJson(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`, signal);
    const [forecastResult, marineResult] = await Promise.all([settle(forecastPromise), settle(marinePromise)]);

    if (forecastResult.status === "rejected" && marineResult.status === "rejected") {
      throw new Error("all weather sources unavailable");
    }

    const currentWeather = forecastResult.status === "fulfilled" ? forecastResult.value.current || {} : {};
    const currentMarine = marineResult.status === "fulfilled" ? marineResult.value.current || {} : {};
    const waveHeight = roundOrNull(currentMarine.wave_height);
    const weather = normalizeWeather({
      updatedAt: new Date().toISOString(),
      airTemperature: currentWeather.temperature_2m,
      weatherText: weatherCodes.get(currentWeather.weather_code) || "погодные условия уточняются",
      windSpeed: currentWeather.wind_speed_10m,
      windDirection: currentWeather.wind_direction_10m,
      windGust: currentWeather.wind_gusts_10m,
      seaTemperature: currentMarine.sea_surface_temperature,
      waveHeight,
      seaText: getSeaText(waveHeight),
      recommendation: getRecommendation({ windSpeed: currentWeather.wind_speed_10m, waveHeight }),
      isPartial: forecastResult.status === "rejected" || marineResult.status === "rejected",
      source: "open-meteo"
    });

    if (!hasUsableWeatherData(weather)) throw new Error("empty Open-Meteo weather payload");
    return weather;
  };

  const getWeather = async (signal) => {
    try {
      return await getWeatherFromEndpoint(signal);
    } catch (endpointError) {
      debugWeather("warn", "Same-origin endpoint недоступен, пробуем Open-Meteo", endpointError);
      return getWeatherFromOpenMeteo(signal);
    }
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get("weatherError") === "1") {
    applyFallback("forced by weatherError=1");
    return;
  }

  const controller = createAbortController();
  const timeout = controller ? window.setTimeout(() => controller.abort(), requestTimeoutMs) : null;

  getWeather(controller ? controller.signal : undefined)
    .then((weather) => {
      applyWeather(weather);
      storeWeather(weather);
    })
    .catch(applyFallback)
    .finally(() => {
      if (timeout) window.clearTimeout(timeout);
    });
})();
