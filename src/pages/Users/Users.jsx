import './users.scss';
import { useRef } from 'react';
import { supabase } from '../../lib/supabese';

const { data, error } = await supabase.from('users').select('*');

console.log('DATA:', data);
console.log('ERROR:', error);

export const Users = () => {
  const dateRef = useRef();

  const today = new Date();
  const todayDay = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  const todayUserIndexDuty = (todayDay - 1) % data.length;
  const todayUserIndexRubbish = Math.floor((todayDay - 1) / 3) % data.length;

  const dutyGroup = Math.ceil((todayDay - 1) / data.length);
  const firstUserIndex = (dutyGroup * 2) % data.length;
  const secondUserIndex = (dutyGroup * 2 + 1) % data.length;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

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
                    <th colSpan={days.length}>August</th>
                  </tr>
                  <tr>
                    <th>T/r</th>
                    {days.map((day) => (
                      <th className={todayDay === day ? 'active-user' : ''} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${index === todayUserIndexDuty ? 'active-user' : ''} text-start `}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const userIndex = (day - 1) % data.length;
                        const isDutyDay = userIndex === index;
                        const isToday = day === todayDay;

                        return (
                          <td className={isToday && isDutyDay ? 'active-user' : ''} key={day}>
                            {userIndex === index && '✓'}
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
                    <th colSpan={days.length}>August</th>
                  </tr>
                  <tr>
                    <th>T/r</th>
                    {days.map((day) => (
                      <th className={todayDay === day ? 'active-user' : ''} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${index === todayUserIndexRubbish ? 'active-user' : ''} text-start `}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const userIndex = Math.floor((day - 1) / 3) % data.length;
                        const isDutyDayActive = userIndex === index;
                        const isToday = day === todayDay;

                        const dutyUserIndex = Math.floor((day - 1) / 3) % data.length;
                        const isDutyDay = dutyUserIndex === index && (day - 1) % 3 === 0;

                        return (
                          <td className={isToday && isDutyDayActive ? 'active-user' : ''} key={day}>
                            {isDutyDay && '✓'}
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
                    <th colSpan={days.length}>August</th>
                  </tr>
                  <tr>
                    <th>T/r</th>
                    {days.map((day) => (
                      <th className={todayDay === day ? 'active-user' : ''} key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((user, index) => (
                    <tr key={user.user_id}>
                      <th
                        className={`${index === firstUserIndex || index === secondUserIndex ? 'active-user' : ''} text-start `}
                      >
                        {index + 1}.{user.name}
                      </th>

                      {days.map((day) => {
                        const dutyGroup = Math.ceil((day - 1) / data.length);
                        const firstUserIndex = (dutyGroup * 2) % data.length;
                        const secondUserIndex = (dutyGroup * 2 + 1) % data.length;
                        const isDutyDay =
                          (day - 1) % data.length === 0 &&
                          (index === firstUserIndex || index === secondUserIndex);

                        const isToday = day === todayDay;
                        const isTodayDutyUser =
                          index === firstUserIndex || index === secondUserIndex;

                        return (
                          <td key={day} className={isToday && isTodayDutyUser ? 'active-user' : ''}>
                            {isDutyDay && '✓'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
              onChange={(evt) => console.log(evt.target.value)}
            />
          </div>
        </div>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
};
