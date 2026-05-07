(() => {
  const endpoint = "/api/public/weather/arkhipo-osipovka";
  const fallbackMessage = "Сейчас не удалось обновить погоду. Уточните условия перед выходом в море.";

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const isFiniteNumber = (value) => (
    value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
  );

  const formatTemperature = (value) => {
    if (!isFiniteNumber(value)) return "нет данных";
    const rounded = Math.round(Number(value));
    return `${rounded > 0 ? "+" : ""}${rounded}°C`;
  };

  const formatWind = (value) => (
    isFiniteNumber(value) ? `${Math.round(Number(value))} м/с` : "нет данных"
  );

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
    setText(
      "[data-weather-status]",
      weather.isFallback ? fallbackMessage : "Свежая туристическая сводка для выбора отдыха сегодня."
    );
    setText("[data-weather-updated]", weather.isFallback ? "" : formatUpdatedAt(weather.updatedAt));
    setText("[data-weather-recommendation]", weather.recommendation || fallbackMessage);
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const params = new URLSearchParams(window.location.search);
  const url = params.get("weatherError") === "1" ? `${endpoint}?forceError=1` : endpoint;

  fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("weather");
      return response.json();
    })
    .then(applyWeather)
    .catch(applyFallback)
    .finally(() => window.clearTimeout(timeout));
})();
