import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { formatDaysLeft } from "../../utils/date";

export const StatsCards = ({ users, schedules }) => {
  const { t } = useI18n();
  const adminsCount = users.filter((user) => user.role === "admin").length;
  const todayDuty = users.find((user) => user.user_id === schedules[0]?.duty?.user_id);
  const cleaningDays = schedules.findIndex((schedule) => schedule?.cleaning?.length > 0);

  // Navbatchi va uborka uchun vazifa ikonkasi, qolganlari uchun rangli doirada belgi
  const stats = [
    {
      key: "users",
      icon: <AppIcon name="users" />,
      label: t("control.stats.users"),
      value: users.length,
    },
    {
      key: "admins",
      icon: <AppIcon name="shield" />,
      label: t("control.stats.admins"),
      value: adminsCount,
    },
    {
      key: "duty",
      icon: <TaskIcon taskKey="duty" size="lg" />,
      label: t("control.stats.duty"),
      value: todayDuty?.name.trim() ?? "—",
    },
    {
      key: "cleaning",
      icon: <TaskIcon taskKey="cleaning" size="lg" />,
      label: t("control.stats.cleaning"),
      value: cleaningDays === -1 ? "—" : formatDaysLeft(cleaningDays, t),
    },
  ];

  return (
    <div className="row g-3 mb-4 stagger">
      {stats.map((stat) => (
        <div className="col-6 col-lg-3" key={stat.key}>
          <div className={`control__stat control__stat--${stat.key} card h-100 border-0 shadow-sm`}>
            <div className="card-body d-flex align-items-center gap-3 text-start">
              <span
                className={`control__stat-icon control__stat-icon--${stat.key}`}
                aria-hidden="true"
              >
                {stat.icon}
              </span>

              <div className="overflow-hidden">
                <div className="control__stat-value text-truncate">{stat.value}</div>

                <small className="text-muted">{stat.label}</small>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
