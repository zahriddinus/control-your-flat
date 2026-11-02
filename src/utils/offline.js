// Oxirgi muvaffaqiyatli ma'lumotlarning nusxasi brauzerda saqlanadi.
// Internet bo'lmasa, sahifalar shu nusxani ko'rsatadi (OfflineBanner ogohlantiradi)

const PREFIX = "cyf-cache:";

export const readCache = (key) => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeCache = (key, value) => {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Xotira to'lgan yoki yopiq bo'lsa, shunchaki saqlanmaydi
  }
};

// Supabase so'rovi: muvaffaqiyatli bo'lsa nusxa saqlanadi, xato bo'lsa nusxa qaytariladi.
// query: () => supabase.from(...)... ({ data, error } qaytaradi)
export const queryWithCache = async (key, query) => {
  const { data, error } = await query();

  if (!error) {
    writeCache(key, data);
    return { data, error: null };
  }

  const cached = readCache(key);

  return cached ? { data: cached, error: null, fromCache: true } : { data: null, error };
};
