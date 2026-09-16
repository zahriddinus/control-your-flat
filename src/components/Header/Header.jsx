import "./header.scss";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";

export const Header = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(window.localStorage.getItem("isAdmin") === "true");

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

  const [showNotification, setShowNotification] = useState(false);

  function handleDarkMode() {
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  }

  return (
    <header>
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

      <div className="container py-2 d-flex justify-content-between">
        <div>
          <Link className="text-decoration-none fw-semibold" to="/">
            Residents
          </Link>
        </div>

        <nav>
          <ul className="m-0 p-0 list-unstyled d-flex ">
            {isAdmin && (
              <li className="header__nav-item me-3">
                <NavLink
                  to="/control-users"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Control Users
                </NavLink>
              </li>
            )}

            <li className="header__nav-item me-3">
              <NavLink to="/" className={({ isActive }) => (isActive ? "active-link" : "")}>
                Home
              </NavLink>
            </li>
            <li className="header__nav-item me-3">
              <NavLink
                to="/duties-schedule"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Duties schedule
              </NavLink>
            </li>
            <li className="header__nav-item me-3">
              <NavLink to="/users" className={({ isActive }) => (isActive ? "active-link" : "")}>
                Users
              </NavLink>
            </li>
            <li className="header__nav-item ">
              <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
              >
                Log in
              </button>
            </li>
          </ul>
        </nav>
      </div>

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
                  aria-describedby="passwordHelpBlock"
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
    </header>
  );
};
