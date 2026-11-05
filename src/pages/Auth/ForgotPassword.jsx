import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { AuthCard, AuthField, SubmitButton, getAuthErrorKey } from "./AuthCard";

export const ForgotPassword = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    // Bunday email bormi-yo'qmi aytilmaydi: begona odam hisoblarni tekshira olmasin
    if (error && getAuthErrorKey(error) === "auth.errors.rateLimit") {
      setError("auth.errors.rateLimit");
      return;
    }

    if (error) console.error(error);

    setSent(true);
  }

  return (
    <AuthCard
      icon="mail"
      title={t("auth.forgot.title")}
      subtitle={!sent ? t("auth.forgot.subtitle") : null}
      error={error}
      footer={<Link to="/login">{t("auth.backToLogin")}</Link>}
    >
      {sent ? (
        <div className="auth__result">
          <span className="auth__result-icon" aria-hidden="true">
            <AppIcon name="send" />
          </span>

          <p className="m-0">{t("auth.forgot.sent", { email: email.trim() })}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <AuthField id="forgotEmail" label={t("login.email")} icon="mail">
            <input
              type="email"
              id="forgotEmail"
              className="form-control"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(evt) => setEmail(evt.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </AuthField>

          <SubmitButton
            loading={loading}
            label={t("auth.forgot.submit")}
            loadingLabel={t("auth.sending")}
          />
        </form>
      )}
    </AuthCard>
  );
};
