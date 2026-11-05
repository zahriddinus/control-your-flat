import "../Auth/auth.scss";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useAuth } from "../../context/AuthContext";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon, LogoIcon } from "../../components/AppIcon";
import { EmptyState } from "../../components/EmptyState";
import { PageSkeleton } from "../../components/Skeleton";

const ERROR_KEYS = {
  invite_not_found: "invite.errors.notFound",
  invite_used: "invite.errors.used",
  invite_expired: "invite.errors.expired",
  already_member: "invite.errors.alreadyMember",
  already_linked: "invite.errors.alreadyLinked",
};

const getErrorKey = (error) =>
  Object.entries(ERROR_KEYS).find(([code]) => error?.message?.includes(code))?.[1] ??
  "invite.errors.unknown";

// /invite/:code - xonadosh shu havola orqali o'z hisobi bilan uyga qo'shiladi
export const Invite = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { code } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { reload, selectFlat } = useFlat();

  // undefined - yuklanmoqda, null - topilmadi
  const [invite, setInvite] = useState(undefined);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("get_invite", { p_code: code }).then(({ data, error }) => {
      if (cancelled) return;

      if (error) console.error(error);

      setInvite(data ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    setError(null);

    const { data: flatId, error } = await supabase.rpc("accept_invite", { p_code: code });

    if (error) {
      console.error(error);
      setError(getErrorKey(error));
      setJoining(false);
      return;
    }

    await reload();
    selectFlat(flatId);
    navigate("/", { replace: true });
  }

  if (invite === undefined || authLoading) return <PageSkeleton variant="home" />;

  const invalidKey = !invite
    ? "invite.errors.notFound"
    : invite.used
      ? "invite.errors.used"
      : invite.expired
        ? "invite.errors.expired"
        : null;

  if (invalidKey) {
    return (
      <div className="container py-5">
        <EmptyState
          variant="error"
          title={t("invite.invalidTitle")}
          text={t(invalidKey)}
          action={
            <Link className="btn btn-primary btn-sm px-4" to="/">
              {t("notFound.back")}
            </Link>
          }
        />
      </div>
    );
  }

  const next = encodeURIComponent(`/invite/${code}`);

  return (
    <div className="auth container py-4 py-md-5">
      <div className="auth__card card border-0 shadow">
        <div className="auth__header text-start">
          <span className="auth__badge" aria-hidden="true">
            <LogoIcon />
          </span>

          <div>
            <h1 className="auth__title">{t("invite.title")}</h1>
            <p className="auth__subtitle m-0">{t("invite.subtitle")}</p>
          </div>
        </div>

        <div className="card-body p-4 text-center">
          <p className="mb-1 text-muted">{t("invite.flatLabel")}</p>
          <h2 className="h4 fw-bold mb-3">{invite.flat_name}</h2>

          <p className="mb-4">{t("invite.asResident", { name: invite.resident_name })}</p>

          {error && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 py-2 text-start"
              role="alert"
            >
              <AppIcon name="alert" className="flex-shrink-0" />
              {t(error)}
            </div>
          )}

          {user ? (
            <>
              <button
                type="button"
                className="auth__submit btn btn-primary w-100"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {t("invite.join")}
              </button>

              <small className="d-block text-muted mt-2">
                {t("invite.signedInAs", { email: user.email })}
              </small>
            </>
          ) : (
            <div className="d-grid gap-2">
              <Link className="auth__submit btn btn-primary" to={`/signup?next=${next}`}>
                {t("invite.signup")}
              </Link>

              <Link className="btn btn-outline-primary" to={`/login?next=${next}`}>
                {t("invite.login")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
