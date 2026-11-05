import "./emptyState.scss";
import { useI18n } from "../../i18n";

// Rasmlar 120x120, ranglar CSS'da (--es-main, --es-soft) beriladi
const ILLUSTRATIONS = {
  // Bo'sh uy: eshik ochiq, ichkarida hech kim yo'q
  noUsers: (
    <>
      <ellipse className="es-shadow" cx="60" cy="104" rx="38" ry="6" />
      <path className="es-soft" d="M24 54 60 24l36 30v44a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4z" />
      <path className="es-line" d="M18 58 60 22l42 36M24 54v44a4 4 0 0 0 4 4h64a4 4 0 0 0 4-4V54" />
      <rect className="es-door" x="50" y="70" width="20" height="32" rx="3" />
      <circle className="es-main-fill" cx="65" cy="87" r="1.8" />
      <circle className="es-plus" cx="92" cy="34" r="12" />
      <path className="es-plus-sign" d="M92 28v12M86 34h12" />
    </>
  ),
  // Lupa ichida savol belgisi
  notFound: (
    <>
      <ellipse className="es-shadow" cx="60" cy="104" rx="34" ry="6" />
      <circle className="es-soft" cx="52" cy="50" r="30" />
      <circle className="es-line" cx="52" cy="50" r="30" />
      <path className="es-handle" d="m74 72 20 20" />
      <path className="es-line" d="M44 42a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v2" />
      <circle className="es-main-fill" cx="52" cy="63" r="2.4" />
      <circle className="es-sparkle" cx="92" cy="26" r="3" />
      <circle className="es-sparkle es-sparkle--late" cx="20" cy="84" r="2.4" />
    </>
  ),
  // Bulut va undan chiqqan ulanmagan vilka
  error: (
    <>
      <ellipse className="es-shadow" cx="60" cy="104" rx="36" ry="6" />
      <path
        className="es-soft es-line"
        d="M34 66h50a16 16 0 0 0 2-31.9A22 22 0 0 0 44.6 30 18 18 0 0 0 34 66z"
      />
      <path className="es-line" d="M48 66v10a6 6 0 0 0 6 6h0M72 66v6" />
      <rect className="es-plug" x="66" y="72" width="12" height="10" rx="2" />
      <path className="es-line" d="M69 82v6M75 82v6" />
      <path className="es-zap" d="M58 40 52 50h8l-6 10" />
    </>
  ),
};

// variant: "noUsers", "notFound" yoki "error". action - pastdagi tugma (ixtiyoriy)
export const EmptyState = ({ variant = "noUsers", title, text, action, compact = false }) => {
  const { t } = useI18n();

  return (
    <div
      className={`empty-state empty-state--${variant} ${compact ? "empty-state--compact" : ""}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <svg
        className="empty-state__art"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        {ILLUSTRATIONS[variant]}
      </svg>

      <h2 className="empty-state__title">{title ?? t(`empty.${variant}`)}</h2>

      {text && <p className="empty-state__text">{text}</p>}

      {action}
    </div>
  );
};

// Xato bo'lganda: sahifani qayta yuklaydigan tugma bilan
export const ErrorState = ({ text, compact }) => {
  const { t } = useI18n();

  return (
    <EmptyState
      variant="error"
      text={text}
      compact={compact}
      action={
        <button
          type="button"
          className="btn btn-primary btn-sm px-4"
          onClick={() => window.location.reload()}
        >
          {t("common.retry")}
        </button>
      }
    />
  );
};
