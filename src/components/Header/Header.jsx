import "./header.scss";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useI18n } from "../../i18n";
import { NAV_LINKS } from "../../utils/navigation";
import { AppIcon, LogoIcon } from "../AppIcon";
import { Notice, useNotice } from "../Notice";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { AdminMenu } from "./AdminMenu";
import { LoginModal } from "./LoginModal";

const removeAdminFlag = () => {
  try {
    window.localStorage.removeItem("isAdmin");
  } catch {
    // Xotira yopiq bo'lsa, o'chiradigan narsa ham yo'q
  }
};

export const Header = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notice, showNotice] = useNotice();

  // undefined - hali tekshirilmagan, null - yo'q
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  const closeMenu = () => setIsMenuOpen(false);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  // AUTH

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      // Sessiya yo'q bo'lsa, eski "isAdmin" belgisi qolib ketmasin
      if (!newSession) removeAdminFlag();
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    const getProfile = async () => {
      setProfile(undefined);

      const { data, error } = await supabase
        .from("users")
        .select("name, last_name, role")
        .eq("user_id", userId)
        .single();

      if (cancelled) return;

      if (error) console.error(error);

      setProfile(data ?? null);
    };

    getProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const authReady = session !== undefined && profile !== undefined;
  const isAdmin = profile?.role === "admin";

  // SCROLL

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // MOBILE MENU: Escape bilan yopiladi, ochiqligida orqa sahifa qotadi

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape") setIsMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Ekran kattalashsa, mobil menyu yopiladi
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 992px)");

    const handleChange = (evt) => {
      if (evt.matches) setIsMenuOpen(false);
    };

    desktopQuery.addEventListener("change", handleChange);

    return () => desktopQuery.removeEventListener("change", handleChange);
  }, []);

  // LOGIN / LOGOUT

  function openLogin() {
    closeMenu();
    setIsLoginOpen(true);
  }

  function handleLoginSuccess(loggedProfile) {
    closeLogin();
    showNotice(t("header.welcome", { name: loggedProfile.name }));
    navigate("/control-users");
  }

  async function handleLogout() {
    closeMenu();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      showNotice(t("header.logoutError"), "danger");
      return;
    }

    removeAdminFlag();
    showNotice(t("header.logoutSuccess"));
    navigate("/");
  }

  return (
    <>
      <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
        <div className="container header__container">
          {/* Logo */}
          <Link className="header__logo" to="/" onClick={closeMenu}>
            <span className="header__logo-icon" aria-hidden="true">
              <LogoIcon />
            </span>

            <span className="header__logo-text">
              <span className="header__logo-small">Control</span>
              Your Flat
            </span>
          </Link>

          {/* Hamburger */}
          <button
            className={`header__hamburger ${isMenuOpen ? "open" : ""} rounded-circle`}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
            aria-controls="main-navigation"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg
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
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
                />
              </svg>
            )}
          </button>

          {/* Mobil menyu ochiqligida orqa fon */}
          {isMenuOpen && <div className="header__overlay" onClick={closeMenu}></div>}

          {/* Navigation */}
          <nav
            id="main-navigation"
            className={`header__nav ${isMenuOpen ? "show" : ""}`}
            aria-label={t("header.mainMenu")}
          >
            <ul className="header__nav-list">
              {NAV_LINKS.map((link) => (
                <li className="header__nav-item" key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => `header__link ${isActive ? "active-link" : ""}`}
                    onClick={closeMenu}
                  >
                    <span className="header__link-icon">
                      <AppIcon name={link.icon} />
                    </span>
                    {t(link.labelKey)}
                  </NavLink>
                </li>
              ))}

              <li className="header__nav-item">
                <ThemeToggle />
              </li>

              <li className="header__nav-item">
                <LanguageSwitcher />
              </li>

              {authReady && (
                <li className="header__nav-item">
                  {isAdmin ? (
                    <AdminMenu profile={profile} onNavigate={closeMenu} onLogout={handleLogout} />
                  ) : (
                    <button
                      type="button"
                      className="header__login-btn btn btn-primary"
                      onClick={openLogin}
                    >
                      {t("header.login")}
                    </button>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={closeLogin} onSuccess={handleLoginSuccess} />

      <Notice notice={notice} />
    </>
  );
};
