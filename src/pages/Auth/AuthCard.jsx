import "./auth.scss";
import { useState } from "react";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";

// Kirish sahifalari uchun umumiy kartochka: gradient sarlavha, xato bo'lsa silkinadi
export const AuthCard = ({ icon = "lock", title, subtitle, error, shakeKey, children, footer }) => {
  const { t } = useI18n();
  const [shakingKey, setShakingKey] = useState(null);

  // Har yangi xatoda (shakeKey o'zgarganda) bir marta silkinadi
  const shaking = shakeKey && shakeKey !== shakingKey;

  return (
    <div className="auth container py-4 py-md-5">
      <div
        className={`auth__card card border-0 shadow ${shaking ? "auth__card--shake" : ""}`}
        onAnimationEnd={() => setShakingKey(shakeKey)}
      >
        <div className="auth__header text-start">
          <span className="auth__badge" aria-hidden="true">
            <AppIcon name={icon} />
          </span>

          <div>
            <h1 className="auth__title">{title}</h1>
            {subtitle && <p className="auth__subtitle m-0">{subtitle}</p>}
          </div>
        </div>

        <div className="card-body text-start p-4">
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
              <AppIcon name="alert" className="flex-shrink-0" />
              {t(error)}
            </div>
          )}

          {children}
        </div>

        {footer && <div className="auth__footer">{footer}</div>}
      </div>
    </div>
  );
};

// Belgili kiritish maydoni
export const AuthField = ({ id, label, icon, children, hint }) => (
  <div className="mb-3">
    <label htmlFor={id} className="form-label small fw-semibold">
      {label}
    </label>

    <div className="input-group">
      <span className="input-group-text">
        <AppIcon name={icon} />
      </span>

      {children}
    </div>

    {hint && <small className="form-text">{hint}</small>}
  </div>
);

// Parol: ko'zcha bilan ko'rsatish/yashirish
export const PasswordField = ({ id, label, value, onChange, autoComplete, disabled, hint }) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <AuthField id={id} label={label} icon="lock" hint={hint}>
      <input
        type={visible ? "text" : "password"}
        id={id}
        className="form-control"
        autoComplete={autoComplete}
        placeholder="••••••••"
        value={value}
        onChange={(evt) => onChange(evt.target.value)}
        disabled={disabled}
        minLength={8}
        required
      />

      <button
        type="button"
        className="auth__eye btn btn-outline-secondary"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
        title={visible ? t("login.hidePassword") : t("login.showPassword")}
        disabled={disabled}
      >
        <AppIcon name={visible ? "eyeOff" : "eye"} />
      </button>
    </AuthField>
  );
};

export const SubmitButton = ({ loading, label, loadingLabel }) => (
  <button type="submit" className="auth__submit btn btn-primary w-100" disabled={loading}>
    {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
    {loading ? loadingLabel : label}
  </button>
);

// Supabase xatolarini tarjima kalitiga aylantiradi
export const getAuthErrorKey = (error) => {
  const code = error?.code ?? "";
  const message = error?.message?.toLowerCase() ?? "";

  if (code === "invalid_credentials" || message.includes("invalid login"))
    return "auth.errors.wrongCredentials";
  if (code === "email_not_confirmed" || message.includes("not confirmed"))
    return "auth.errors.notConfirmed";
  if (code === "user_already_exists" || message.includes("already registered"))
    return "auth.errors.exists";
  if (code === "weak_password" || message.includes("password should"))
    return "auth.errors.weakPassword";
  if (code === "same_password") return "auth.errors.samePassword";
  if (code.startsWith("over_") || message.includes("rate limit")) return "auth.errors.rateLimit";

  return "auth.errors.unknown";
};

// Login'dan keyin qaytiladigan manzil (faqat sayt ichidagi yo'l)
export const getSafeNext = (searchParams, fallback = "/") => {
  const next = searchParams.get("next");

  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
};
