import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useAuth } from "../../context/AuthContext";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";
import { Avatar } from "../Avatar";
import { ConfirmModal } from "../ConfirmModal";

// Login qilgan foydalanuvchi menyusi: uylar orasida almashish, boshqaruv, chiqish
export const UserMenu = ({ onNavigate, onLogout }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { memberships, membership, flat, isOwner, isManager, selectFlat, reload } = useFlat();
  const [isOpen, setIsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  // Ism uydagi xonadosh qatoridan, bo'lmasa email boshidan
  const resident = membership?.resident;
  const profile = resident?.name ? resident : { name: user.email.split("@")[0], last_name: "" };

  const close = () => {
    setIsOpen(false);
    onNavigate();
  };

  function handleSelectFlat(flatId) {
    selectFlat(flatId);
    close();
    navigate("/");
  }

  async function handleLeave() {
    setLeaving(true);

    const { error } = await supabase
      .from("flat_members")
      .delete()
      .eq("flat_id", membership.flat_id)
      .eq("auth_user_id", user.id);

    setLeaving(false);
    setLeaveOpen(false);

    if (error) {
      console.error(error);
      return;
    }

    await reload();
    navigate("/");
  }

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
          <span className="d-block fw-semibold">{profile.name.trim()}</span>

          {flat ? (
            <span className={`badge ${isManager ? "text-bg-primary" : "text-bg-light border"}`}>
              {flat.name}
            </span>
          ) : (
            <small className="text-muted">{t("userMenu.noFlat")}</small>
          )}
        </span>

        <AppIcon name="chevron" className={`header__caret ${isOpen ? "open" : ""}`} />
      </button>

      <ul className={`header__admin-menu dropdown-menu ${isOpen ? "show" : ""}`}>
        <li>
          <span className="dropdown-item-text small text-muted text-truncate d-block">
            {user.email}
          </span>
        </li>

        {memberships.length > 0 && (
          <>
            <li>
              <h6 className="dropdown-header">{t("userMenu.myFlats")}</h6>
            </li>

            {memberships.map((item) => (
              <li key={item.flat_id}>
                <button
                  type="button"
                  className={`dropdown-item d-flex align-items-center gap-2 ${
                    item.flat_id === membership?.flat_id ? "active" : ""
                  }`}
                  onClick={() => handleSelectFlat(item.flat_id)}
                >
                  <AppIcon
                    name={
                      item.role === "owner" ? "shield" : item.role === "admin" ? "sliders" : "home"
                    }
                  />
                  <span className="flex-grow-1 text-truncate">{item.flat.name}</span>
                  {item.flat_id === membership?.flat_id && <AppIcon name="check" />}
                </button>
              </li>
            ))}
          </>
        )}

        <li>
          <Link className="dropdown-item" to="/new-flat" onClick={close}>
            <AppIcon name="plus" className="header__menu-icon" />
            {t("userMenu.newFlat")}
          </Link>
        </li>

        {flat && (
          <li>
            <hr className="dropdown-divider" />
          </li>
        )}

        {isManager && (
          <>
            <li>
              <Link className="dropdown-item" to="/control-users" onClick={close}>
                <AppIcon name="users" className="header__menu-icon" />
                {t("nav.controlUsers")}
              </Link>
            </li>

            <li>
              <Link className="dropdown-item" to="/settings" onClick={close}>
                <AppIcon name="sliders" className="header__menu-icon" />
                {t("settings.title")}
              </Link>
            </li>
          </>
        )}

        {flat && !isOwner && (
          <li>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setIsOpen(false);
                setLeaveOpen(true);
              }}
            >
              <AppIcon name="logout" className="header__menu-icon" />
              {t("userMenu.leave")}
            </button>
          </li>
        )}

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
            {t("header.logout")}
          </button>
        </li>
      </ul>

      <ConfirmModal
        isOpen={leaveOpen}
        title={t("userMenu.leaveTitle")}
        icon="logout"
        confirmLabel={t("userMenu.leave")}
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() => setLeaveOpen(false)}
      >
        <p className="m-0">{t("userMenu.leaveQuestion", { name: flat?.name ?? "" })}</p>
      </ConfirmModal>
    </div>
  );
};
