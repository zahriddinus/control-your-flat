import { supabase } from "../lib/supabese";
import { formatDate } from "./date";
import { readCache, writeCache } from "./offline";

// Har bir vazifa: user o'sha kuni shu vazifadami va u qaysi tartib ustuni bo'yicha aylanadi.
// Nomlari tarjimada: t(`tasks.${task.key}.title`) va t(`tasks.${task.key}.label`)
export const TASKS = [
  {
    key: "duty",
    orderColumn: "duty_order",
    isAssigned: (schedule, userId) => schedule?.duty?.user_id === userId,
  },
  {
    key: "rubbish",
    orderColumn: "rubbish_order",
    isAssigned: (schedule, userId) => schedule?.rubbish?.user_id === userId,
  },
  {
    key: "cleaning",
    orderColumn: "cleaning_order",
    isAssigned: (schedule, userId) =>
      schedule?.cleaning?.some((cleaningUser) => cleaningUser.user_id === userId) ?? false,
  },
];

// Userlarni berilgan vazifa tartibi bo'yicha saralaydi (bo'sh qiymatlar oxirida)
export const sortUsersByOrder = (users, orderColumn) =>
  [...users].sort(
    (a, b) =>
      (a[orderColumn] ?? Infinity) - (b[orderColumn] ?? Infinity) ||
      (a.duty_order ?? Infinity) - (b.duty_order ?? Infinity)
  );

export const getAssignedUsers = (users, task, schedule) =>
  users.filter((user) => task.isAssigned(schedule, user.user_id));

// "Eldor, Odilbek". Bazadagi ismlar oxirida bo'sh joy bo'lishi mumkin, shuning uchun trim
export const getAssignedNames = (users, task, schedule) =>
  getAssignedUsers(users, task, schedule)
    .map((user) => user.name.trim())
    .join(", ");

// Kunlar nusxasi { "2026-11-02": {...} }: internet bo'lmasa shundan ko'rsatiladi
const SCHEDULES_CACHE_KEY = "schedules";
const MAX_CACHED_DAYS = 120;

const cacheSchedules = (entries) => {
  const cache = readCache(SCHEDULES_CACHE_KEY) ?? {};

  entries.forEach(([date, schedule]) => {
    cache[date] = schedule;
  });

  // Eng eski kunlar o'chiriladi, nusxa cheksiz o'smasin
  const dates = Object.keys(cache).sort();

  dates.slice(0, Math.max(0, dates.length - MAX_CACHED_DAYS)).forEach((date) => {
    delete cache[date];
  });

  writeCache(SCHEDULES_CACHE_KEY, cache);
};

// Bitta so'rov bilan butun oraliq (SQL: get_duty_schedule_range).
// Funksiya bazada hali bo'lmasa (PGRST202), null qaytadi va har kun alohida so'raladi
const fetchRange = async (dateStrings) => {
  const { data, error } = await supabase.rpc("get_duty_schedule_range", {
    start_date: dateStrings[0],
    end_date: dateStrings[dateStrings.length - 1],
  });

  if (error?.code === "PGRST202") return null;
  if (error) throw new Error(`Schedule range error: ${error.message}`);

  const byDate = new Map(data.map((schedule) => [schedule.date, schedule]));

  return dateStrings.map((date) => byDate.get(date) ?? null);
};

const fetchOneByOne = (dateStrings) =>
  Promise.all(
    dateStrings.map(async (dateString) => {
      const { data, error } = await supabase.rpc("get_duty_schedule", {
        target_date: dateString,
      });

      if (error) throw new Error(`Schedule error ${dateString}: ${error.message}`);

      return data;
    })
  );

// Ketma-ket sanalar uchun navbatlar, sanalar bilan bir xil tartibda.
// Internet bo'lmasa va hamma kunlar nusxada bo'lsa, nusxa qaytariladi
export const fetchSchedules = async (dates) => {
  const dateStrings = dates.map(formatDate);

  if (!dateStrings.length) return [];

  try {
    const schedules = (await fetchRange(dateStrings)) ?? (await fetchOneByOne(dateStrings));

    cacheSchedules(dateStrings.map((date, index) => [date, schedules[index]]));

    return schedules;
  } catch (error) {
    const cache = readCache(SCHEDULES_CACHE_KEY) ?? {};

    if (dateStrings.every((date) => date in cache)) {
      return dateStrings.map((date) => cache[date]);
    }

    throw error;
  }
};
