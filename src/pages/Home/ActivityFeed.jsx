import { useEffect, useState } from "react";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { useTaskText } from "../../hooks/useTaskText";
import { Avatar } from "../../components/Avatar";
import { AppIcon } from "../../components/AppIcon";
import { fetchActivity, formatRelativeTime } from "../../utils/activity";
import { parseDate, formatLongDate } from "../../utils/date";

// Voqea turi -> belgi
const KIND_ICONS = {
  done: "check",
  joined: "user",
  resident_added: "plus",
  order_changed: "sliders",
  order_swapped: "swap",
  task_added: "plus",
  rules_changed: "sliders",
  swap_requested: "send",
  swap_accepted: "swap",
  swap_declined: "close",
};

// Uyda oxirgi bo'lgan voqealar. refreshKey o'zgarsa qayta yuklanadi
export const ActivityFeed = ({ users, refreshKey }) => {
  const { t, lang } = useI18n();
  const taskText = useTaskText();
  const { flatId, taskByKey } = useFlat();
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchActivity(flatId)
      .then((data) => !cancelled && setItems(data))
      .catch((error) => {
        console.error(error);
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [flatId, refreshKey]);

  if (!items) return null;

  const findUser = (id) => users.find((user) => user.user_id === id);
  const nameOf = (id) => findUser(id)?.name?.trim() ?? t("activity.someone");

  // O'chirilgan vazifa nomi qolmagan bo'lishi mumkin
  const taskName = (key) =>
    key && (taskByKey[key] || ["duty", "rubbish", "cleaning"].includes(key))
      ? taskText(key, "title")
      : t("activity.deletedTask");

  const dayText = (value) => (value ? formatLongDate(parseDate(value), lang) : "");

  const describe = (item) =>
    t(`activity.kinds.${item.kind}`, {
      actor: nameOf(item.actor_id),
      target: nameOf(item.target_id),
      task: taskName(item.task),
      a: item.meta?.a ?? "",
      b: item.meta?.b ?? "",
      fromDay: dayText(item.meta?.from_day),
      toDay: dayText(item.meta?.to_day),
    });

  return (
    <section className="home__activity card border-0 shadow-sm mt-4 text-start">
      <div className="card-body p-3 p-md-4">
        <h2 className="home__section-title d-flex align-items-center gap-2">
          <AppIcon name="bulb" />
          {t("activity.title")}
        </h2>

        {!items.length && <p className="text-muted small m-0">{t("activity.empty")}</p>}

        <ul className="home__activity-list list-unstyled m-0">
          {items.map((item) => (
            <li className="home__activity-item" key={item.id}>
              <span className="home__activity-avatar">
                <Avatar user={findUser(item.actor_id) ?? { name: "?" }} size="sm" />
                <span
                  className={`home__activity-kind home__activity-kind--${item.kind}`}
                  aria-hidden="true"
                >
                  <AppIcon name={KIND_ICONS[item.kind] ?? "bulb"} />
                </span>
              </span>

              <div className="flex-grow-1 overflow-hidden">
                <span className="d-block">{describe(item)}</span>
                <small className="text-muted">{formatRelativeTime(item.created_at, lang)}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
