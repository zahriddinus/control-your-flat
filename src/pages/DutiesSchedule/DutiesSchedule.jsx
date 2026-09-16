import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";

export const DutiesSchedule = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateRef = useRef();

  useEffect(() => {
    const getUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");

      if (error) {
        setError(error);
        return;
      }

      setData(data);
    };

    getUsers();
  }, []);

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

  const todayUserIndexDuty = (todayDay - 1) % data.length;

  const todayUserIndexRubbish = Math.floor((todayDay - 1) / 3) % data.length;

  const startDate = new Date(2026, 8, 1);

  const getDaysFromStart = (date) => Math.floor((date - startDate) / (1000 * 60 * 60 * 24));

  const getCleaningInfo = (day) => {
    const date = new Date(year, month, day);
    const daysFromStart = getDaysFromStart(date);

    if (daysFromStart < 0) {
      return {
        isCleaningDay: false,
        firstUser: null,
        secondUser: null,
      };
    }

    const group = Math.floor(daysFromStart / 7);

    return {
      isCleaningDay: daysFromStart % 7 === 0,
      firstUser: (group * 2) % data.length,
      secondUser: (group * 2 + 1) % data.length,
    };
  };

  const todayCleaning = getCleaningInfo(todayDay);

  return (
    <div className="container">
      {!error ? (
        <div>
          {/* Navbatchi */}
          <div>
            <h3>Navbatchilik kunlari</h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>
                    <th colSpan={days.length}>{monthName}</th>
                  </tr>

                  <tr>
                    <th>T/r</th>

                    {days.map((day) => (
                      <th className={todayDay === day ? "active-user" : ""} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${
                          index === todayUserIndexDuty ? "active-user" : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const userIndex = (day - 1) % data.length;

                        const isDutyDay = userIndex === index;
                        const isToday = day === todayDay;

                        return (
                          <td className={isToday && isDutyDay ? "active-user" : ""} key={day}>
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

          {/* Musor tashlash */}
          <div>
            <h3>Musor tashlash</h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>
                    <th colSpan={days.length}>{monthName}</th>
                  </tr>

                  <tr>
                    <th>T/r</th>

                    {days.map((day) => (
                      <th className={todayDay === day ? "active-user" : ""} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${
                          index === todayUserIndexRubbish ? "active-user" : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const userIndex = Math.floor((day - 1) / 3) % data.length;

                        const isDutyDay = userIndex === index && (day - 1) % 3 === 0;

                        const isToday = day === todayDay;

                        return (
                          <td
                            className={isToday && userIndex === index ? "active-user" : ""}
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

          {/* Generalniy uborka */}
          <div>
            <h3>Generalniy uborka</h3>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th></th>
                    <th colSpan={days.length}>{monthName}</th>
                  </tr>

                  <tr>
                    <th>T/r</th>

                    {days.map((day) => (
                      <th className={todayDay === day ? "active-user" : ""} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${
                          index === todayCleaning.firstUser || index === todayCleaning.secondUser
                            ? "active-user"
                            : ""
                        } text-start`}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const cleaning = getCleaningInfo(day);

                        const isDutyUser =
                          index === cleaning.firstUser || index === cleaning.secondUser;

                        const isToday = day === todayDay;

                        return (
                          <td
                            key={day}
                            className={
                              isToday && cleaning.isCleaningDay && isDutyUser ? "active-user" : ""
                            }
                          >
                            {cleaning.isCleaningDay && isDutyUser && "✓"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sana tanlash */}
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
        <h1>Loading...</h1>
      )}
    </div>
  );
};
