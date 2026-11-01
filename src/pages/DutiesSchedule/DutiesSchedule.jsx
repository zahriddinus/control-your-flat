import "./dutiesSchedule.scss";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabese";
import { Loading } from "../../components/Loading";
import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { useMyUser } from "../../hooks/useMyUser";
import { formatDate, formatLongDate, getMonthName } from "../../utils/date";
import { TASKS, fetchSchedules } from "../../utils/schedule";
import { buildIcs, downloadFile } from "../../utils/ics";
import { ScheduleTable } from "./ScheduleTable";
import { MonthCalendar } from "./MonthCalendar";
import { MonthStats } from "./MonthStats";

// Jadval yoki kalendar: tanlov brauzerda eslab qolinadi
const VIEW_STORAGE_KEY = "scheduleView";

const readView = () => {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "calendar" ? "calendar" : "table";
  } catch {
    return "table";
  }
};

const VIEWS = [
  { value: "table", icon: "table" },
  { value: "calendar", icon: "calendar" },
];

export const DutiesSchedule = () => {
  const { t, lang } = useI18n();
  const [myUserId, setMyUserId] = useMyUser();

  const [monthSchedules, setMonthSchedules] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(readView);

  // "Kimniki" filtri. Boshida o'zim (Home'dagi "Mening navbatim" tanlovi)
  const [filterUserId, setFilterUserId] = useState(myUserId);

  // null bo'lsa bugungi kun ko'rsatiladi
  const [selectedDate, setSelectedDate] = useState(null);

  const dateRef = useRef();

  // GET USERS

  useEffect(() => {
    const getUsers = async () => {
      // Jadval va avatarlar uchun id, ism va familiya kerak
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, last_name")
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

  const monthLabel = `${getMonthName(viewDate, lang)} ${year}`;

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

  // VIEW VA FILTR

  function changeView(nextView) {
    setView(nextView);

    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // Saqlab bo'lmasa, tanlov faqat shu sahifada qoladi
    }
  }

  function handleFilterChange(evt) {
    const userId = evt.target.value;

    setFilterUserId(userId);

    // Ism tanlansa, Home'dagi "Mening navbatim" ham shu odamni eslab qoladi
    if (userId) setMyUserId(userId);
  }

  const filterUser = data.find((user) => user.user_id === filterUserId);

  // KALENDARGA QO'SHISH (.ics)

  const myEvents = filterUser
    ? days.flatMap((day) =>
        TASKS.filter((task) => task.isAssigned(monthSchedules[day], filterUserId)).map((task) => ({
          day,
          task,
        }))
      )
    : [];

  function handleDownloadIcs() {
    const events = myEvents.map(({ day, task }) => ({
      date: new Date(year, month, day),
      taskKey: task.key,
      title: t(`schedule.ics.${task.key}`),
      reminder: t("schedule.ics.reminder", { task: t(`tasks.${task.key}.label`) }),
    }));

    const content = buildIcs({
      calendarName: t("schedule.ics.calendarName"),
      events,
      userId: filterUserId,
    });

    const monthNumber = String(month + 1).padStart(2, "0");

    downloadFile(content, `control-your-flat-${year}-${monthNumber}.ics`, "text/calendar");
  }

  const icsTitle = !filterUser
    ? t("schedule.ics.needUser")
    : !myEvents.length && !schedulesLoading
      ? t("schedule.ics.empty")
      : t("schedule.ics.button");

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
        <div className="alert alert-danger">{t("schedule.loadError")}</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="container pt-3">
        <div className="alert alert-info">{t("common.noUsers")}</div>
      </div>
    );
  }

  const viewProps = {
    users: data,
    year,
    month,
    monthSchedules,
    todayDay,
    selectedDay,
    filterUserId,
    onSelectDay: selectDate,
  };

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
              aria-label={t("schedule.prevMonth")}
            >
              ‹
            </button>

            <h2 className="schedule__month m-0 fw-semibold">{monthLabel}</h2>

            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => changeMonth(1)}
              aria-label={t("schedule.nextMonth")}
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
              {t("common.today")}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={openDatePicker}
            >
              {t("schedule.pickDate")}
            </button>

            <input
              ref={dateRef}
              className="visually-hidden"
              type="date"
              aria-label={t("schedule.pickDate")}
              value={formatDate(viewDate)}
              onChange={handleDateChange}
            />
          </div>
        </div>

        {/* KO'RINISH, FILTR VA KALENDARGA QO'SHISH */}

        <div className="schedule__toolbar d-flex flex-wrap align-items-center gap-2 mb-4">
          <div className="btn-group btn-group-sm" role="group" aria-label={t("schedule.viewLabel")}>
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`btn d-inline-flex align-items-center gap-1 ${
                  view === option.value ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => changeView(option.value)}
                aria-pressed={view === option.value}
              >
                <AppIcon name={option.icon} />
                {option.value === "table" ? t("schedule.viewTable") : t("schedule.viewCalendar")}
              </button>
            ))}
          </div>

          <select
            className="schedule__filter form-select form-select-sm"
            value={filterUser ? filterUserId : ""}
            onChange={handleFilterChange}
            aria-label={t("schedule.filterLabel")}
          >
            <option value="">
              {t("schedule.filterLabel")}: {t("schedule.filterAll")}
            </option>

            {data.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name.trim()} {user.last_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="schedule__ics-btn btn btn-sm d-inline-flex align-items-center gap-1 ms-md-auto"
            onClick={handleDownloadIcs}
            disabled={!filterUser || schedulesLoading || !myEvents.length}
            title={icsTitle}
          >
            <AppIcon name="calendarPlus" />
            {t("schedule.ics.button")}

            {filterUser && myEvents.length > 0 && (
              <span className="badge rounded-pill text-bg-light">{myEvents.length}</span>
            )}
          </button>
        </div>

        {/* TANLANGAN KUN XULOSASI */}

        <h3 className="schedule__summary-title text-start fw-semibold mb-2">
          {isTodaySelected ? t("common.today") : t("schedule.selectedDay")}:{" "}
          {formatLongDate(viewDate, lang)}
        </h3>

        <div className="row g-3 mb-4">
          {TASKS.map((task) => {
            const names = getAssignedNames(task);

            return (
              <div className="col-12 col-md-4" key={task.key}>
                <div
                  className={`schedule__summary schedule__summary--${task.key} card h-100 border-0 shadow-sm`}
                >
                  <div className="card-body d-flex align-items-center gap-3 text-start">
                    <TaskIcon taskKey={task.key} size="md" />

                    <div className="overflow-hidden">
                      <small className="text-muted">{t(`tasks.${task.key}.label`)}</small>

                      <p className="schedule__summary-name m-0 fw-semibold">
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
              </div>
            );
          })}
        </div>

        {scheduleError && <div className="alert alert-danger">{t("schedule.schedulesError")}</div>}

        {schedulesLoading && (
          <div className="d-flex align-items-center gap-2 text-primary mb-3">
            <div className="spinner-border spinner-border-sm" role="status"></div>
            <span>{t("schedule.schedulesLoading")}</span>
          </div>
        )}

        {/* JADVAL YOKI KALENDAR */}

        {view === "calendar" ? (
          <MonthCalendar {...viewProps} />
        ) : (
          TASKS.map((task) => (
            <ScheduleTable
              key={task.key}
              taskKey={task.key}
              days={days}
              isAssigned={task.isAssigned}
              {...viewProps}
            />
          ))
        )}

        {/* OYLIK STATISTIKA */}

        <MonthStats
          users={data}
          monthSchedules={monthSchedules}
          filterUserId={filterUserId}
          loading={schedulesLoading}
        />
      </div>
    </div>
  );
};
