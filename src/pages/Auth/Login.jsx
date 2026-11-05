import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useI18n } from "../../i18n";
import {
  AuthCard,
  AuthField,
  PasswordField,
  SubmitButton,
  getAuthErrorKey,
  getSafeNext,
} from "./AuthCard";

export const Login = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeNext(searchParams);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    setLoading(false);

    if (error) {
      console.error(error);
      setError(getAuthErrorKey(error));
      setErrorCount((count) => count + 1);
      return;
    }

    navigate(next, { replace: true });
  }

  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthCard
      icon="lock"
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      error={error}
      shakeKey={errorCount || null}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <Link to={`/signup${nextQuery}`}>{t("auth.signup.link")}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthField id="loginEmail" label={t("login.email")} icon="mail">
          <input
            type="email"
            id="loginEmail"
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

        <PasswordField
          id="loginPassword"
          label={t("login.password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="text-end mb-3">
          <Link className="small" to="/forgot-password">
            {t("auth.login.forgot")}
          </Link>
        </div>

        <SubmitButton
          loading={loading}
          label={t("login.submit")}
          loadingLabel={t("login.checking")}
        />
      </form>
    </AuthCard>
  );
};
