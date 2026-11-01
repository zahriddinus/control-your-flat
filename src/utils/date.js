// Sanalar tanlangan tilda (lang: "uz" | "ru" | "en").
// Rus va ingliz tillari uchun brauzerning Intl formatlari ishlatiladi,
// o'zbek tili uchun esa o'z ro'yxatlarimiz (Intl'da o'zbekcha har doim ham bor emas)

const UZ_WEEKDAYS = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];
const UZ_WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

// Kalendar varag'i uchun: "NOY", "НОЯ", "NOV"
const MONTHS_SHORT = {
  uz: ["YAN", "FEV", "MAR", "APR", "MAY", "IYN", "IYL", "AVG", "SEN", "OKT", "NOY", "DEK"],
  ru: ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"],
  en: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
};

const LOCALES = { ru: "ru-RU", en: "en-US" };

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const formatIntl = (date, lang, options) =>
  capitalize(new Intl.DateTimeFormat(LOCALES[lang], options).format(date));

// 2026-10-31 ko'rinishida
export const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

// "2026-10-31" -> mahalliy vaqt bo'yicha Date
export const parseDate = (dateString) => {
  const [y, m, d] = dateString.split("-").map(Number);

  return new Date(y, m - 1, d);
};

export const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// "Shanba, 31-oktabr" / "Суббота, 31 октября" / "Saturday, October 31"
export const formatLongDate = (date, lang) => {
  if (lang === "uz") {
    return `${UZ_WEEKDAYS[date.getDay()]}, ${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`;
  }

  return formatIntl(date, lang, { weekday: "long", day: "numeric", month: "long" });
};

// "Shan" / "Сб" / "Sat"
export const getShortWeekday = (date, lang) =>
  lang === "uz" ? UZ_WEEKDAYS_SHORT[date.getDay()] : formatIntl(date, lang, { weekday: "short" });

// "Noyabr" / "Ноябрь" / "November"
export const getMonthName = (date, lang) =>
  lang === "uz"
    ? capitalize(UZ_MONTHS[date.getMonth()])
    : formatIntl(date, lang, { month: "long" });

export const getShortMonth = (date, lang) =>
  (MONTHS_SHORT[lang] ?? MONTHS_SHORT.uz)[date.getMonth()];

export const getDayOfYear = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((day - startOfYear) / (24 * 60 * 60 * 1000));
};

// 0 -> "bugun", 1 -> "ertaga", 3 -> "3 kundan keyin". t - useI18n()'dan
export const formatDaysLeft = (days, t) => {
  if (days === 0) return t("time.today");
  if (days === 1) return t("time.tomorrow");

  return t("time.inDays", { count: days });
};
