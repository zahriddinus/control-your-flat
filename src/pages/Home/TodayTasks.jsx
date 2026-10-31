import { TASKS, getAssignedUsers } from "../../utils/schedule";

const getNames = (users, task, schedule) =>
  getAssignedUsers(users, task, schedule)
    .map((user) => user.name)
    .join(", ");

export const TodayTasks = ({ users, schedules, loading }) => {
  const [todaySchedule, tomorrowSchedule] = schedules;

  // Ertaga faqat kimgadir vazifa berilgan bandlar ko'rsatiladi
  const tomorrowTasks = TASKS.map((task) => ({
    task,
    names: getNames(users, task, tomorrowSchedule),
  })).filter(({ names }) => names);

  return (
    <section className="mb-4 text-start">
      <h2 className="home__section-title">Bugun kim nima qiladi?</h2>

      <div className="row g-3">
        {TASKS.map((task) => (
          <div className="col-12 col-md-4" key={task.key}>
            <div className={`home__task home__task--${task.key} card h-100 border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center gap-3">
                <span className="home__icon">{task.icon}</span>

                <div className="flex-grow-1 overflow-hidden">
                  <small className="text-muted d-block">{task.label}</small>

                  <span className="home__task-name fw-semibold">
                    {loading ? (
                      <span className="placeholder col-8"></span>
                    ) : (
                      getNames(users, task, todaySchedule) || "—"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && tomorrowTasks.length > 0 && (
        <p className="home__tomorrow mt-3 mb-0">
          <span className="fw-semibold">Ertaga: </span>

          {tomorrowTasks.map(({ task, names }) => `${task.icon} ${names}`).join("  ·  ")}
        </p>
      )}
    </section>
  );
};
