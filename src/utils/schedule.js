import { supabase } from "../lib/supabese";
import { formatDate } from "./date";
import { readCache, writeCache } from "./offline";

// Bazadan har bir vazifa ro'yxat bo'lib keladi: [{ user_id, name, last_name }].
// Eski nusxalarda bitta odam obyekt bo'lib saqlangan bo'lishi mumkin
export const getAssigned = (schedule, taskKey) => {
  const value = schedule?.[taskKey];

  if (Array.isArray(value)) return value;

  return value ? [value] : [];
};

export const makeTask = (key, orderColumn) => ({
  key,
  orderColumn,
  isAssigned: (schedule, userId) =>
    getAssigned(schedule, key).some((assigned) => assigned.user_id === userId),
});

// Har bir vazifa va u qaysi tartib ustuni bo'yicha aylanadi. Uyda qaysilari yoqilgani - useFlat().tasks.
// Nomlari tarjimada: t(`tasks.${task.key}.title`) va t(`tasks.${task.key}.label`)
export const TASKS = [
  makeTask("duty", "duty_order"),
  makeTask("rubbish", "rubbish_order"),
  makeTask("cleaning", "cleaning_order"),
];

// Userlarni berilgan vazifa tartibi bo'yicha saralaydi (bo'sh qiymatlar oxirida)
export const sortUsersByOrder = (users, orderColumn) =>
  [...users].sort(
    (a, b) =>
      (a[orderColumn] ?? Infinity) - (b[orderColumn] ?? Infinity) ||
      (a.duty_order ?? Infinity) - (b.duty_order ?? Infinity)
  );

// Uyning o'z vazifalari tartibi (task_orders) userlarga "order:<kalit>" maydoni bo'lib qo'shiladi,
// shunda o'rnatilgan vazifalar (duty_order va h.k.) bilan bir xil ishlatiladi
export const fetchTaskOrders = async (flatId) => {
  const { data, error } = await supabase
    .from("task_orders")
    .select("task, user_id, position")
    .eq("flat_id", flatId);

  if (error) throw error;

  return data;
};

export const attachTaskOrders = (users, rows) =>
  users.map((user) => ({
    ...user,
    ...Object.fromEntries(
      rows
        .filter((row) => row.user_id === user.user_id)
        .map((row) => [`order:${row.task}`, row.position])
    ),
  }));

const getAssignedUsers = (users, task, schedule) =>
  users.filter((user) => task.isAssigned(schedule, user.user_id));

// "Eldor, Odilbek". Bazadagi ismlar oxirida bo'sh joy bo'lishi mumkin, shuning uchun trim
export const getAssignedNames = (users, task, schedule) =>
  getAssignedUsers(users, task, schedule)
    .map((user) => user.name.trim())
    .join(", ");

// Kunlar nusxasi { "2026-11-02": {...} }: internet bo'lmasa shundan ko'rsatiladi
const getCacheKey = (flatId) => `schedules:${flatId}`;
const MAX_CACHED_DAYS = 120;

const cacheSchedules = (flatId, entries) => {
  const cache = readCache(getCacheKey(flatId)) ?? {};

  entries.forEach(([date, schedule]) => {
    cache[date] = schedule;
  });

  // Eng eski kunlar o'chiriladi, nusxa cheksiz o'smasin
  const dates = Object.keys(cache).sort();

  dates.slice(0, Math.max(0, dates.length - MAX_CACHED_DAYS)).forEach((date) => {
    delete cache[date];
  });

  writeCache(getCacheKey(flatId), cache);
};

const RANGE_LIMIT = 62;

// Bitta so'rov bilan butun oraliq (SQL: get_duty_schedule_range, ko'pi bilan 62 kun)
const fetchRange = async (flatId, dateStrings) => {
  const { data, error } = await supabase.rpc("get_duty_schedule_range", {
    p_flat: flatId,
    start_date: dateStrings[0],
    end_date: dateStrings[dateStrings.length - 1],
  });

  if (error) throw new Error(`Schedule range error: ${error.message}`);

  const byDate = new Map(data.map((schedule) => [schedule.date, schedule]));

  return dateStrings.map((date) => byDate.get(date) ?? null);
};

// Ketma-ket sanalar uchun navbatlar, sanalar bilan bir xil tartibda.
// Internet bo'lmasa va hamma kunlar nusxada bo'lsa, nusxa qaytariladi
export const fetchSchedules = async (flatId, dates) => {
  const dateStrings = dates.map(formatDate);

  if (!flatId || !dateStrings.length) return [];

  try {
    // Server bir so'rovda ko'pi bilan 62 kun beradi, uzunroq oraliq bo'laklarga bo'linadi
    const chunks = [];

    for (let index = 0; index < dateStrings.length; index += RANGE_LIMIT) {
      chunks.push(dateStrings.slice(index, index + RANGE_LIMIT));
    }

    const schedules = (await Promise.all(chunks.map((chunk) => fetchRange(flatId, chunk)))).flat();

    cacheSchedules(
      flatId,
      dateStrings.map((date, index) => [date, schedules[index]])
    );

    return schedules;
  } catch (error) {
    const cache = readCache(getCacheKey(flatId)) ?? {};

    if (dateStrings.every((date) => date in cache)) {
      return dateStrings.map((date) => cache[date]);
    }

    throw error;
  }
};
