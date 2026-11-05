import "./users.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { PageSkeleton } from "../../components/Skeleton";
import { EmptyState, ErrorState } from "../../components/EmptyState";
import { useI18n } from "../../i18n";
import { Avatar } from "../../components/Avatar";
import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useFlat } from "../../context/FlatContext";
import { fetchSchedules } from "../../utils/schedule";
import { queryWithCache } from "../../utils/offline";

export const Users = () => {
  const { t } = useI18n();
  const { flatId, tasks } = useFlat();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [todaySchedule, setTodaySchedule] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const getUsers = async () => {
      // Faqat sahifada ko'rsatiladigan ustunlarni olamiz
      // Internet bo'lmasa, oxirgi saqlangan ro'yxat ko'rsatiladi
      const { data, error } = await queryWithCache(`users:list:${flatId}`, () =>
        supabase
          .from("users")
          .select("user_id, name, last_name, nickname, phone_number, duty_order")
          .eq("flat_id", flatId)
          .order("duty_order", { ascending: true })
      );

      if (cancelled) return;

      if (error) {
        console.error(error);
        setError(error);
      } else {
        setData(data);
      }

      setLoading(false);
    };

    // Bugungi navbatchilarni belgilash uchun. Xato bo'lsa, sahifa baribir ishlaydi
    const getTodaySchedule = async () => {
      try {
        const [schedule] = await fetchSchedules(flatId, [new Date()]);

        if (!cancelled) setTodaySchedule(schedule);
      } catch (error) {
        console.error(error);
      }
    };

    getUsers();
    getTodaySchedule();

    return () => {
      cancelled = true;
    };
  }, [flatId]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data;

    return data.filter((user) =>
      [user.name, user.last_name, user.nickname, user.phone_number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [data, search]);

  const getTodayTasks = (user) =>
    tasks.filter((task) => task.isAssigned(todaySchedule, user.user_id));

  if (loading) {
    return <PageSkeleton variant="users" />;
  }

  if (error) {
    return (
      <div className="container pt-3">
        <ErrorState text={t("common.loadError")} />
      </div>
    );
  }

  return (
    <div className="users">
      <div className="container py-3 py-md-4">
        <div className="users__head d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <h1 className="users__title text-primary fw-semibold m-0">
            {t("users.title")}
            <span className="badge rounded-pill text-bg-primary ms-2 align-middle">
              {data.length}
            </span>
          </h1>

          {data.length > 0 && (
            <div className="users__search">
              <input
                type="search"
                className="form-control"
                placeholder={t("users.searchPlaceholder")}
                aria-label={t("users.searchAria")}
                value={search}
                onChange={(evt) => setSearch(evt.target.value)}
              />
            </div>
          )}
        </div>

        {!data.length && <EmptyState variant="noUsers" text={t("common.noUsers")} />}

        {data.length > 0 && !filteredUsers.length && (
          <EmptyState variant="notFound" text={t("users.notFound", { query: search })} compact />
        )}

        <div className="row g-3 stagger">
          {filteredUsers.map((user) => {
            const todayTasks = getTodayTasks(user);
            const isOnDutyToday = todayTasks.length > 0;

            return (
              <div className="col-12 col-sm-6 col-lg-4" key={user.user_id}>
                <div
                  className={`users__card card h-100 shadow-sm ${
                    isOnDutyToday ? "users__card--today border-primary" : "border-0"
                  }`}
                >
                  <div className="card-body d-flex flex-column text-start">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <Avatar user={user} />

                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="users__name card-title m-0 text-truncate">
                          {user.name} {user.last_name}
                        </h5>

                        <small className="text-muted">
                          {t("users.order", { order: user.duty_order ?? "—" })}
                        </small>
                      </div>
                    </div>

                    {isOnDutyToday && (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {todayTasks.map((task) => (
                          <span className="users__today-badge badge text-bg-warning" key={task.key}>
                            <TaskIcon taskKey={task.key} />
                            {t("users.todayTask", { task: t(`tasks.${task.key}.label`) })}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-auto">
                      {user.nickname ? (
                        <a
                          className="btn btn-sm btn-outline-primary flex-fill text-truncate"
                          href={`https://t.me/${user.nickname.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Telegram"
                        >
                          <AppIcon name="send" className="me-1" />
                          {user.nickname}
                        </a>
                      ) : (
                        <button className="btn btn-sm btn-outline-secondary flex-fill" disabled>
                          {t("users.noTelegram")}
                        </button>
                      )}

                      {user.phone_number ? (
                        <a
                          className="btn btn-sm btn-outline-success flex-fill text-truncate"
                          href={`tel:${user.phone_number}`}
                          title={t("users.call")}
                        >
                          <AppIcon name="phone" className="me-1" />
                          {user.phone_number}
                        </a>
                      ) : (
                        <button className="btn btn-sm btn-outline-secondary flex-fill" disabled>
                          {t("users.noPhone")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
