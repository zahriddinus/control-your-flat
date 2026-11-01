import "./languageSwitcher.scss";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";

export const LanguageSwitcher = () => {
  const { lang, setLang, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const switcherRef = useRef(null);

  // Tashqariga bosilganda yoki Escape'da yopiladi
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (evt) => {
      if (!switcherRef.current?.contains(evt.target)) setIsOpen(false);
    };

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(code) {
    setLang(code);
    setIsOpen(false);
  }

  return (
    <div className="lang-switcher" ref={switcherRef}>
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("header.language")}
        title={t("header.language")}
      >
        <AppIcon name="globe" />
        <span>{lang.toUpperCase()}</span>
        <AppIcon name="chevron" className={`lang-switcher__caret ${isOpen ? "open" : ""}`} />
      </button>

      <ul className={`lang-switcher__menu dropdown-menu ${isOpen ? "show" : ""}`}>
        {LANGUAGES.map((language) => {
          const isActive = language.code === lang;

          return (
            <li key={language.code}>
              <button
                type="button"
                lang={language.code}
                className={`dropdown-item d-flex align-items-center justify-content-between gap-3 ${
                  isActive ? "active" : ""
                }`}
                onClick={() => handleSelect(language.code)}
              >
                <span>
                  <span className="lang-switcher__code">{language.code.toUpperCase()}</span>
                  {language.label}
                </span>

                {isActive && <AppIcon name="check" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
