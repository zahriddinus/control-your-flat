// Xonadon joylashuvi: Toshkent, Sergeli tumani
export const FLAT_LOCATION = {
  name: "Toshkent, Sergeli",
  latitude: 41.22,
  longitude: 69.22,
  isFlat: true,
};

// WMO ob-havo kodlari: https://open-meteo.com/en/docs
// type - WeatherIcon qaysi rasmni chizishi
const WEATHER_CODES = {
  0: { type: "clear", label: "Ochiq osmon" },
  1: { type: "partly", label: "Asosan ochiq" },
  2: { type: "partly", label: "Qisman bulutli" },
  3: { type: "cloudy", label: "Bulutli" },
  45: { type: "fog", label: "Tuman" },
  48: { type: "fog", label: "Qirovli tuman" },
  51: { type: "rain", label: "Mayda yomg'ir" },
  53: { type: "rain", label: "Mayda yomg'ir" },
  55: { type: "rain", label: "Kuchli mayda yomg'ir" },
  56: { type: "rain", label: "Muzlagan mayda yomg'ir" },
  57: { type: "rain", label: "Muzlagan mayda yomg'ir" },
  61: { type: "rain", label: "Yengil yomg'ir" },
  63: { type: "rain", label: "Yomg'ir" },
  65: { type: "rain", label: "Kuchli yomg'ir" },
  66: { type: "rain", label: "Muzlagan yomg'ir" },
  67: { type: "rain", label: "Muzlagan yomg'ir" },
  71: { type: "snow", label: "Yengil qor" },
  73: { type: "snow", label: "Qor" },
  75: { type: "snow", label: "Kuchli qor" },
  77: { type: "snow", label: "Qor donalari" },
  80: { type: "rain", label: "Jala" },
  81: { type: "rain", label: "Kuchli jala" },
  82: { type: "thunder", label: "Juda kuchli jala" },
  85: { type: "snow", label: "Qor yog'ishi" },
  86: { type: "snow", label: "Kuchli qor yog'ishi" },
  95: { type: "thunder", label: "Momaqaldiroq" },
  96: { type: "thunder", label: "Do'l bilan momaqaldiroq" },
  99: { type: "thunder", label: "Do'l bilan momaqaldiroq" },
};

export const getWeatherInfo = (code) =>
  WEATHER_CODES[code] ?? { type: "cloudy", label: "Noma'lum" };

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

// Ob-havoni navbatlar bilan bog'laydigan maslahatlar.
// Navbatga oid maslahatlar faqat uy ob-havosi ko'rsatilganda chiqadi
export const getWeatherTips = ({ weather, users, schedules, isFlat }) => {
  const today = getDailyWeather(weather, 0);
  const tomorrow = getDailyWeather(weather, 1);
  const tips = [];

  const getName = (schedule, key) =>
    users.find((user) => user.user_id === schedule?.[key]?.user_id)?.name?.trim();

  if (isFlat) {
    const rubbishToday = getName(schedules[0], "rubbish");
    const rubbishTomorrow = getName(schedules[1], "rubbish");

    if (rubbishToday && isWetDay(today)) {
      tips.push(`☔ Bugun yomg'ir ehtimoli bor. ${rubbishToday}, musorga soyabon bilan chiqing.`);
    }

    if (rubbishTomorrow && isWetDay(tomorrow)) {
      tips.push(
        `🌧️ Ertaga yomg'ir kutilmoqda. ${rubbishTomorrow}, musorni bugun kechqurun tashlab qo'ysangiz ham bo'ladi.`
      );
    }

    const cleaningIndex = [0, 1].find((index) => schedules[index]?.cleaning?.length > 0);

    if (cleaningIndex !== undefined) {
      const day = cleaningIndex === 0 ? today : tomorrow;
      const when = cleaningIndex === 0 ? "Bugun" : "Ertaga";

      if (isWetDay(day)) {
        tips.push(
          `🌂 ${when} generalniy uborka, lekin yomg'ir kutilmoqda. Gilamlarni tashqariga chiqarmang.`
        );
      } else if (!isSnowy(day.code) && day.max >= 12) {
        tips.push(
          `☀️ ${when} generalniy uborka va havo yaxshi (${day.max}°). Derazalarni ochib, uyni shamollating.`
        );
      }
    }
  }

  const temperature = Math.round(weather.current.temperature_2m);

  if (temperature <= 0) {
    tips.push(`🥶 Hozir ${temperature}°. Tashqariga chiqishda issiq kiyining.`);
  } else if (today.max >= 35) {
    tips.push(`🥵 Bugun ${today.max}° gacha isiydi. Ko'proq suv iching.`);
  }

  if (isSnowy(today.code)) tips.push("❄️ Bugun qor yog'adi. Yo'lda ehtiyot bo'ling.");
  if (weather.current.wind_speed_10m >= 40)
    tips.push("💨 Kuchli shamol. Derazalarni yopiq tuting.");

  return tips.slice(0, 3);
};
