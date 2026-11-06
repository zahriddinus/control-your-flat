import { useI18n } from "../../i18n";
import { useTaskText } from "../../hooks/useTaskText";
import { addDays, formatDaysLeft, formatLongDate } from "../../utils/date";
import { useFlat } from "../../context/FlatContext";
import { TaskIcon } from "../../components/TaskIcon";

const getBadgeClass = (days) => {
  if (days === 0) return "text-bg-danger";
  if (days === 1) return "text-bg-warning";

  return "text-bg-primary";
};

// userId va onUserChange Home'dan keladi: salomlashish ham shu tanlovga qaraydi
export const MyTurn = ({ users, schedules, today, loading, userId, onUserChange }) => {
  const { t, lang } = useI18n();
  const taskText = useTaskText();
  const { tasks } = useFlat();

  const user = users.find((item) => item.user_id === userId);

  function handleChange(evt) {
    onUserChange(evt.target.value);
  }

  return (
    <section className="home__panel card border-0 shadow-sm h-100 text-start">
      <div className="card-body">
        <h2 className="home__section-title">{t("home.myTurn.title")}</h2>

        <select
          className="form-select mb-2"
          value={user ? userId : ""}
          onChange={handleChange}
          aria-label={t("home.myTurn.selectAria")}
        >
          <option value="">{t("home.myTurn.select")}</option>

          {users.map((item) => (
            <option key={item.user_id} value={item.user_id}>
              {item.name} {item.last_name}
            </option>
          ))}
        </select>

        {!user && <small className="text-muted">{t("home.myTurn.hint")}</small>}

        {user && (
          <ul className="list-unstyled m-0">
            {tasks.map((task) => {
              const days = schedules.findIndex((schedule) =>
                task.isAssigned(schedule, user.user_id)
              );

              return (
                <li
                  className="home__turn d-flex justify-content-between align-items-center gap-2 py-2"
                  key={task.key}
                >
                  <span className="d-flex align-items-center gap-2">
                    <TaskIcon taskKey={task.key} size="md" />
                    {taskText(task.key, "label")}
                  </span>

                  {loading ? (
                    <span className="placeholder col-3"></span>
                  ) : days === -1 ? (
                    <small className="text-muted">
                      {t("home.myTurn.notSoon", { count: schedules.length })}
                    </small>
                  ) : (
                    <span className="text-end">
                      <span className={`badge ${getBadgeClass(days)}`}>
                        {formatDaysLeft(days, t)}
                      </span>

                      <small className="d-block text-muted">
                        {formatLongDate(addDays(today, days), lang)}
                      </small>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
