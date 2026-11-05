import { TaskChip } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { addDays, formatDate, getShortWeekday } from "../../utils/date";
import { useFlat } from "../../context/FlatContext";
import { getAssignedNames } from "../../utils/schedule";

export const WeekView = ({ users, schedules, today, loading }) => {
  const { t, lang } = useI18n();
  const { tasks } = useFlat();
  const week = Array.from({ length: 7 }, (_, index) => ({
    date: addDays(today, index),
    schedule: schedules[index],
  }));

  return (
    <section className="mb-4 text-start">
      <h2 className="home__section-title">{t("home.week.title")}</h2>

      <div className="home__week">
        {week.map(({ date, schedule }, index) => (
          <div
            className={`home__day card border-0 shadow-sm ${index === 0 ? "home__day--today" : ""}`}
            key={formatDate(date)}
          >
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-baseline mb-1">
                <span className="fw-semibold">
                  {index === 0 ? t("common.today") : getShortWeekday(date, lang)}
                </span>

                <small className="text-muted">{date.getDate()}</small>
              </div>

              {loading ? (
                <span className="placeholder col-10"></span>
              ) : (
                tasks.map((task) => {
                  const names = getAssignedNames(users, task, schedule);

                  if (!names) return null;

                  return (
                    <TaskChip
                      key={task.key}
                      taskKey={task.key}
                      names={names}
                      title={`${t(`tasks.${task.key}.label`)}: ${names}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
