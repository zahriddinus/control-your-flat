import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { TASKS, getAssignedNames } from "../../utils/schedule";
import { findDone } from "../../utils/done";

// done - bugungi "Bajardim" belgilari: bajargan odam ismi yonida yashil belgi chiqadi
export const TodayTasks = ({ users, schedules, loading, done }) => {
  const { t } = useI18n();
  const [todaySchedule, tomorrowSchedule] = schedules;

  // Ertaga faqat kimgadir vazifa berilgan bandlar ko'rsatiladi
  const tomorrowTasks = TASKS.map((task) => ({
    task,
    names: getAssignedNames(users, task, tomorrowSchedule),
  })).filter(({ names }) => names);

  const renderNames = (task) => {
    const assigned = users.filter((user) => task.isAssigned(todaySchedule, user.user_id));

    if (!assigned.length) return "—";

    return assigned.map((user, index) => {
      const isDone = Boolean(findDone(done, task.key, user.user_id));

      return (
        <span key={user.user_id}>
          {index > 0 && ", "}
          {user.name.trim()}

          {isDone && (
            <span className="home__task-done" title={t("done.badge")}>
              <AppIcon name="check" />
            </span>
          )}
        </span>
      );
    });
  };

  return (
    <section className="mb-4 text-start">
      <h2 className="home__section-title">{t("home.todayTitle")}</h2>

      <div className="row g-3">
        {TASKS.map((task) => (
          <div className="col-12 col-md-4" key={task.key}>
            <div className={`home__task home__task--${task.key} card h-100 border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center gap-3">
                <TaskIcon taskKey={task.key} size="lg" />

                <div className="flex-grow-1 overflow-hidden">
                  <small className="text-muted d-block">{t(`tasks.${task.key}.label`)}</small>

                  <span className="home__task-name fw-semibold">
                    {loading ? <span className="placeholder col-8"></span> : renderNames(task)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && tomorrowTasks.length > 0 && (
        <p className="home__tomorrow d-flex flex-wrap align-items-center gap-2 mt-3 mb-0">
          <span className="fw-semibold">{t("home.tomorrow")}</span>

          {tomorrowTasks.map(({ task, names }) => (
            <span className="d-inline-flex align-items-center gap-1" key={task.key}>
              <TaskIcon taskKey={task.key} />
              {names}
            </span>
          ))}
        </p>
      )}
    </section>
  );
};
