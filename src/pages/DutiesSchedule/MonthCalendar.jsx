import { TaskChip } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { addDays, formatLongDate, getShortWeekday } from "../../utils/date";
import { useFlat } from "../../context/FlatContext";
import { getAssignedNames } from "../../utils/schedule";

// Hafta kunlari nomlarini olish uchun istalgan dushanba
const SOME_MONDAY = new Date(2024, 0, 1);

// Oddiy oylik kalendar: 7 ustun (Du-Ya), har kunda kim nima qilishi
export const MonthCalendar = ({
  users,
  year,
  month,
  monthSchedules,
  todayDay,
  selectedDay,
  filterUserId,
  onSelectDay,
}) => {
  const { t, lang } = useI18n();
  const { tasks } = useFlat();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Oy qaysi hafta kunidan boshlanishiga qarab boshidagi bo'sh kataklar (dushanbadan)
  const leadingEmpty = (new Date(year, month, 1).getDay() + 6) % 7;

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    getShortWeekday(addDays(SOME_MONDAY, index), lang)
  );

  const cells = [
    ...Array(leadingEmpty).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const hasFilter = users.some((user) => user.user_id === filterUserId);

  return (
    <div className="schedule-cal shadow-sm mb-4">
      <div className="schedule-cal__grid">
        {weekdays.map((weekday, index) => (
          <div
            className={`schedule-cal__weekday ${index >= 5 ? "schedule-cal__weekday--weekend" : ""}`}
            key={weekday}
          >
            {weekday}
          </div>
        ))}

        {cells.map((day, index) => {
          if (!day) {
            return (
              <div
                className="schedule-cal__day schedule-cal__day--empty"
                key={`empty-${index}`}
                aria-hidden="true"
              ></div>
            );
          }

          const date = new Date(year, month, day);
          const schedule = monthSchedules[day];
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const isMineDay =
            hasFilter && tasks.some((task) => task.isAssigned(schedule, filterUserId));

          const dayClass = [
            "schedule-cal__day",
            weekend && "schedule-cal__day--weekend",
            day === todayDay && "schedule-cal__day--today",
            day === selectedDay && "schedule-cal__day--selected",
            isMineDay && "schedule-cal__day--mine",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              type="button"
              className={dayClass}
              key={day}
              onClick={() => onSelectDay(date)}
              title={formatLongDate(date, lang)}
              aria-pressed={day === selectedDay}
            >
              <span className="schedule-cal__number">{day}</span>

              <span className="schedule-cal__tasks">
                {tasks.map((task) => {
                  const names = getAssignedNames(users, task, schedule);

                  if (!names) return null;

                  const mine = hasFilter && task.isAssigned(schedule, filterUserId);

                  return (
                    <TaskChip
                      key={task.key}
                      taskKey={task.key}
                      names={names}
                      title={`${t(`tasks.${task.key}.label`)}: ${names}`}
                      mine={mine}
                      dim={hasFilter && !mine}
                    />
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
