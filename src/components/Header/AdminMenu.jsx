import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppIcon } from "../AppIcon";
import { Avatar } from "../Avatar";

export const AdminMenu = ({ profile, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef(null);

  // Tashqariga bosilganda yoki Escape'da yopiladi
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (evt) => {
      if (!menuRef.current?.contains(evt.target)) setIsOpen(false);
    };

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="header__admin" ref={menuRef}>
      <button
        type="button"
        className="header__admin-btn btn d-flex align-items-center gap-2"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar user={profile} size="sm" />

        <span className="text-start lh-sm">
          <span className="d-block fw-semibold">{profile.name}</span>

          <span className="badge text-bg-primary">Admin</span>
        </span>

        <AppIcon name="chevron" className={`header__caret ${isOpen ? "open" : ""}`} />
      </button>

      <ul className={`header__admin-menu dropdown-menu ${isOpen ? "show" : ""}`}>
        <li>
          <Link
            className="dropdown-item"
            to="/control-users"
            onClick={() => {
              setIsOpen(false);
              onNavigate();
            }}
          >
            <AppIcon name="sliders" className="header__menu-icon" />
            Control Users
          </Link>
        </li>

        <li>
          <hr className="dropdown-divider" />
        </li>

        <li>
          <button
            type="button"
            className="dropdown-item text-danger"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            <AppIcon name="logout" className="header__menu-icon" />
            Chiqish
          </button>
        </li>
      </ul>
    </div>
  );
};
