(() => {
  const coordinates = { latitude: 44.3719, longitude: 38.5297 };
  const fallbackMessage = "Сейчас не удалось обновить погоду. Уточните условия перед выходом в море.";
  const requestTimeoutMs = 8000;

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

  const formatTemperature = (value) => {
    if (!isFiniteNumber(value)) return "нет данных";
    const rounded = Math.round(Number(value));
    return `${rounded > 0 ? "+" : ""}${rounded}°C`;
  };

  const formatWind = (value) => (
    isFiniteNumber(value) ? `${Math.round(Number(value))} м/с` : "нет данных"
  );

  const getSeaText = (waveHeight) => {
    if (!isFiniteNumber(waveHeight)) return "нет данных сейчас";
    const height = Number(waveHeight);
    if (height < 0.25) return "Спокойно";
    if (height < 0.6) return "Небольшая волна";
    if (height < 1.0) return "Есть волна";
    return "Сильное волнение";
  };

  const formatWave = (value, seaText = "") => {
    if (!isFiniteNumber(value)) return "нет данных";
    const height = Number(value);
    const formattedHeight = height.toFixed(1).replace(".", ",");
    const state = seaText && seaText !== "нет данных сейчас" ? seaText.toLowerCase() : (height < 0.6 ? "спокойно" : "есть волна");
    return `${formattedHeight} м / ${state}`;
  };

  const formatUpdatedAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `обновлено: ${new Intl.DateTimeFormat("ru-RU", {
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
    return parts.length ? parts.join(", ") : "без данных о порывах";
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

  const applyFallback = () => {
    setText("[data-weather-air]", "нет данных");
    setText("[data-weather-sea]", "нет данных");
    setText("[data-weather-wind]", "нет данных");
    setText("[data-weather-wave]", "нет данных");
    setText("[data-weather-text]", "нет данных сейчас");
    setText("[data-weather-sea-text]", "нет данных сейчас");
    setText("[data-weather-wind-detail]", "уточните перед выходом");
    setText("[data-weather-wave-detail]", "уточните перед выходом");
    setText("[data-weather-status]", fallbackMessage);
    setText("[data-weather-updated]", "");
    setText("[data-weather-recommendation]", fallbackMessage);
  };

  const applyWeather = (weather) => {
    setText("[data-weather-air]", formatTemperature(weather.airTemperature));
    setText("[data-weather-sea]", formatTemperature(weather.seaTemperature));
    setText("[data-weather-wind]", formatWind(weather.windSpeed));
    setText("[data-weather-wave]", formatWave(weather.waveHeight, weather.seaText));
    setText("[data-weather-text]", weather.weatherText || "нет данных сейчас");
    setText("[data-weather-sea-text]", weather.seaText || "нет данных сейчас");
    setText("[data-weather-wind-detail]", formatWindDetail(weather));
    setText("[data-weather-wave-detail]", weather.seaText || "нет данных сейчас");
    setText("[data-weather-status]", "Свежая туристическая сводка для выбора отдыха сегодня.");
    setText("[data-weather-updated]", formatUpdatedAt(weather.updatedAt));
    setText("[data-weather-recommendation]", weather.recommendation || fallbackMessage);
  };

  const fetchJson = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("weather");
    return response.json();
  };

  const getWeather = async (signal) => {
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

    const [forecastResult, marineResult] = await Promise.allSettled([
      fetchJson(`https://api.open-meteo.com/v1/forecast?${forecastParams}`, signal),
      fetchJson(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`, signal)
    ]);

    if (forecastResult.status === "rejected" && marineResult.status === "rejected") {
      throw new Error("weather");
    }

    const currentWeather = forecastResult.status === "fulfilled" ? forecastResult.value.current || {} : {};
    const currentMarine = marineResult.status === "fulfilled" ? marineResult.value.current || {} : {};
    const waveHeight = roundOrNull(currentMarine.wave_height);
    const seaText = getSeaText(waveHeight);

    return {
      updatedAt: new Date().toISOString(),
      airTemperature: roundOrNull(currentWeather.temperature_2m),
      weatherText: weatherCodes.get(currentWeather.weather_code) || "нет данных сейчас",
      windSpeed: roundOrNull(currentWeather.wind_speed_10m),
      windDirection: roundOrNull(currentWeather.wind_direction_10m),
      windGust: roundOrNull(currentWeather.wind_gusts_10m),
      seaTemperature: roundOrNull(currentMarine.sea_surface_temperature),
      waveHeight,
      seaText,
      recommendation: getRecommendation({
        windSpeed: roundOrNull(currentWeather.wind_speed_10m),
        waveHeight
      })
    };
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get("weatherError") === "1") {
    applyFallback();
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  getWeather(controller.signal)
    .then(applyWeather)
    .catch(applyFallback)
    .finally(() => window.clearTimeout(timeout));
})();
