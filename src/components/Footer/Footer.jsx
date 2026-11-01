import "./footer.scss";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { NAV_LINKS } from "../../utils/navigation";
import { AppIcon, LogoIcon } from "../AppIcon";

// Saytni yaratgan dasturchi
const AUTHOR_TELEGRAM = "zahriddinus";

// Bepul API'lardan foydalanish sharti: manbalar ko'rsatilishi kerak
const SOURCES = [
  {
    icon: "🌦️",
    labelKey: "footer.weatherSource",
    name: "Open-Meteo",
    href: "https://open-meteo.com/",
  },
  {
    icon: "🗺️",
    labelKey: "footer.addressSource",
    name: "© OpenStreetMap",
    href: "https://www.openstreetmap.org/copyright",
  },
  {
    icon: "📍",
    labelKey: "footer.fallbackAddressSource",
    name: "BigDataCloud",
    href: "https://www.bigdatacloud.com/",
  },
];

export const Footer = () => {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="footer mt-auto">
      {/* To'lqin: sahifadan footer'ga silliq o'tish */}
      <svg
        className="footer__wave"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,40 C240,80 480,0 720,32 C960,64 1200,8 1440,40 L1440,80 L0,80 Z" />
      </svg>

      <div className="footer__body">
        <div className="container text-start">
          <div className="row g-4">
            {/* Brend */}
            <div className="col-12 col-md-5">
              <Link className="footer__brand" to="/">
                <span className="footer__logo" aria-hidden="true">
                  <LogoIcon />
                </span>

                <span className="footer__brand-text">
                  <span className="footer__brand-small">Control</span>
                  Your Flat
                </span>
              </Link>

              <p className="footer__muted mt-3 mb-0">{t("footer.description")}</p>
            </div>

            {/* Havolalar */}
            <div className="col-6 col-md-3">
              <h2 className="footer__title">{t("footer.pages")}</h2>

              <ul className="list-unstyled m-0">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link className="footer__link" to={link.to}>
                      <AppIcon name={link.icon} className="footer__link-icon" />
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Manbalar */}
            <div className="col-6 col-md-4">
              <h2 className="footer__title">{t("footer.sources")}</h2>

              <ul className="list-unstyled m-0">
                {SOURCES.map((source) => (
                  <li key={source.name}>
                    <a
                      className="footer__source"
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span aria-hidden="true">{source.icon}</span>
                      <span>
                        <small className="footer__muted d-block">{t(source.labelKey)}</small>
                        {source.name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer__bottom d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <small className="footer__muted">
              © {year} Control Your Flat · {t("footer.madeWith")}
            </small>

            <a
              className="footer__author"
              href={`https://t.me/${AUTHOR_TELEGRAM}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t("footer.authorTitle")}
            >
              {/* Telegram logotipi (Bootstrap Icons) */}
              <svg
                className="footer__author-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
              </svg>
              <span>
                <small className="d-block">{t("footer.author")}</small>@{AUTHOR_TELEGRAM}
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
