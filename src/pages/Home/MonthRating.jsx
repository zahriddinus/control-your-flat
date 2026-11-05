import { useEffect, useState } from "react";
import { Avatar } from "../../components/Avatar";
import { AppIcon } from "../../components/AppIcon";
import { useI18n } from "../../i18n";
import { addDays, formatDate, getMonthName, parseDate } from "../../utils/date";
import { fetchSchedules, TASKS } from "../../utils/schedule";
import { DONE_TRACKING_START, fetchDone, findDone } from "../../utils/done";

// Bootstrap Icons: kubok
const TROPHY_PATH =
  "M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935";

const Trophy = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d={TROPHY_PATH} />
  </svg>
);

// O'tgan kunlardagi har bir navbat hisoblanadi. Bugungisi faqat bajarilgan bo'lsa qo'shiladi,
// shunda kun tugamasdan hech kim "qoldirdi" bo'lib qolmaydi
const buildStats = (users, days, todayKey) =>
  users
    .map((user) => {
      let assigned = 0;
      let done = 0;

      days.forEach(({ date, schedule, records }) => {
        TASKS.forEach((task) => {
          if (!task.isAssigned(schedule, user.user_id)) return;

          const isDone = Boolean(findDone(records, task.key, user.user_id));

          if (date === todayKey && !isDone) return;

          assigned += 1;
          if (isDone) done += 1;
        });
      });

      return {
        user,
        assigned,
        done,
        percent: assigned ? Math.round((done / assigned) * 100) : 0,
      };
    })
    .sort((a, b) => b.done - a.done || b.percent - a.percent || a.assigned - b.assigned);

// Shu oy bo'yicha kim nechta navbatni bajargani. doneToday - bugungi belgilar (jonli yangilanadi)
export const MonthRating = ({ users, today, doneToday }) => {
  const { t, lang } = useI18n();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(false);

  const todayKey = formatDate(today);
  const monthStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const from = monthStart > DONE_TRACKING_START ? monthStart : DONE_TRACKING_START;

  // O'tgan kunlar: navbatlar va belgilar bir marta yuklanadi
  useEffect(() => {
    if (from > todayKey) return;

    let cancelled = false;

    const load = async () => {
      try {
        const dates = [];

        for (let day = parseDate(from); formatDate(day) <= todayKey; day = addDays(day, 1)) {
          dates.push(day);
        }

        const yesterday = formatDate(addDays(parseDate(todayKey), -1));

        const [schedules, records] = await Promise.all([
          fetchSchedules(dates),
          from <= yesterday ? fetchDone(from, yesterday) : [],
        ]);

        if (cancelled) return;

        setHistory(
          dates.map((date, index) => {
            const key = formatDate(date);

            return {
              date: key,
              schedule: schedules[index],
              records: (records ?? []).filter((record) => record.day === key),
            };
          })
        );
      } catch (loadError) {
        console.error("Rating error:", loadError);
        if (!cancelled) setError(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [from, todayKey]);

  if (error || from > todayKey) return null;

  // Bugungi kun yozuvlari prop'dan olinadi, shunda "Bajardim" darhol reytingda ko'rinadi
  const days = history?.map((day) =>
    day.date === todayKey ? { ...day, records: doneToday ?? [] } : day
  );

  const stats = days ? buildStats(users, days, todayKey) : [];
  const bestDone = stats[0]?.done ?? 0;
  const hasData = stats.some((stat) => stat.assigned > 0);

  return (
    <section className="home__rating card border-0 shadow-sm mt-4 text-start">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="home__rating-icon" aria-hidden="true">
            <Trophy />
          </span>

          <h2 className="home__section-title m-0">
            {t("rating.title", { month: getMonthName(today, lang) })}
          </h2>
        </div>

        <p className="text-muted small mb-3">{t("rating.subtitle")}</p>

        {!days && (
          <div className="d-flex flex-column gap-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span className="placeholder placeholder-lg col-12 rounded-3" key={index}></span>
            ))}
          </div>
        )}

        {days && !hasData && <p className="home__rating-empty m-0">{t("rating.empty")}</p>}

        {days && hasData && (
          <ol className="home__rating-list list-unstyled m-0">
            {stats.map((stat, index) => {
              const isBest = bestDone > 0 && stat.done === bestDone;
              const isPerfect = stat.assigned > 0 && stat.done === stat.assigned;

              return (
                <li className="home__rating-row" key={stat.user.user_id}>
                  <span className={`home__rating-place home__rating-place--${index + 1}`}>
                    {index + 1}
                  </span>

                  <Avatar user={stat.user} size="sm" />

                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex flex-wrap align-items-center gap-1">
                      <span className="fw-semibold me-1">{stat.user.name.trim()}</span>

                      {isBest && (
                        <span className="home__rating-badge home__rating-badge--best">
                          <Trophy />
                          {t("rating.best")}
                        </span>
                      )}

                      {isPerfect && (
                        <span className="home__rating-badge home__rating-badge--perfect">
                          <AppIcon name="check" />
                          {t("rating.perfect")}
                        </span>
                      )}
                    </div>

                    <div
                      className="home__rating-bar"
                      role="progressbar"
                      aria-valuenow={stat.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={stat.user.name.trim()}
                    >
                      <span style={{ width: `${stat.percent}%` }}></span>
                    </div>
                  </div>

                  <span className="home__rating-count">
                    {stat.done}/{stat.assigned}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};
