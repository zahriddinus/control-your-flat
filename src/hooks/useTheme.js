import { useCallback, useEffect, useState } from "react";

// "auto" - soatga qarab: kunduzi yorug', kechasi qorong'i
export const THEMES = ["light", "dark", "auto"];

// Avto rejimda yorug' mavzu shu soatlar orasida (06:00-17:59).
// public/index.html'dagi skriptda ham shu raqamlar bor
export const LIGHT_FROM_HOUR = 6;
export const LIGHT_UNTIL_HOUR = 18;

const STORAGE_KEY = "theme";

// Avto rejim har daqiqada soatni tekshiradi
const AUTO_CHECK_INTERVAL = 60 * 1000;

const readTheme = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    return THEMES.includes(saved) ? saved : "auto";
  } catch {
    return "auto";
  }
};

const isNightTime = (date = new Date()) => {
  const hour = date.getHours();

  return hour < LIGHT_FROM_HOUR || hour >= LIGHT_UNTIL_HOUR;
};

// Bootstrap 5.3 dark mode'i <html data-bs-theme="dark"> orqali ishlaydi.
// Sahifa yuklanishidagi birinchi qo'llash public/index.html'dagi skriptda
const applyTheme = (theme) => {
  const isDark = theme === "dark" || (theme === "auto" && isNightTime());

  document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");

  // Telefon brauzerining yuqori paneli rangi
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#1b1f24" : "#ffffff");
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== "auto") return;

    // Soat 06:00 yoki 18:00 ga yetganda sahifa ochiq tursa ham mavzu almashadi.
    // Kompyuter uyqudan uyg'onganda ham darhol tekshiramiz
    const refresh = () => applyTheme("auto");
    const timer = setInterval(refresh, AUTO_CHECK_INTERVAL);

    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Saqlab bo'lmasa, tanlov faqat shu sahifada qoladi
    }
  }, []);

  return [theme, setTheme];
};
