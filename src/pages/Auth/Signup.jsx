import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import {
  AuthCard,
  AuthField,
  PasswordField,
  SubmitButton,
  getAuthErrorKey,
  getSafeNext,
} from "./AuthCard";

export const Signup = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Taklif havolasidan kelgan bo'lsa, o'sha yerga qaytadi; aks holda - yangi uy yaratish
  const next = getSafeNext(searchParams, "/new-flat");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  // Email tasdiqlash yoqilgan bo'lsa, xat yuborilgani haqida xabar
  const [sentTo, setSentTo] = useState(null);

  function fail(key) {
    setError(key);
    setErrorCount((count) => count + 1);
  }

  async function handleSubmit(evt) {
    evt.preventDefault();

    if (password !== confirm) {
      fail("auth.errors.mismatch");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });

    setLoading(false);

    if (error) {
      console.error(error);
      fail(getAuthErrorKey(error));
      return;
    }

    if (data.session) {
      navigate(next, { replace: true });
      return;
    }

    // Email band bo'lsa, Supabase xato bermaydi, lekin hisob "identities"siz qaytadi va xat yuborilmaydi
    if (data.user && !data.user.identities?.length) {
      fail("auth.errors.exists");
      return;
    }

    setSentTo(email.trim());
  }

  const nextQuery = next !== "/new-flat" ? `?next=${encodeURIComponent(next)}` : "";

  if (sentTo) {
    return (
      <AuthCard icon="mail" title={t("auth.signup.checkTitle")}>
        <div className="auth__result">
          <span className="auth__result-icon" aria-hidden="true">
            <AppIcon name="send" />
          </span>

          <p className="mb-2">{t("auth.signup.checkText", { email: sentTo })}</p>
          <small className="text-muted">{t("auth.signup.checkHint")}</small>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon="user"
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      error={error}
      shakeKey={errorCount || null}
      footer={
        <>
          {t("auth.signup.haveAccount")} <Link to={`/login${nextQuery}`}>{t("login.submit")}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthField id="signupEmail" label={t("login.email")} icon="mail">
          <input
            type="email"
            id="signupEmail"
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
          id="signupPassword"
          label={t("login.password")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={loading}
          hint={t("auth.passwordHint")}
        />

        <PasswordField
          id="signupConfirm"
          label={t("auth.confirmPassword")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={loading}
        />

        <SubmitButton
          loading={loading}
          label={t("auth.signup.submit")}
          loadingLabel={t("auth.signup.loading")}
        />
      </form>
    </AuthCard>
  );
};
