import { useEffect, useRef } from "react";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { formatLongDate, getShortWeekday } from "../../utils/date";

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

export const ScheduleTable = ({
  taskKey,
  users,
  days,
  year,
  month,
  monthSchedules,
  isAssigned,
  todayDay,
  selectedDay,
  filterUserId,
  onSelectDay,
}) => {
  const { t, lang } = useI18n();

  const wrapperRef = useRef(null);

  const selectedSchedule = monthSchedules[selectedDay];
  const taskLabel = t(`tasks.${taskKey}.label`);
  const hasFilter = users.some((user) => user.user_id === filterUserId);
  const dates = days.map((day) => new Date(year, month, day));

  // Telefonda jadval tanlangan (odatda bugungi) kunga o'zi suriladi
  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper || wrapper.scrollWidth <= wrapper.clientWidth) return;

    const dayCell = wrapper.querySelector(`[data-day="${selectedDay}"]`);
    const nameCell = wrapper.querySelector(".schedule__name-cell");

    if (!dayCell) return;

    // Tanlangan kundan oldin ikki kun ham ko'rinib tursin
    const left = dayCell.offsetLeft - (nameCell?.offsetWidth ?? 0) - dayCell.offsetWidth * 2;

    wrapper.scrollTo({ left: Math.max(left, 0), behavior: "smooth" });
  }, [selectedDay, year, month]);

  // Bugun qizil, tanlangan kun ko'k, dam olish kunlari ochroq
  const getDayClass = (day, date) => {
    if (day === todayDay) return "active-user";
    if (day === selectedDay) return "schedule__cell--selected";
    if (isWeekend(date)) return "schedule__cell--weekend";

    return "";
  };

  const getRowClass = (user) => {
    if (!hasFilter) return "";

    return user.user_id === filterUserId ? "schedule__row--mine" : "schedule__row--dim";
  };

  return (
    <section className="schedule__section mb-4">
      <h3 className="schedule__title d-flex align-items-center gap-2 text-start fw-semibold m-0 mb-2">
        <TaskIcon taskKey={taskKey} size="md" />
        {t(`tasks.${taskKey}.title`)}
      </h3>

      <div className="table-responsive shadow-sm rounded" ref={wrapperRef}>
        <table className="schedule__table table table-bordered table-hover m-0">
          <thead>
            <tr>
              <th className="schedule__cell schedule__name-cell">{t("schedule.number")}</th>

              {dates.map((date, index) => {
                const day = days[index];

                return (
                  <th
                    className={`schedule__cell schedule__day-head ${getDayClass(day, date)}`}
                    key={day}
                    data-day={day}
                  >
                    <button
                      type="button"
                      className="schedule__day-btn"
                      onClick={() => onSelectDay(date)}
                      title={formatLongDate(date, lang)}
                    >
                      <span className="schedule__day-number">{day}</span>
                      <span className="schedule__weekday">{getShortWeekday(date, lang)}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.user_id} className={getRowClass(user)}>
                <th
                  className={`schedule__cell schedule__name-cell text-start ${
                    isAssigned(selectedSchedule, user.user_id) ? "active-user" : ""
                  }`}
                >
                  {index + 1}. {user.name.trim()}
                </th>

                {dates.map((date, dayIndex) => {
                  const day = days[dayIndex];
                  const assigned = isAssigned(monthSchedules[day], user.user_id);

                  return (
                    <td
                      className={`schedule__cell ${
                        assigned && day === selectedDay ? "active-user" : getDayClass(day, date)
                      }`}
                      key={day}
                      title={
                        assigned
                          ? `${formatLongDate(date, lang)} · ${taskLabel}: ${user.name.trim()}`
                          : undefined
                      }
                    >
                      {assigned && <TaskIcon taskKey={taskKey} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
