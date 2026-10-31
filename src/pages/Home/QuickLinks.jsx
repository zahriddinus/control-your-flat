import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar";
import { getShortMonth } from "../../utils/date";

// Uy Telegram guruhining havolasini shu yerga yozing, masalan "https://t.me/+abc123".
// Bo'sh bo'lsa, Telegram kartochkasi ko'rinmaydi
const TELEGRAM_GROUP_URL = "";

// Avatarlar to'plamida nechta odam ko'rinadi, qolganlari "+N" bo'ladi
const VISIBLE_AVATARS = 3;

const LINKS = [
  {
    to: "/duties-schedule",
    icon: "calendar",
    title: "Navbatchilik jadvali",
    text: "Butun oy bo'yicha navbatlar",
  },
  {
    to: "/users",
    icon: "people",
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

// Bugungi sana yozilgan kalendar varag'i
const CalendarIcon = ({ today }) => (
  <span className="home__calendar" aria-hidden="true">
    <span className="home__calendar-month">{getShortMonth(today)}</span>
    <span className="home__calendar-day">{today.getDate()}</span>
  </span>
);

// Haqiqiy xonadoshlarning ustma-ust avatarlari
const PeopleIcon = ({ users }) => {
  const hiddenCount = users.length - VISIBLE_AVATARS;

  return (
    <span className="home__avatars" aria-hidden="true">
      {users.slice(0, VISIBLE_AVATARS).map((user) => (
        <Avatar user={user} size="sm" key={user.user_id} />
      ))}

      {hiddenCount > 0 && <span className="home__avatars-more">+{hiddenCount}</span>}
    </span>
  );
};

const LinkContent = ({ link, users, today }) => {
  const renderIcon = () => {
    if (link.icon === "calendar") return <CalendarIcon today={today} />;
    if (link.icon === "people" && users.length) return <PeopleIcon users={users} />;
    if (link.icon === "people") return <span className="home__icon">👥</span>;

    return <span className="home__icon">{link.icon}</span>;
  };

  return (
    <div className="card-body d-flex align-items-center gap-3">
      {renderIcon()}

      <div>
        <span className="fw-semibold d-block text-body">{link.title}</span>

        <small className="text-muted">{link.text}</small>
      </div>
    </div>
  );
};

export const QuickLinks = ({ users = [], today = new Date() }) => {
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
                <LinkContent link={link} users={users} today={today} />
              </a>
            ) : (
              <Link
                className="home__link card border-0 shadow-sm h-100 text-decoration-none"
                to={link.to}
              >
                <LinkContent link={link} users={users} today={today} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
