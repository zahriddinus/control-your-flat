import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { WeatherIcon } from "../../components/WeatherIcon";
import { TASKS } from "../../utils/schedule";
import { findDone } from "../../utils/done";
import { useI18n } from "../../i18n";
import { formatLongDate, getDayOfYear } from "../../utils/date";

// Maslahat belgilari (16x16). Ba'zilari to'ldirilgan, ba'zilari chiziqli
const TIP_ICONS = {
  dishes: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.3" />
      <circle cx="8" cy="8" r="3.3" />
    </g>
  ),
  sparkles: (
    <path d="M7.66 6.25c.11-.33.57-.33.68 0l.65 1.94a2.9 2.9 0 0 0 1.83 1.82l1.93.65c.33.11.33.57 0 .68l-1.93.65a2.9 2.9 0 0 0-1.83 1.83l-.65 1.93a.36.36 0 0 1-.68 0l-.65-1.93a2.9 2.9 0 0 0-1.83-1.83l-1.93-.65a.36.36 0 0 1 0-.68l1.93-.65a2.9 2.9 0 0 0 1.83-1.82zM3.8 1.15a.22.22 0 0 1 .4 0l.4 1.16c.17.52.58.92 1.1 1.1l1.16.38a.22.22 0 0 1 0 .42l-1.16.38a1.7 1.7 0 0 0-1.1 1.1l-.4 1.16a.22.22 0 0 1-.4 0l-.39-1.16a1.7 1.7 0 0 0-1.1-1.1L1.15 4.2a.22.22 0 0 1 0-.42l1.16-.38a1.7 1.7 0 0 0 1.1-1.1z" />
  ),
  trash: (
    <path d="M6 1h4a1 1 0 0 1 1 1v1h3a.5.5 0 0 1 0 1h-.6l-.8 10.1A1 1 0 0 1 11.6 15H4.4a1 1 0 0 1-1-.9L2.6 4H2a.5.5 0 0 1 0-1h3V2a1 1 0 0 1 1-1m0 2h4V2H6z" />
  ),
  moon: <path d="M9 1.5a6.5 6.5 0 1 0 5.5 9.9A5.5 5.5 0 0 1 9 1.5z" />,
  fridge: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="3.5" y="1.2" width="9" height="13.6" rx="1.6" />
      <line x1="3.5" y1="6" x2="12.5" y2="6" />
      <line x1="10.3" y1="3" x2="10.3" y2="4.2" />
      <line x1="10.3" y1="8" x2="10.3" y2="10.5" />
    </g>
  ),
  heart: (
    <path
      fillRule="evenodd"
      d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
    />
  ),
  drop: <path d="M8 1.5S3 7 3 10a5 5 0 0 0 10 0c0-3-5-8.5-5-8.5z" />,
  bulb: (
    <>
      <path d="M8 1a4.6 4.6 0 0 0-2.7 8.3c.4.3.7.8.7 1.3V11.5h4v-.9c0-.5.3-1 .7-1.3A4.6 4.6 0 0 0 8 1z" />
      <rect x="6" y="12.4" width="4" height="1.5" rx=".75" />
    </>
  ),
  swap: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 5.5h10l-2.5-2.5" />
      <path d="M13.5 10.5h-10l2.5 2.5" />
    </g>
  ),
  shirt: (
    <path d="M5.5 1.5 1.5 4l1.7 3.2 1.8-.9V14.5h6V6.3l1.8.9L14.5 4l-4-2.5a2.5 2.5 0 0 1-5 0z" />
  ),
};

// Har kuni bittasi navbat bilan chiqadi. Matnlari tarjimada: home.tips.<icon>
const TIPS = [
  { icon: "dishes" },
  { icon: "sparkles" },
  { icon: "trash" },
  { icon: "moon" },
  { icon: "fridge" },
  { icon: "heart" },
  { icon: "drop" },
  { icon: "bulb" },
  { icon: "swap" },
  { icon: "shirt" },
];

const TipIcon = ({ name, className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    {TIP_ICONS[name]}
  </svg>
);

// Salomlashish va unga mos osmon manzarasi
const getGreeting = (hour) => {
  if (hour >= 5 && hour < 11) return { key: "morning", scene: "sunrise", isDay: true };
  if (hour >= 11 && hour < 17) return { key: "day", scene: "clear", isDay: true };
  if (hour >= 17 && hour < 22) return { key: "evening", scene: "sunset", isDay: true };

  return { key: "night", scene: "clear", isDay: false };
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

// me - "Men kimman?"da tanlangan odam (bo'lmasa null), onWhoAmI - tanlov oynasini ochadi.
// done - bugungi "Bajardim" belgilari (null bo'lsa tugmalar ko'rinmaydi)
export const Greeting = ({
  now,
  me,
  schedules,
  loading,
  onWhoAmI,
  done,
  doneBusy,
  onDone,
  onUndo,
}) => {
  const { t, lang } = useI18n();
  const tip = TIPS[getDayOfYear(now) % TIPS.length];
  const greeting = getGreeting(now.getHours());
  const greetingText = t(`home.greeting.${greeting.key}`);

  // Shaxsiy salomlashish: ism bilan va bugun/ertaga mening vazifalarim
  const title = me
    ? t("home.greeting.titleNamed", { greeting: greetingText, name: me.name.trim() })
    : t("home.greeting.title", { greeting: greetingText });

  const getMyTasks = (schedule) =>
    me ? TASKS.filter((task) => task.isAssigned(schedule, me.user_id)) : [];

  const myDays = [
    { key: "today", tasks: getMyTasks(schedules[0]) },
    { key: "tomorrow", tasks: getMyTasks(schedules[1]) },
  ].filter((day) => day.tasks.length);

  const todayTasks = getMyTasks(schedules[0]);

  // Bugungi har bir vazifam uchun: "Bajardim" tugmasi yoki "Bajarildi" belgisi
  const renderDoneButtons = () => {
    if (!me || loading || !done || !todayTasks.length) return null;

    return (
      <div className="home__done">
        {todayTasks.map((task) => {
          const record = findDone(done, task.key, me.user_id);
          const busy = doneBusy === task.key;
          const label = t(`tasks.${task.key}.label`);

          if (record) {
            return (
              <span className="home__done-item home__done-item--done" key={task.key}>
                <span className="home__done-check" aria-hidden="true">
                  <AppIcon name="check" />
                </span>
                {t("done.doneAt", { task: label, time: formatTime(record.done_at) })}

                <button
                  type="button"
                  className="home__done-undo"
                  onClick={() => onUndo(task.key)}
                  disabled={busy}
                >
                  {t("done.undo")}
                </button>
              </span>
            );
          }

          return (
            <button
              type="button"
              className="home__done-item home__done-btn"
              key={task.key}
              onClick={() => onDone(task.key)}
              disabled={busy}
            >
              {busy ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              ) : (
                <AppIcon name="check" />
              )}
              {t("done.button", { task: label })}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMyDuties = () => {
    if (!myDays.length) return <span>{t("home.me.free")}</span>;

    return myDays.map((day) => (
      <span className="home__me-group" key={day.key}>
        <span>{t(`home.me.${day.key}`)}</span>

        {day.tasks.map((task) => (
          <span className="home__me-chip" key={task.key}>
            <TaskIcon taskKey={task.key} />
            {t(`tasks.${task.key}.label`)}
          </span>
        ))}
      </span>
    ));
  };

  return (
    <section className="home__greeting card border-0 shadow-sm mb-4 text-start">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="flex-grow-1">
            <p className="home__date mb-1">{formatLongDate(now, lang)}</p>

            <h1 className="home__title fw-bold mb-1">{title}</h1>

            {me && !loading ? (
              <div className="home__me">{renderMyDuties()}</div>
            ) : (
              <p className="home__subtitle m-0">{t("home.greeting.subtitle")}</p>
            )}

            {renderDoneButtons()}

            {onWhoAmI && (
              <button type="button" className="home__who-btn" onClick={onWhoAmI}>
                <AppIcon name="user" />
                {me ? t("whoAmI.change", { name: me.name.trim() }) : t("whoAmI.choose")}
              </button>
            )}
          </div>

          <div className="home__greeting-scene">
            <WeatherIcon type={greeting.scene} isDay={greeting.isDay} size="lg" />
          </div>
        </div>

        <div className="home__tip d-flex align-items-center gap-3">
          <span className="home__tip-badge">
            <TipIcon name={tip.icon} />
          </span>

          <div>
            <small className="home__tip-label d-flex align-items-center gap-1 mb-1">
              <TipIcon name="bulb" className="home__tip-bulb" />
              {t("home.greeting.tipLabel")}
            </small>

            <span>{t(`home.tips.${tip.icon}`)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
