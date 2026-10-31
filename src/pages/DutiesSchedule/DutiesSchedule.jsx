import "./dutiesSchedule.scss";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";
import { Loading } from "../../components/Loading";
import { ScheduleTable } from "./ScheduleTable";
import { formatDate } from "../../utils/date";
import { TASKS, fetchSchedules } from "../../utils/schedule";

export const DutiesSchedule = () => {
  const [monthSchedules, setMonthSchedules] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // null bo'lsa bugungi kun ko'rsatiladi
  const [selectedDate, setSelectedDate] = useState(null);

  const dateRef = useRef();

  // GET USERS

  useEffect(() => {
    const getUsers = async () => {
      // Jadval uchun faqat id va ism kerak
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name")
        .order("duty_order", { ascending: true });

      if (error) {
        console.error(error);
        setError(error);
      } else {
        setData(data);
      }

      setLoading(false);
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

  const viewDate = selectedDate ?? currentDate;
  const isTodaySelected = selectedDate === null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const selectedDay = viewDate.getDate();

  const isCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth();
  const todayDay = isCurrentMonth ? currentDate.getDate() : null;

  const monthName = viewDate.toLocaleString("en-US", { month: "long" });
  const monthLabel = `${monthName} ${year}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // GET MONTH SCHEDULES

  useEffect(() => {
    if (!data.length) return;

    let cancelled = false;

    const getMonthSchedules = async () => {
      setSchedulesLoading(true);
      setMonthSchedules({});

      try {
        // Shu oyda nechta kun borligini aniqlaymiz
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

        const currentDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

        // Barcha kunlar uchun RPC'larni parallel yuboramiz
        const results = await fetchSchedules(currentDays.map((day) => new Date(year, month, day)));

        if (cancelled) return;

        const schedules = {};

        results.forEach((schedule, index) => {
          schedules[currentDays[index]] = schedule;
        });

        setMonthSchedules(schedules);
        setScheduleError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Month schedules error:", error);
        setScheduleError(error);
      } finally {
        if (!cancelled) {
          setSchedulesLoading(false);
        }
      }
    };

    getMonthSchedules();

    return () => {
      cancelled = true;
    };
  }, [year, month, data.length]);

  // DATE CONTROLS

  function selectDate(date) {
    // Bugun tanlansa, sana yana avtomatik yangilanib turadi
    setSelectedDate(formatDate(date) === formatDate(currentDate) ? null : date);
  }

  function changeMonth(offset) {
    const nextMonth = new Date(year, month + offset, 1);
    const isNextCurrentMonth =
      nextMonth.getFullYear() === currentDate.getFullYear() &&
      nextMonth.getMonth() === currentDate.getMonth();

    selectDate(isNextCurrentMonth ? currentDate : nextMonth);
  }

  function handleDateChange(evt) {
    if (!evt.target.value) return;

    const [y, m, d] = evt.target.value.split("-").map(Number);

    selectDate(new Date(y, m - 1, d));
  }

  function openDatePicker() {
    try {
      dateRef.current?.showPicker();
    } catch {
      dateRef.current?.focus();
    }
  }

  // SELECTED DAY SUMMARY

  const selectedSchedule = monthSchedules[selectedDay];

  const getAssignedNames = (task) =>
    data
      .filter((user) => task.isAssigned(selectedSchedule, user.user_id))
      .map((user) => user.name.trim());

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container pt-3">
        <div className="alert alert-danger">
          Jadvalni yuklab bo'lmadi. Sahifani yangilab ko'ring.
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="container pt-3">
        <div className="alert alert-info">Hozircha foydalanuvchilar yo'q.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="schedule py-3 py-md-4">
        {/* SANA BOSHQARUVI */}

        <div className="schedule__controls d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Oldingi oy"
            >
              ‹
            </button>

            <h2 className="schedule__month m-0 fw-semibold">{monthLabel}</h2>

            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Keyingi oy"
            >
              ›
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => setSelectedDate(null)}
              disabled={isTodaySelected}
            >
              Bugun
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={openDatePicker}
            >
              Sanani tanla
            </button>

            <input
              ref={dateRef}
              className="visually-hidden"
              type="date"
              aria-label="Sanani tanla"
              value={formatDate(viewDate)}
              onChange={handleDateChange}
            />
          </div>
        </div>

        {/* TANLANGAN KUN XULOSASI */}

        <h3 className="schedule__summary-title text-start fw-semibold mb-2">
          {isTodaySelected ? "Bugun" : "Tanlangan kun"}: {formatDate(viewDate)}
        </h3>

        <div className="row g-3 mb-4">
          {TASKS.map((task) => {
            const names = getAssignedNames(task);

            return (
              <div className="col-12 col-md-4" key={task.key}>
                <div
                  className={`schedule__summary schedule__summary--${task.key} card h-100 border-0 shadow-sm`}
                >
                  <div className="card-body text-start">
                    <small className="text-muted">{task.label}</small>

                    <p className="schedule__summary-name m-0 mt-1 fw-semibold">
                      {schedulesLoading ? (
                        <span className="placeholder col-6"></span>
                      ) : names.length ? (
                        names.join(", ")
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {scheduleError && (
          <div className="alert alert-danger">
            Navbatlarni yuklab bo'lmadi. Sahifani yangilab ko'ring.
          </div>
        )}

        {schedulesLoading && (
          <div className="d-flex align-items-center gap-2 text-primary mb-3">
            <div className="spinner-border spinner-border-sm" role="status"></div>
            <span>Navbatlar yuklanmoqda...</span>
          </div>
        )}

        {/* JADVALLAR */}

        {TASKS.map((task) => (
          <ScheduleTable
            key={task.key}
            title={task.title}
            users={data}
            days={days}
            monthLabel={monthLabel}
            monthSchedules={monthSchedules}
            isAssigned={task.isAssigned}
            todayDay={todayDay}
            selectedDay={selectedDay}
          />
        ))}
      </div>
    </div>
  );
};
