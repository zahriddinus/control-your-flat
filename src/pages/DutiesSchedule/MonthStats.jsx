import { Avatar } from "../../components/Avatar";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { TASKS } from "../../utils/schedule";

// Har bir xonadosh shu oyda nechta navbat olgani: rangli ustunlar ko'rinishida
export const MonthStats = ({ users, monthSchedules, filterUserId, loading }) => {
  const { t } = useI18n();

  const schedules = Object.values(monthSchedules);

  const stats = users.map((user) => {
    const counts = Object.fromEntries(
      TASKS.map((task) => [
        task.key,
        schedules.filter((schedule) => task.isAssigned(schedule, user.user_id)).length,
      ])
    );

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return { user, counts, total };
  });

  // Eng ko'p navbat olgan odamning ustuni to'liq kenglikda bo'ladi
  const maxTotal = Math.max(1, ...stats.map((stat) => stat.total));

  return (
    <section className="schedule-stats card border-0 shadow-sm mb-4">
      <div className="card-body text-start">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h3 className="schedule__title fw-semibold m-0">{t("schedule.statsTitle")}</h3>

          <div className="d-flex flex-wrap gap-3 small text-muted">
            {TASKS.map((task) => (
              <span className="d-inline-flex align-items-center gap-1" key={task.key}>
                <TaskIcon taskKey={task.key} />
                {t(`tasks.${task.key}.label`)}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="placeholder-glow m-0">
            <span className="placeholder col-12 mb-2"></span>
            <span className="placeholder col-10"></span>
          </p>
        ) : (
          <ul className="list-unstyled m-0">
            {stats.map(({ user, counts, total }) => (
              <li
                className={`schedule-stats__row ${
                  user.user_id === filterUserId ? "schedule-stats__row--mine" : ""
                }`}
                key={user.user_id}
              >
                <span className="schedule-stats__name">
                  <Avatar user={user} size="sm" />
                  <span className="text-truncate fw-semibold">{user.name.trim()}</span>
                </span>

                <span className="schedule-stats__bar">
                  {TASKS.map((task) =>
                    counts[task.key] > 0 ? (
                      <span
                        className={`schedule-stats__segment schedule-stats__segment--${task.key}`}
                        style={{ width: `${(counts[task.key] / maxTotal) * 100}%` }}
                        title={`${t(`tasks.${task.key}.label`)}: ${counts[task.key]}`}
                        key={task.key}
                      >
                        {counts[task.key]}
                      </span>
                    ) : null
                  )}
                </span>

                <span className="schedule-stats__total" title={t("schedule.statsTotal")}>
                  {total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
