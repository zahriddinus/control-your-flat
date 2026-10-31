export const ScheduleTable = ({
  title,
  users,
  days,
  monthLabel,
  monthSchedules,
  isAssigned,
  todayDay,
  selectedDay,
}) => {
  const selectedSchedule = monthSchedules[selectedDay];

  // Bugungi kun qizil, tanlangan boshqa kun ko'k rangda belgilanadi
  const getDayClass = (day) => {
    if (day === todayDay) return "active-user";
    if (day === selectedDay) return "schedule__cell--selected";

    return "";
  };

  return (
    <section className="schedule__section mb-4">
      <h3 className="schedule__title text-primary text-start fw-semibold m-0 mb-2">{title}</h3>

      <div className="table-responsive shadow-sm rounded">
        <table className="schedule__table table table-bordered table-hover m-0">
          <thead>
            <tr>
              <th className="schedule__cell schedule__name-cell"></th>

              <th className="schedule__cell" colSpan={days.length}>
                {monthLabel}
              </th>
            </tr>

            <tr>
              <th className="schedule__cell schedule__name-cell">T/r</th>

              {days.map((day) => (
                <th className={`schedule__cell ${getDayClass(day)}`} key={day}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.user_id}>
                <th
                  className={`schedule__cell schedule__name-cell text-start ${
                    isAssigned(selectedSchedule, user.user_id) ? "active-user" : ""
                  }`}
                >
                  {index + 1}. {user.name}
                </th>

                {days.map((day) => {
                  const assigned = isAssigned(monthSchedules[day], user.user_id);

                  return (
                    <td
                      className={`schedule__cell ${
                        assigned && day === selectedDay ? "active-user" : getDayClass(day)
                      }`}
                      key={day}
                    >
                      {assigned && "✓"}
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
