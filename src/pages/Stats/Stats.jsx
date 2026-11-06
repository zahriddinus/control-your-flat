import "./stats.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { useTaskText } from "../../hooks/useTaskText";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";
import { TaskIcon } from "../../components/TaskIcon";
import { PageSkeleton } from "../../components/Skeleton";
import { ErrorState } from "../../components/EmptyState";
import { addDays, formatDate, getShortMonth, parseDate } from "../../utils/date";
import { fetchSchedules } from "../../utils/schedule";
import { DONE_TRACKING_START } from "../../utils/done";

// Grafik o'lchamlari (SVG koordinatalarida)
const CHART_HEIGHT = 180;
const BAR_GAP = 8;

// Yil bo'yicha navbatlar: uy boshlangan kundan (yoki 1-yanvardan) bugungacha
export const Stats = () => {
  const { t, lang } = useI18n();
  const taskText = useTaskText();
  const { flat, flatId, tasks } = useFlat();

  const thisYear = new Date().getFullYear();
  const startYear = Number(flat.start_date.slice(0, 4));
  const years = Array.from({ length: thisYear - startYear + 1 }, (_, index) => thisYear - index);

  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setData(null);
      setError(null);

      const todayKey = formatDate(new Date());
      const from = [`${year}-01-01`, flat.start_date].sort().at(-1);
      const to = [`${year}-12-31`, todayKey].sort()[0];

      if (from > to) {
        setData({ days: [], done: [] });
        return;
      }

      try {
        const dates = [];

        for (let day = parseDate(from); formatDate(day) <= to; day = addDays(day, 1)) {
          dates.push(day);
        }

        const [schedules, doneResult, usersResult] = await Promise.all([
          fetchSchedules(flatId, dates),
          supabase
            .from("duty_done")
            .select("day, task, user_id")
            .eq("flat_id", flatId)
            .gte("day", from)
            .lte("day", to),
          supabase
            .from("users")
            .select("user_id, name, last_name, avatar_color, duty_order")
            .eq("flat_id", flatId)
            .order("duty_order", { ascending: true }),
        ]);

        if (doneResult.error) throw doneResult.error;
        if (usersResult.error) throw usersResult.error;
        if (cancelled) return;

        setData({
          days: dates.map((date, index) => ({ date, schedule: schedules[index] })),
          done: doneResult.data,
          users: usersResult.data,
        });
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError(loadError);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [flatId, flat.start_date, year]);

  // Oylar bo'yicha jami navbatlar va har bir xonadosh/vazifa bo'yicha hisob
  const stats = useMemo(() => {
    if (!data?.users) return null;

    const months = Array.from({ length: 12 }, () => 0);
    const people = Object.fromEntries(
      data.users.map((user) => [user.user_id, { user, total: 0, byTask: {}, done: 0, tracked: 0 }])
    );

    data.days.forEach(({ date, schedule }) => {
      const dayKey = formatDate(date);

      tasks.forEach((task) => {
        data.users.forEach((user) => {
          if (!task.isAssigned(schedule, user.user_id)) return;

          const person = people[user.user_id];

          months[date.getMonth()] += 1;
          person.total += 1;
          person.byTask[task.key] = (person.byTask[task.key] ?? 0) + 1;

          // Bajarilganlik foizi faqat belgilar boshlangan kundan hisoblanadi
          if (dayKey >= DONE_TRACKING_START) person.tracked += 1;
        });
      });
    });

    data.done.forEach((record) => {
      if (people[record.user_id]) people[record.user_id].done += 1;
    });

    const list = Object.values(people).sort((a, b) => b.total - a.total || b.done - a.done);

    return {
      months,
      list,
      total: months.reduce((sum, value) => sum + value, 0),
      done: data.done.length,
      best: [...list].sort((a, b) => b.done - a.done)[0],
    };
  }, [data, tasks]);

  if (error) {
    return (
      <div className="container pt-3">
        <ErrorState text={t("common.loadError")} />
      </div>
    );
  }

  if (!stats) return <PageSkeleton variant="schedule" />;

  const maxMonth = Math.max(1, ...stats.months);
  const barWidth = (600 - BAR_GAP * 11) / 12;

  return (
    <div className="stats container py-3 py-md-4 text-start">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="stats__title d-flex align-items-center gap-2 m-0">
          <span className="stats__title-icon" aria-hidden="true">
            <AppIcon name="chart" />
          </span>
          {t("stats.title")}
        </h1>

        {years.length > 1 && (
          <select
            className="form-select form-select-sm w-auto"
            value={year}
            onChange={(evt) => setYear(Number(evt.target.value))}
            aria-label={t("stats.year")}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ASOSIY RAQAMLAR */}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="stats__tile card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted d-block">{t("stats.total")}</small>
              <span className="stats__number">{stats.total}</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-sm-4">
          <div className="stats__tile card border-0 shadow-sm h-100">
            <div className="card-body">
              <small className="text-muted d-block">{t("stats.done")}</small>
              <span className="stats__number">{stats.done}</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-sm-4">
          <div className="stats__tile card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-2">
              {stats.best?.done > 0 ? (
                <>
                  <Avatar user={stats.best.user} size="sm" />
                  <div className="overflow-hidden">
                    <small className="text-muted d-block">{t("stats.best")}</small>
                    <span className="fw-bold text-truncate d-block">
                      {stats.best.user.name.trim()}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <small className="text-muted d-block">{t("stats.best")}</small>
                  <span className="fw-bold">—</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OYLAR BO'YICHA GRAFIK (bitta qator - legenda shart emas, sarlavha nomlaydi) */}

      <section className="stats__section card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <h2 className="stats__section-title">{t("stats.byMonth")}</h2>

          <div className="stats__chart">
            <svg
              viewBox={`0 0 600 ${CHART_HEIGHT + 24}`}
              role="img"
              aria-label={t("stats.byMonth")}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Yengil yo'riq chiziqlari */}
              {[0.5, 1].map((part) => (
                <line
                  key={part}
                  className="stats__grid"
                  x1="0"
                  x2="600"
                  y1={CHART_HEIGHT - CHART_HEIGHT * part}
                  y2={CHART_HEIGHT - CHART_HEIGHT * part}
                />
              ))}

              <line
                className="stats__baseline"
                x1="0"
                x2="600"
                y1={CHART_HEIGHT}
                y2={CHART_HEIGHT}
              />

              {stats.months.map((value, month) => {
                const height = (value / maxMonth) * (CHART_HEIGHT - 8);
                const x = month * (barWidth + BAR_GAP);
                const label = getShortMonth(new Date(year, month, 1), lang);

                return (
                  <g
                    key={month}
                    onMouseEnter={() => setHovered(month)}
                    onFocus={() => setHovered(month)}
                    onBlur={() => setHovered(null)}
                    tabIndex={0}
                    aria-label={`${label}: ${value}`}
                  >
                    {/* Kursor uchun kengroq maydon */}
                    <rect x={x} y="0" width={barWidth} height={CHART_HEIGHT} fill="transparent" />

                    {value > 0 && (
                      <path
                        className={`stats__bar ${hovered === month ? "active" : ""}`}
                        d={`M${x},${CHART_HEIGHT} V${CHART_HEIGHT - height + 4} q0,-4 4,-4 H${x + barWidth - 4} q4,0 4,4 V${CHART_HEIGHT} Z`}
                      />
                    )}

                    <text
                      className="stats__axis"
                      x={x + barWidth / 2}
                      y={CHART_HEIGHT + 17}
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hovered !== null && (
              <div
                className="stats__tooltip"
                style={{ left: `${((hovered + 0.5) / 12) * 100}%` }}
                role="status"
              >
                <strong>{getShortMonth(new Date(year, hovered, 1), lang)}</strong>
                <span>{t("stats.turns", { count: stats.months[hovered] })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* XONADOSHLAR BO'YICHA (jadval - har bir raqam ko'rinadi) */}

      <section className="stats__section card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <h2 className="stats__section-title">{t("stats.byPerson")}</h2>

          <div className="table-responsive">
            <table className="stats__table table align-middle m-0">
              <thead>
                <tr>
                  <th>{t("stats.person")}</th>
                  {tasks.map((task) => (
                    <th key={task.key} className="text-center" title={taskText(task.key, "title")}>
                      <TaskIcon taskKey={task.key} />
                    </th>
                  ))}
                  <th className="text-center">{t("stats.totalShort")}</th>
                  <th>{t("stats.doneRate")}</th>
                </tr>
              </thead>

              <tbody>
                {stats.list.map((person) => {
                  const rate = person.tracked
                    ? Math.round((person.done / person.tracked) * 100)
                    : null;

                  return (
                    <tr key={person.user.user_id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar user={person.user} size="sm" />
                          <span className="fw-semibold">{person.user.name.trim()}</span>
                        </div>
                      </td>

                      {tasks.map((task) => (
                        <td key={task.key} className="text-center">
                          {person.byTask[task.key] ?? 0}
                        </td>
                      ))}

                      <td className="text-center fw-bold">{person.total}</td>

                      <td className="stats__rate-cell">
                        {rate === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <div className="stats__rate" aria-hidden="true">
                              <span style={{ width: `${Math.min(100, rate)}%` }}></span>
                            </div>
                            <small className="text-muted text-nowrap">
                              {person.done}/{person.tracked} · {rate}%
                            </small>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <small className="text-muted d-block mt-2">{t("stats.doneHint")}</small>
        </div>
      </section>
    </div>
  );
};
