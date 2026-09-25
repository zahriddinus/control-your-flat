import "./dutiesSchedule.scss";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";
import { Loading } from "../../components/Loading";

export const DutiesSchedule = () => {
  const [monthSchedules, setMonthSchedules] = useState({});
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateRef = useRef();

  // GET USERS

  useEffect(() => {
    const getUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("duty_order", { ascending: true });

      if (error) {
        setError(error);
        return;
      }

      setData(data);
    };

    getUsers();
  }, []);

  // CURRENT DATE UPDATE

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const todayDay = currentDate.getDate();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const monthName = currentDate.toLocaleString("en-EN", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // FORMAT DATE

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  // GET MONTH SCHEDULES

  useEffect(() => {
    if (!data.length) return;

    let cancelled = false;

    const getMonthSchedules = async () => {
      try {
        // Shu oyda nechta kun borligini aniqlaymiz
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

        const currentDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

        // Barcha kunlar uchun RPC'larni parallel yuboramiz
        const results = await Promise.all(
          currentDays.map(async (day) => {
            const date = new Date(year, month, day);
            const dateString = formatDate(date);

            const { data: scheduleData, error } = await supabase.rpc("get_duty_schedule", {
              target_date: dateString,
            });

            if (error) {
              throw new Error(`Schedule error ${dateString}: ${error.message}`);
            }

            return {
              day,
              schedule: scheduleData,
            };
          })
        );

        if (cancelled) return;

        const schedules = {};

        results.forEach(({ day, schedule }) => {
          schedules[day] = schedule;
        });

        setMonthSchedules(schedules);
        setError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Month schedules error:", error);
        setError(error);
      }
    };

    getMonthSchedules();

    return () => {
      cancelled = true;
    };
  }, [year, month, data.length]);

  // TODAY SCHEDULE

  const todaySchedule = monthSchedules[todayDay];

  return (
    <div className="container">
      {data.length && !error ? (
        <div className="schedule pt-3">
          {/* NAVBATCHILIK */}
          <div>
            <h3 className="schedule__title text-primary">
              Navbatchilik kunlari {formatDate(currentDate)}
            </h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>

                    <th className="schedule__cell" colSpan={days.length}>
                      {monthName}
                    </th>
                  </tr>

                  <tr>
                    <th className="schedule__cell">T/r</th>

                    {days.map((day) => (
                      <th
                        className={`schedule__cell ${todayDay === day ? "active-user" : ""}`}
                        key={day}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`schedule__cell ${
                          todaySchedule?.duty?.user_id === user.user_id ? "active-user" : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const daySchedule = monthSchedules[day];

                        const isDutyDay = daySchedule?.duty?.user_id === user.user_id;

                        const isToday = day === todayDay;

                        return (
                          <td
                            className={`schedule__cell ${isToday && isDutyDay ? "active-user" : ""}`}
                            key={day}
                          >
                            {isDutyDay && "✓"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* MUSOR TASHLASH */}

          <div>
            <h3 className="schedule__title text-primary">
              Musor tashlash {formatDate(currentDate)}
            </h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>

                    <th className="schedule__cell" colSpan={days.length}>
                      {monthName}
                    </th>
                  </tr>

                  <tr>
                    <th className="schedule__cell">T/r</th>

                    {days.map((day) => (
                      <th
                        className={`schedule__cell ${todayDay === day ? "active-user" : ""}`}
                        key={day}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`schedule__cell ${
                          todaySchedule?.rubbish?.user_id === user.user_id ? "active-user" : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const daySchedule = monthSchedules[day];

                        const isDutyDay = daySchedule?.rubbish?.user_id === user.user_id;

                        const isToday = day === todayDay;

                        return (
                          <td
                            className={`schedule__cell ${isToday && isDutyDay ? "active-user" : ""}`}
                            key={day}
                          >
                            {isDutyDay && "✓"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* GENERALNIY UBORKA */}

          <div>
            <h3 className="schedule__title text-primary">
              Generalniy uborka {formatDate(currentDate)}
            </h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>

                    <th className="schedule__title" colSpan={days.length}>
                      {monthName}
                    </th>
                  </tr>

                  <tr>
                    <th className="schedule__cell">T/r</th>

                    {days.map((day) => (
                      <th
                        className={`schedule__cell ${todayDay === day ? "active-user" : ""}`}
                        key={day}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`schedule__cell ${
                          todaySchedule?.cleaning?.some(
                            (cleaningUser) => cleaningUser.user_id === user.user_id
                          )
                            ? "active-user"
                            : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const daySchedule = monthSchedules[day];

                        const isDutyUser = daySchedule?.cleaning?.some(
                          (cleaningUser) => cleaningUser.user_id === user.user_id
                        );

                        const isCleaningDay = daySchedule?.cleaning?.length > 0;

                        const isToday = day === todayDay;

                        return (
                          <td
                            key={day}
                            className={`schedule__cell ${isToday && isCleaningDay && isDutyUser ? "active-user" : ""}`}
                          >
                            {isCleaningDay && isDutyUser && "✓"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* SANA TANLASH */}

          <div>
            <label
              className="users__input-label p-2"
              htmlFor="selectDate"
              onClick={() => dateRef.current.showPicker()}
            >
              Sanani tanla
            </label>

            <input
              ref={dateRef}
              id="selectDate"
              className="visually-hidden"
              type="date"
              onChange={(e) => console.log(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
};
