const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const WEEKDAYS_SHORT = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MONTHS = [
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

// "Shanba, 31-oktabr"
export const formatUzDate = (date) =>
  `${WEEKDAYS[date.getDay()]}, ${date.getDate()}-${MONTHS[date.getMonth()]}`;

export const getShortWeekday = (date) => WEEKDAYS_SHORT[date.getDay()];

export const getDayOfYear = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((day - startOfYear) / (24 * 60 * 60 * 1000));
};

// 0 -> "bugun", 1 -> "ertaga", 3 -> "3 kundan keyin"
export const formatDaysLeft = (days) => {
  if (days === 0) return "bugun";
  if (days === 1) return "ertaga";

  return `${days} kundan keyin`;
};
