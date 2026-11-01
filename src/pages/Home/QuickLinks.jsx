import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar";
import { getShortMonth } from "../../utils/date";
import { useI18n } from "../../i18n";

// Uy Telegram guruhining havolasini shu yerga yozing, masalan "https://t.me/+abc123".
// Bo'sh bo'lsa, Telegram kartochkasi ko'rinmaydi
const TELEGRAM_GROUP_URL = "";

// Avatarlar to'plamida nechta odam ko'rinadi, qolganlari "+N" bo'ladi
const VISIBLE_AVATARS = 3;

const LINKS = [
  {
    to: "/duties-schedule",
    icon: "calendar",
    titleKey: "home.links.schedule",
    textKey: "home.links.scheduleText",
  },
  {
    to: "/users",
    icon: "people",
    titleKey: "home.links.users",
    textKey: "home.links.usersText",
  },
  TELEGRAM_GROUP_URL && {
    href: TELEGRAM_GROUP_URL,
    icon: "💬",
    titleKey: "home.links.telegram",
    textKey: "home.links.telegramText",
  },
].filter(Boolean);

// Bugungi sana yozilgan kalendar varag'i
const CalendarIcon = ({ today, lang }) => (
  <span className="home__calendar" aria-hidden="true">
    <span className="home__calendar-month">{getShortMonth(today, lang)}</span>
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
  const { t, lang } = useI18n();

  const renderIcon = () => {
    if (link.icon === "calendar") return <CalendarIcon today={today} lang={lang} />;
    if (link.icon === "people" && users.length) return <PeopleIcon users={users} />;
    if (link.icon === "people") return <span className="home__icon">👥</span>;

    return <span className="home__icon">{link.icon}</span>;
  };

  return (
    <div className="card-body d-flex align-items-center gap-3">
      {renderIcon()}

      <div>
        <span className="fw-semibold d-block text-body">{t(link.titleKey)}</span>

        <small className="text-muted">{t(link.textKey)}</small>
      </div>
    </div>
  );
};

export const QuickLinks = ({ users = [], today = new Date() }) => {
  const { t } = useI18n();

  return (
    <section className="text-start">
      <h2 className="home__section-title">{t("home.links.title")}</h2>

      <div className="row g-3">
        {LINKS.map((link) => (
          <div className="col-12 col-sm-6 col-lg-4" key={link.titleKey}>
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
