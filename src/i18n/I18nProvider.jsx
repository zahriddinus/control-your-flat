import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { uz } from "./uz";
import { ru } from "./ru";
import { en } from "./en";

export const LANGUAGES = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const DICTIONARIES = { uz, ru, en };
const DEFAULT_LANGUAGE = "uz";
const STORAGE_KEY = "language";

const readLanguage = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    return DICTIONARIES[saved] ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

// "home.hero.label" -> dictionary.home.hero.label
const getValue = (dictionary, key) =>
  key.split(".").reduce((value, part) => value?.[part], dictionary);

// Ko'plik shakllari: { one: "1 день", few: "2 дня", many: "5 дней", other: "..." }
const pickPlural = (value, lang, count) => {
  if (typeof value !== "object" || typeof count !== "number") return value;

  const rule = new Intl.PluralRules(lang).select(count);

  return value[rule] ?? value.other;
};

// "{name} qo'shildi" + { name: "Eldor" } -> "Eldor qo'shildi"
const interpolate = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match).toString());

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLanguage);

  // Topilmasa o'zbekcha, u ham bo'lmasa kalitning o'zi qaytadi
  const t = useCallback(
    (key, vars = {}) => {
      const value =
        getValue(DICTIONARIES[lang], key) ?? getValue(DICTIONARIES[DEFAULT_LANGUAGE], key);

      if (value === undefined) return key;

      const text = pickPlural(value, lang, vars.count);

      return typeof text === "string" ? interpolate(text, vars) : text;
    },
    [lang]
  );

  const setLang = useCallback((nextLang) => {
    setLangState(nextLang);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Saqlab bo'lmasa, tanlov faqat shu sahifada qoladi
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t("app.title");
  }, [lang, t]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// const { t, lang, setLang } = useI18n();
export const useI18n = () => useContext(I18nContext);
