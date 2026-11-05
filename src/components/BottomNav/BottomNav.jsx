import "./bottomNav.scss";
import { NavLink } from "react-router-dom";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { NAV_LINKS } from "../../utils/navigation";
import { AppIcon } from "../AppIcon";

// Telefonda ekranning pastidagi doimiy menyu (ilovalardagidek).
// Mavzu, til va login header'dagi menyuda qoladi
export const BottomNav = () => {
  const { t } = useI18n();
  const { membership } = useFlat();

  // Uyga a'zo bo'lmagan (yoki login qilmagan) odamga menyu kerak emas
  if (!membership) return null;

  return (
    <nav className="bottom-nav" aria-label={t("header.mainMenu")}>
      {NAV_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          className={({ isActive }) => `bottom-nav__link ${isActive ? "active" : ""}`}
        >
          <span className="bottom-nav__icon">
            <AppIcon name={link.icon} />
          </span>

          <span className="bottom-nav__label">{t(link.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
};
