import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";
import { formatDaysLeft } from "../../utils/date";
import { getAssigned } from "../../utils/schedule";

// accounts - o'z hisobi bilan kiradigan xonadoshlar: { [user_id]: "owner" | "member" }
export const StatsCards = ({ users, schedules, accounts = {} }) => {
  const { t } = useI18n();
  const accountsCount = users.filter((user) => accounts[user.user_id]).length;
  const todayDuty = users.find(
    (user) => user.user_id === getAssigned(schedules[0], "duty")[0]?.user_id
  );
  const cleaningDays = schedules.findIndex(
    (schedule) => getAssigned(schedule, "cleaning").length > 0
  );

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
      label: t("control.stats.accounts"),
      value: `${accountsCount}/${users.length}`,
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
