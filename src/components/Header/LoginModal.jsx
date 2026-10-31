import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
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

  // Oyna ochilganda: tozalaymiz, email'ga fokus beramiz va orqa sahifani qotiramiz
  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setPassword("");
    setShowPassword(false);
    emailRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error(error);
      setError("Email yoki parol noto‘g‘ri.");
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

      setError(
        profileError
          ? "Foydalanuvchi maʼlumotlari topilmadi."
          : "Kechirasiz, bu bo'lim faqat adminlar uchun."
      );
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
                    🔐 Admin kirishi
                  </h1>

                  <small className="text-muted">Bu bo'lim faqat adminlar uchun</small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Yopish"
                  onClick={handleClose}
                  disabled={loading}
                ></button>
              </div>

              <div className="modal-body text-start">
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <label htmlFor="loginEmail" className="form-label">
                  Email
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
                  Parol
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
                    aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
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
                  Bekor qilish
                </button>

                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      ></span>
                      Tekshirilmoqda...
                    </>
                  ) : (
                    "Kirish"
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
