import { useState } from "react";
import { addDays, formatDaysLeft, formatUzDate } from "../../utils/date";
import { TASKS } from "../../utils/schedule";

const STORAGE_KEY = "myUserId";

// Tanlangan ism brauzerda eslab qolinadi. Xotira yopiq bo'lsa ham sahifa ishlayveradi
const readSavedUserId = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const getBadgeClass = (days) => {
  if (days === 0) return "text-bg-danger";
  if (days === 1) return "text-bg-warning";

  return "text-bg-primary";
};

export const MyTurn = ({ users, schedules, today, loading }) => {
  const [userId, setUserId] = useState(readSavedUserId);

  const user = users.find((item) => item.user_id === userId);

  function handleChange(evt) {
    setUserId(evt.target.value);

    try {
      window.localStorage.setItem(STORAGE_KEY, evt.target.value);
    } catch {
      // Saqlab bo'lmasa, tanlov faqat shu sahifada qoladi
    }
  }

  return (
    <section className="home__panel card border-0 shadow-sm h-100 text-start">
      <div className="card-body">
        <h2 className="home__section-title">Mening navbatim</h2>

        <select
          className="form-select mb-2"
          value={user ? userId : ""}
          onChange={handleChange}
          aria-label="Ismingizni tanlang"
        >
          <option value="">Ismingizni tanlang...</option>

          {users.map((item) => (
            <option key={item.user_id} value={item.user_id}>
              {item.name} {item.last_name}
            </option>
          ))}
        </select>

        {!user && (
          <small className="text-muted">
            Ismingizni tanlasangiz, keyingi navbatlaringiz chiqadi.
          </small>
        )}

        {user && (
          <ul className="list-unstyled m-0">
            {TASKS.map((task) => {
              const days = schedules.findIndex((schedule) =>
                task.isAssigned(schedule, user.user_id)
              );

              return (
                <li
                  className="home__turn d-flex justify-content-between align-items-center gap-2 py-2"
                  key={task.key}
                >
                  <span>
                    {task.icon} {task.label}
                  </span>

                  {loading ? (
                    <span className="placeholder col-3"></span>
                  ) : days === -1 ? (
                    <small className="text-muted">Yaqin {schedules.length} kunda yo'q</small>
                  ) : (
                    <span className="text-end">
                      <span className={`badge ${getBadgeClass(days)}`}>{formatDaysLeft(days)}</span>

                      <small className="d-block text-muted">
                        {formatUzDate(addDays(today, days))}
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
