import "./themeToggle.scss";
import { useTheme } from "../../hooks/useTheme";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";

// Nomlari tarjimada: theme.light, theme.dark, theme.auto
const OPTIONS = [
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
  { value: "auto", icon: "auto" },
];

export const ThemeToggle = () => {
  const { t } = useI18n();
  const [theme, setTheme] = useTheme();

  const activeIndex = OPTIONS.findIndex((option) => option.value === theme);

  return (
    <div className="theme-toggle" role="radiogroup" aria-label={t("theme.label")}>
      {/* Tanlangan variant ostida suriladigan gradient fon */}
      <span
        className="theme-toggle__thumb"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        aria-hidden="true"
      ></span>

      {OPTIONS.map((option) => {
        const isActive = option.value === theme;
        const label = t(`theme.${option.value}`);

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={option.value === "auto" ? t("theme.autoHint") : label}
            className={`theme-toggle__btn ${isActive ? "active" : ""}`}
            onClick={() => setTheme(option.value)}
          >
            <AppIcon name={option.icon} />
            <span className="theme-toggle__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
