import "./header.scss";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";

export const Header = () => {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(window.localStorage.getItem("isAdmin") === "true");

  const navRef = useRef(null);
  const hamburgerRef = useRef(null);

  const [showNotification, setShowNotification] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Email yoki parol noto‘g‘ri");
      console.log(error);
      handleDarkMode();
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    console.log(profileError);

    if (profileError) {
      setMessage("Foydalanuvchi maʼlumotlari topilmadi");
      console.log(profileError);
      handleDarkMode();
      return;
    }

    console.log("ROLE:", profile.role);

    setEmail("");
    setPassword("");

    if (profile.role === "admin") {
      window.localStorage.setItem("isAdmin", "true");
      setIsAdmin(true);
      navigate("/control-users");
    } else {
      setIsAdmin(false);
      setMessage("Kechirasiz, siz usersiz");
      handleDarkMode();
      return;
    }

    setMessage("Authenticationdan muvaffaqiyatli otdingiz");
    handleDarkMode();

    console.log("Login successful:", data.user);
  };

  function handleDarkMode() {
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMenuOpen) return;

      const clickedInsideNav = navRef.current?.contains(event.target);
      const clickedHamburger = hamburgerRef.current?.contains(event.target);

      if (!clickedInsideNav && !clickedHamburger) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="header">
        {showNotification && message && (
          <div
            className="position-absolute top-0 start-50 translate-middle-x p-3"
            style={{ minWidth: "270px" }}
          >
            <div
              className="alert alert-warning position-fixed"
              style={{
                zIndex: 9999,
              }}
            >
              {message}
            </div>
          </div>
        )}

        <div className="container py-2 header__container">
          {/* Logo */}
          <div className="header__logo">
            <Link className="text-decoration-none fw-semibold" to="/" onClick={closeMenu}>
              Residents
            </Link>
          </div>

          {/* Hamburger */}
          <button
            ref={hamburgerRef}
            className={`header__hamburger ${isMenuOpen ? "open" : ""} rounded-circle`}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {isMenuOpen ? (
              <svg
                className="header__close"
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="currentColor"
                className="bi bi-list"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
                />
              </svg>
            )}
          </button>

          {/* Navigation */}
          <nav className={`header__nav ${isMenuOpen ? "show" : ""}`} ref={navRef}>
            <ul className="m-0 p-0 list-unstyled header__nav-list w-100">
              {isAdmin && (
                <li className="header__nav-item">
                  <NavLink
                    to="/control-users"
                    className={({ isActive }) => (isActive ? "active-link" : "")}
                    onClick={closeMenu}
                  >
                    Control Users
                  </NavLink>
                </li>
              )}

              <li className="header__nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                  onClick={closeMenu}
                >
                  Home
                </NavLink>
              </li>

              <li className="header__nav-item">
                <NavLink
                  to="/duties-schedule"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                  onClick={closeMenu}
                >
                  Duties schedule
                </NavLink>
              </li>

              <li className="header__nav-item">
                <NavLink
                  to="/users"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                  onClick={closeMenu}
                >
                  Users
                </NavLink>
              </li>

              <li className="header__nav-item">
                <button
                  type="button"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#exampleModal"
                  onClick={closeMenu}
                >
                  Log in
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Modal */}
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Authentication
              </h1>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body text-start">
              <div className="mb-2">
                <label htmlFor="exampleFormControlInput1" className="form-label">
                  Email address
                </label>

                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="form-control"
                  id="exampleFormControlInput1"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(evt) => setEmail(evt.target.value)}
                />
              </div>

              <div>
                <label htmlFor="inputPassword5" className="form-label">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  id="inputPassword5"
                  className="form-control"
                  value={password}
                  onChange={(evt) => setPassword(evt.target.value)}
                />

                <div id="passwordHelpBlock" className="form-text">
                  Your password must be 8-20 characters long, contain letters and numbers, and must
                  not contain spaces, special characters, or emoji.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>

              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
                onClick={handleLogin}
              >
                Check role
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
