import { Link } from "react-router-dom";

// Uy Telegram guruhining havolasini shu yerga yozing, masalan "https://t.me/+abc123".
// Bo'sh bo'lsa, Telegram kartochkasi ko'rinmaydi
const TELEGRAM_GROUP_URL = "";

const LINKS = [
  {
    to: "/duties-schedule",
    icon: "📅",
    title: "Navbatchilik jadvali",
    text: "Butun oy bo'yicha navbatlar",
  },
  {
    to: "/users",
    icon: "👥",
    title: "Xonadoshlar",
    text: "Telefon raqamlar va Telegram",
  },
  TELEGRAM_GROUP_URL && {
    href: TELEGRAM_GROUP_URL,
    icon: "💬",
    title: "Telegram guruh",
    text: "Uy chatiga o'tish",
  },
].filter(Boolean);

const LinkContent = ({ link }) => (
  <div className="card-body d-flex align-items-center gap-3">
    <span className="home__icon">{link.icon}</span>

    <div>
      <span className="fw-semibold d-block text-body">{link.title}</span>

      <small className="text-muted">{link.text}</small>
    </div>
  </div>
);

export const QuickLinks = () => {
  return (
    <section className="text-start">
      <h2 className="home__section-title">Tezkor havolalar</h2>

      <div className="row g-3">
        {LINKS.map((link) => (
          <div className="col-12 col-sm-6 col-lg-4" key={link.title}>
            {link.href ? (
              <a
                className="home__link card border-0 shadow-sm h-100 text-decoration-none"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkContent link={link} />
              </a>
            ) : (
              <Link
                className="home__link card border-0 shadow-sm h-100 text-decoration-none"
                to={link.to}
              >
                <LinkContent link={link} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
