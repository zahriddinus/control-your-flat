import { supabase } from "../lib/supabese";

// Faollik lentasi (SQL: activity). "Bajardim", qo'shilish va almashish so'rovlarini baza o'zi yozadi;
// boshqaruvchining amallari (tartib, vazifa, qoida) saytdan shu funksiya bilan yoziladi.
// Lenta ikkinchi darajali: yozib bo'lmasa, asosiy amal baribir bajarilgan bo'ladi
export const logActivity = async (flatId, actorId, kind, task = null, meta = {}) => {
  const { error } = await supabase
    .from("activity")
    .insert({ flat_id: flatId, actor_id: actorId, kind, task, meta });

  if (error) console.error("Activity error:", error);
};

export const fetchActivity = async (flatId, limit = 15) => {
  const { data, error } = await supabase
    .from("activity")
    .select("id, kind, actor_id, target_id, task, meta, created_at")
    .eq("flat_id", flatId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
};

// "5 daqiqa oldin", "kecha" - til bo'yicha
export const formatRelativeTime = (value, lang) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }

  return formatter.format(0, "minute");
};
