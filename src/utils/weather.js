// Xonadon joylashuvi: Toshkent, Sergeli tumani. Nomi tarjimada: weather.flatName
export const FLAT_LOCATION = {
  latitude: 41.22,
  longitude: 69.22,
  isFlat: true,
};

// WMO ob-havo kodlari: https://open-meteo.com/en/docs
// type - WeatherIcon qaysi rasmni chizishi. Nomlari tarjimada: weather.codes.<kod>
const WEATHER_TYPES = {
  0: "clear",
  1: "partly",
  2: "partly",
  3: "cloudy",
  45: "fog",
  48: "fog",
  51: "rain",
  53: "rain",
  55: "rain",
  56: "rain",
  57: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "thunder",
  85: "snow",
  86: "snow",
  95: "thunder",
  96: "thunder",
  99: "thunder",
};

export const getWeatherInfo = (code) =>
  code in WEATHER_TYPES
    ? { type: WEATHER_TYPES[code], labelKey: `weather.codes.${code}` }
    : { type: "cloudy", labelKey: "weather.unknown" };

const isRainy = (code) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
const isSnowy = (code) => (code >= 71 && code <= 77) || code === 85 || code === 86;

export const fetchWeather = async ({ latitude, longitude, isFlat }) => {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "2",
    // Uy uchun Toshkent vaqti, boshqa joy uchun o'sha joyning vaqti
    timezone: isFlat ? "Asia/Tashkent" : "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) {
    throw new Error(`Weather error: ${response.status}`);
  }

  return response.json();
};

// Bugun (0) yoki ertaga (1) uchun kunlik ma'lumot
export const getDailyWeather = (weather, index) => ({
  code: weather.daily.weather_code[index],
  max: Math.round(weather.daily.temperature_2m_max[index]),
  min: Math.round(weather.daily.temperature_2m_min[index]),
  rain: weather.daily.precipitation_probability_max[index],
});

const isWetDay = (day) => isRainy(day.code) || (day.rain ?? 0) >= 50;

// Ob-havoni navbatlar bilan bog'laydigan maslahatlar (t - useI18n()'dan).
// Navbatga oid maslahatlar faqat uy ob-havosi ko'rsatilganda chiqadi
export const getWeatherTips = ({ weather, users, schedules, isFlat, t }) => {
  const today = getDailyWeather(weather, 0);
  const tomorrow = getDailyWeather(weather, 1);
  const tips = [];

  const getName = (schedule, key) =>
    users.find((user) => user.user_id === schedule?.[key]?.user_id)?.name?.trim();

  if (isFlat) {
    const rubbishToday = getName(schedules[0], "rubbish");
    const rubbishTomorrow = getName(schedules[1], "rubbish");

    if (rubbishToday && isWetDay(today)) {
      tips.push(t("weather.tips.rubbishTodayRain", { name: rubbishToday }));
    }

    if (rubbishTomorrow && isWetDay(tomorrow)) {
      tips.push(t("weather.tips.rubbishTomorrowRain", { name: rubbishTomorrow }));
    }

    const cleaningIndex = [0, 1].find((index) => schedules[index]?.cleaning?.length > 0);

    if (cleaningIndex !== undefined) {
      const day = cleaningIndex === 0 ? today : tomorrow;
      const when = cleaningIndex === 0 ? "Today" : "Tomorrow";

      if (isWetDay(day)) {
        tips.push(t(`weather.tips.cleaningRain${when}`));
      } else if (!isSnowy(day.code) && day.max >= 12) {
        tips.push(t(`weather.tips.cleaningGood${when}`, { temp: day.max }));
      }
    }
  }

  const temperature = Math.round(weather.current.temperature_2m);

  if (temperature <= 0) {
    tips.push(t("weather.tips.cold", { temp: temperature }));
  } else if (today.max >= 35) {
    tips.push(t("weather.tips.hot", { temp: today.max }));
  }

  if (isSnowy(today.code)) tips.push(t("weather.tips.snow"));
  if (weather.current.wind_speed_10m >= 40) tips.push(t("weather.tips.wind"));

  return tips.slice(0, 3);
};
