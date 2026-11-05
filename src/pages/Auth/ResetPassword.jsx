import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n";
import { EmptyState } from "../../components/EmptyState";
import { PageSkeleton } from "../../components/Skeleton";
import { AuthCard, PasswordField, SubmitButton, getAuthErrorKey } from "./AuthCard";

// Emaildagi havola orqali kelinadi: Supabase vaqtinchalik sessiya ochadi, shu bilan yangi parol qo'yiladi
export const ResetPassword = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading, clearRecovery } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

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

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      console.error(error);
      fail(getAuthErrorKey(error));
      return;
    }

    clearRecovery();
    navigate("/", { replace: true });
  }

  if (authLoading) return <PageSkeleton variant="home" />;

  // Havola eskirgan yoki allaqachon ishlatilgan
  if (!user) {
    return (
      <div className="container py-5">
        <EmptyState
          variant="error"
          title={t("auth.reset.expiredTitle")}
          text={t("auth.reset.expiredText")}
          action={
            <Link className="btn btn-primary btn-sm px-4" to="/forgot-password">
              {t("auth.forgot.submit")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <AuthCard
      icon="lock"
      title={t("auth.reset.title")}
      subtitle={user.email}
      error={error}
      shakeKey={errorCount || null}
    >
      <form onSubmit={handleSubmit}>
        <PasswordField
          id="resetPassword"
          label={t("auth.newPassword")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={loading}
          hint={t("auth.passwordHint")}
        />

        <PasswordField
          id="resetConfirm"
          label={t("auth.confirmPassword")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={loading}
        />

        <SubmitButton
          loading={loading}
          label={t("auth.reset.submit")}
          loadingLabel={t("auth.saving")}
        />
      </form>
    </AuthCard>
  );
};
