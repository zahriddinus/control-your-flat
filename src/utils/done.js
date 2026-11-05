import { supabase } from "../lib/supabese";
import { readCache, writeCache } from "./offline";

// "Bajardim" belgilari (SQL: duty_done, mark_task_done, unmark_task_done).
// Reyting shu kundan boshlab hisoblanadi: undan oldin belgilar bo'lmagan
export const DONE_TRACKING_START = "2026-11-06";

// Jadval hali yaratilmagan bo'lsa (SQL ishga tushirilmagan), funksiya shunchaki o'chadi
const MISSING_CODES = ["42P01", "PGRST205", "PGRST202"];

export const isDoneUnavailable = (error) => MISSING_CODES.includes(error?.code);

// Oraliqdagi belgilar: [{ day, task, user_id, done_at }].
// Jadval yo'q bo'lsa null, internet yo'q bo'lsa oxirgi nusxa qaytadi
export const fetchDone = async (from, to) => {
  const cacheKey = `done:${from}:${to}`;

  const { data, error } = await supabase
    .from("duty_done")
    .select("day, task, user_id, done_at")
    .gte("day", from)
    .lte("day", to);

  if (isDoneUnavailable(error)) return null;

  if (error) {
    const cached = readCache(cacheKey);

    if (cached) return cached;

    throw error;
  }

  writeCache(cacheKey, data);

  return data;
};

export const markDone = async (taskKey, userId) => {
  const { data, error } = await supabase.rpc("mark_task_done", {
    p_task: taskKey,
    p_user_id: userId,
  });

  if (error) throw error;

  return data;
};

export const unmarkDone = async (taskKey, userId) => {
  const { error } = await supabase.rpc("unmark_task_done", {
    p_task: taskKey,
    p_user_id: userId,
  });

  if (error) throw error;
};

export const findDone = (records, taskKey, userId) =>
  records?.find((record) => record.task === taskKey && record.user_id === userId) ?? null;
