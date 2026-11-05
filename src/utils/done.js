import { supabase } from "../lib/supabese";
import { readCache, writeCache } from "./offline";

// "Bajardim" belgilari (SQL: duty_done, mark_task_done, unmark_task_done).
// Reyting shu kundan boshlab hisoblanadi: undan oldin belgilar bo'lmagan
export const DONE_TRACKING_START = "2026-11-06";

// Uyning oraliqdagi belgilari: [{ day, task, user_id, done_at }].
// Internet yo'q bo'lsa oxirgi nusxa qaytadi
export const fetchDone = async (flatId, from, to) => {
  const cacheKey = `done:${flatId}:${from}:${to}`;

  const { data, error } = await supabase
    .from("duty_done")
    .select("day, task, user_id, done_at")
    .eq("flat_id", flatId)
    .gte("day", from)
    .lte("day", to);

  if (error) {
    const cached = readCache(cacheKey);

    if (cached) return cached;

    throw error;
  }

  writeCache(cacheKey, data);

  return data;
};

// userId bo'sh bo'lsa - o'zim. Boshqa xonadosh uchun faqat uy egasi belgilay oladi
export const markDone = async (flatId, taskKey, userId = null) => {
  const { data, error } = await supabase.rpc("mark_task_done", {
    p_flat: flatId,
    p_task: taskKey,
    p_user_id: userId,
  });

  if (error) throw error;

  return data;
};

export const unmarkDone = async (flatId, taskKey, userId = null) => {
  const { error } = await supabase.rpc("unmark_task_done", {
    p_flat: flatId,
    p_task: taskKey,
    p_user_id: userId,
  });

  if (error) throw error;
};

export const findDone = (records, taskKey, userId) =>
  records?.find((record) => record.task === taskKey && record.user_id === userId) ?? null;
