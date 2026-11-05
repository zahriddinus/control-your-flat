import { useI18n } from "../../i18n";
import { addDays, formatLongDate } from "../../utils/date";
import { getAssigned, getAssignedNames } from "../../utils/schedule";
import { useFlat } from "../../context/FlatContext";
import { TaskIcon } from "../../components/TaskIcon";

export const CleaningCountdown = ({ users, schedules, today, loading }) => {
  const { t, lang } = useI18n();
  const { tasks } = useFlat();

  // Uborka necha kunda bir bo'lishi - uy qoidasidan
  const cleaningTask = tasks.find((task) => task.key === "cleaning");
  const interval = cleaningTask?.everyDays ?? 7;
  const days = schedules.findIndex((schedule) => getAssigned(schedule, "cleaning").length > 0);

  const names = getAssignedNames(users, cleaningTask, schedules[days]);

  const progress = days === -1 ? 0 : (Math.max(0, interval - days) / interval) * 100;

  return (
    <section className="home__panel card border-0 shadow-sm h-100 text-start">
      <div className="card-body">
        <h2 className="home__section-title d-flex align-items-center gap-2">
          <TaskIcon taskKey="cleaning" size="md" />
          {t("home.cleaning.title")}
        </h2>

        {loading ? (
          <p className="placeholder-glow m-0">
            <span className="placeholder col-6"></span>
          </p>
        ) : days === -1 ? (
          <p className="text-muted m-0">{t("home.cleaning.none")}</p>
        ) : (
          <>
            <p className="home__countdown fw-bold mb-1">
              {days === 0 ? t("home.cleaning.today") : t("home.cleaning.daysLeft", { count: days })}
            </p>

            <p className="text-muted mb-3">
              {formatLongDate(addDays(today, days), lang)}
              {names && ` · ${names}`}
            </p>

            <div
              className="progress"
              role="progressbar"
              aria-label={t("home.cleaning.progress")}
              aria-valuenow={Math.round(progress)}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className="home__progress-bar progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
