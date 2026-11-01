import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(error);
      setError("login.wrongCredentials");
      setLoading(false);
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

      setError(profileError ? "login.profileNotFound" : "login.adminsOnly");
      setLoading(false);
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
          <div className="login-modal modal-content border-0 shadow">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-0 pb-0">
                <div className="text-start">
                  <h1 className="modal-title fs-4 fw-bold" id="loginModalLabel">
                    {t("login.title")}
                  </h1>

                  <small className="text-muted">{t("login.subtitle")}</small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label={t("common.close")}
                  onClick={handleClose}
                  disabled={loading}
                ></button>
              </div>

              <div className="modal-body text-start">
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {t(error)}
                  </div>
                )}

                <label htmlFor="loginEmail" className="form-label">
                  {t("login.email")}
                </label>

                <input
                  ref={emailRef}
                  type="email"
                  id="loginEmail"
                  className="form-control mb-3"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(evt) => setEmail(evt.target.value)}
                  disabled={loading}
                  required
                />

                <label htmlFor="loginPassword" className="form-label">
                  {t("login.password")}
                </label>

                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="loginPassword"
                    className="form-control"
                    autoComplete="current-password"
                    placeholder="********"
                    value={password}
                    onChange={(evt) => setPassword(evt.target.value)}
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    disabled={loading}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t("common.cancel")}
                </button>

                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
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
