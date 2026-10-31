import { formatDaysLeft } from "../../utils/date";

export const StatsCards = ({ users, schedules }) => {
  const adminsCount = users.filter((user) => user.role === "admin").length;
  const todayDuty = users.find((user) => user.user_id === schedules[0]?.duty?.user_id);
  const cleaningDays = schedules.findIndex((schedule) => schedule?.cleaning?.length > 0);

  const stats = [
    { key: "users", icon: "👥", label: "Jami xonadoshlar", value: users.length },
    { key: "admins", icon: "🛡️", label: "Adminlar", value: adminsCount },
    { key: "duty", icon: "⭐", label: "Bugungi navbatchi", value: todayDuty?.name ?? "—" },
    {
      key: "cleaning",
      icon: "🧹",
      label: "Keyingi uborka",
      value: cleaningDays === -1 ? "—" : formatDaysLeft(cleaningDays),
    },
  ];

  return (
    <div className="row g-3 mb-4">
      {stats.map((stat) => (
        <div className="col-6 col-lg-3" key={stat.key}>
          <div className={`control__stat control__stat--${stat.key} card h-100 border-0 shadow-sm`}>
            <div className="card-body d-flex align-items-center gap-3 text-start">
              <span className="control__stat-icon" aria-hidden="true">
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
