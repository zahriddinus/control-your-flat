import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Xato bo'lganda oyna bir marta silkinadi
  const [shake, setShake] = useState(false);

  const emailRef = useRef(null);

  // Tekshiruv paytida oynani yopib bo'lmaydi
  const handleClose = () => {
    if (!loading) onClose();
  };

  useModalEffects(isOpen, onClose, !loading);

  // Oyna ochilganda: tozalaymiz va email'ga fokus beramiz
  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setPassword("");
    setShowPassword(false);
    emailRef.current?.focus();
  }, [isOpen]);

  function showError(key) {
    setError(key);
    setShake(true);
    setLoading(false);
  }

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(error);
      showError("login.wrongCredentials");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("name, last_name, role")
      .eq("user_id", data.user.id)
      .single();

    if (profileError || profile.role !== "admin") {
      if (profileError) console.error(profileError);

      // Admin bo'lmagan userning sessiyasini ochiq qoldirmaymiz
      await supabase.auth.signOut();

      showError(profileError ? "login.profileNotFound" : "login.adminsOnly");
      return;
    }

    try {
      window.localStorage.setItem("isAdmin", "true");
    } catch {
      // ProtectedRoute baribir sessiyani tekshiradi
    }

    setLoading(false);
    setEmail("");
    setPassword("");

    onSuccess(profile);
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loginModalLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div
            className={`login-modal modal-content border-0 shadow ${shake ? "login-modal--shake" : ""}`}
            onAnimationEnd={() => setShake(false)}
          >
            <form onSubmit={handleSubmit}>
              {/* SARLAVHA */}

              <div className="login-modal__header modal-header border-0">
                <div className="d-flex align-items-center gap-3">
                  <span className="login-modal__badge" aria-hidden="true">
                    <AppIcon name="lock" />
                  </span>

                  <div className="text-start">
                    <h1 className="modal-title fs-5 fw-bold" id="loginModalLabel">
                      {t("login.title")}
                    </h1>

                    <small className="login-modal__subtitle">{t("login.subtitle")}</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label={t("common.close")}
                  onClick={handleClose}
                  disabled={loading}
                ></button>
              </div>

              <div className="modal-body text-start p-4">
                {error && (
                  <div
                    className="login-modal__error alert alert-danger d-flex align-items-center gap-2 py-2"
                    role="alert"
                  >
                    <AppIcon name="alert" className="flex-shrink-0" />
                    {t(error)}
                  </div>
                )}

                {/* EMAIL */}

                <label htmlFor="loginEmail" className="form-label small fw-semibold">
                  {t("login.email")}
                </label>

                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <AppIcon name="mail" />
                  </span>

                  <input
                    ref={emailRef}
                    type="email"
                    id="loginEmail"
                    className="form-control"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(evt) => setEmail(evt.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {/* PAROL */}

                <label htmlFor="loginPassword" className="form-label small fw-semibold">
                  {t("login.password")}
                </label>

                <div className="input-group">
                  <span className="input-group-text">
                    <AppIcon name="lock" />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    id="loginPassword"
                    className="form-control"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(evt) => setPassword(evt.target.value)}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="login-modal__eye btn btn-outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    title={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    disabled={loading}
                  >
                    <AppIcon name={showPassword ? "eyeOff" : "eye"} />
                  </button>
                </div>
              </div>

              {/* TUGMALAR */}

              <div className="modal-footer border-0 px-4 pb-4 pt-0 flex-nowrap gap-2">
                <button
                  type="button"
                  className="btn btn-light w-50 m-0"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  className="login-modal__submit btn btn-primary w-50 m-0"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      ></span>
                      {t("login.checking")}
                    </>
                  ) : (
                    t("login.submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};
