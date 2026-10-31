import { TaskIcon } from "../../components/TaskIcon";
import { addDays, formatDate, getShortWeekday } from "../../utils/date";
import { TASKS, getAssignedNames } from "../../utils/schedule";

export const WeekView = ({ users, schedules, today, loading }) => {
  const week = Array.from({ length: 7 }, (_, index) => ({
    date: addDays(today, index),
    schedule: schedules[index],
  }));

  return (
    <section className="mb-4 text-start">
      <h2 className="home__section-title">Keyingi 7 kun</h2>

      <div className="home__week">
        {week.map(({ date, schedule }, index) => (
          <div
            className={`home__day card border-0 shadow-sm ${index === 0 ? "home__day--today" : ""}`}
            key={formatDate(date)}
          >
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-baseline mb-1">
                <span className="fw-semibold">{index === 0 ? "Bugun" : getShortWeekday(date)}</span>

                <small className="text-muted">{date.getDate()}</small>
              </div>

              {loading ? (
                <span className="placeholder col-10"></span>
              ) : (
                TASKS.map((task) => {
                  const names = getAssignedNames(users, task, schedule);

                  if (!names) return null;

                  return (
                    <div
                      className={`home__day-task home__day-task--${task.key} small`}
                      key={task.key}
                      title={`${task.label}: ${names}`}
                    >
                      <TaskIcon taskKey={task.key} />

                      <span className="text-truncate">{names}</span>
                    </div>
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
