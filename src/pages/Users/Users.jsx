import "./users.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { Loading } from "../../components/Loading";

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

const getInitials = (user) =>
  `${user.name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "?";

export const Users = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [todaySchedule, setTodaySchedule] = useState(null);

  useEffect(() => {
    const getUsers = async () => {
      // Faqat sahifada ko'rsatiladigan ustunlarni olamiz
      const { data, error } = await supabase
        .from("users")
        .select("user_id, name, last_name, nickname, phone_number, duty_order")
        .order("duty_order", { ascending: true });

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
      const { data, error } = await supabase.rpc("get_duty_schedule", {
        target_date: formatDate(new Date()),
      });

      if (error) {
        console.error(error);
        return;
      }

      setTodaySchedule(data);
    };

    getUsers();
    getTodaySchedule();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data;

    return data.filter((user) =>
      [user.name, user.last_name, user.nickname, user.phone_number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [data, search]);

  const getTodayTasks = (user) => {
    if (!todaySchedule) return [];

    const tasks = [];

    if (todaySchedule.duty?.user_id === user.user_id) tasks.push("Navbatchi");
    if (todaySchedule.rubbish?.user_id === user.user_id) tasks.push("Musor");
    if (todaySchedule.cleaning?.some((cleaningUser) => cleaningUser.user_id === user.user_id)) {
      tasks.push("Generalniy uborka");
    }

    return tasks;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container pt-3">
        <div className="alert alert-danger">
          Ma'lumotlarni yuklab bo'lmadi. Sahifani yangilab ko'ring.
        </div>
      </div>
    );
  }

  return (
    <div className="users">
      <div className="container py-3 py-md-4">
        <div className="users__head d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <h1 className="users__title text-primary fw-semibold m-0">
            Users
            <span className="badge rounded-pill text-bg-primary ms-2 align-middle">
              {data.length}
            </span>
          </h1>

          {data.length > 0 && (
            <div className="users__search">
              <input
                type="search"
                className="form-control"
                placeholder="Ism, nickname yoki telefon..."
                aria-label="Foydalanuvchilarni qidirish"
                value={search}
                onChange={(evt) => setSearch(evt.target.value)}
              />
            </div>
          )}
        </div>

        {!data.length && <div className="alert alert-info">Hozircha foydalanuvchilar yo'q.</div>}

        {data.length > 0 && !filteredUsers.length && (
          <div className="alert alert-secondary">"{search}" bo'yicha hech kim topilmadi.</div>
        )}

        <div className="row g-3">
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
                      <div className="users__avatar flex-shrink-0">{getInitials(user)}</div>

                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="users__name card-title m-0 text-truncate">
                          {user.name} {user.last_name}
                        </h5>

                        <small className="text-muted">Navbat: #{user.duty_order ?? "—"}</small>
                      </div>
                    </div>

                    {isOnDutyToday && (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {todayTasks.map((task) => (
                          <span className="badge text-bg-warning" key={task}>
                            Bugun: {task}
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
                          {user.nickname}
                        </a>
                      ) : (
                        <button className="btn btn-sm btn-outline-secondary flex-fill" disabled>
                          Telegram yo'q
                        </button>
                      )}

                      {user.phone_number ? (
                        <a
                          className="btn btn-sm btn-outline-success flex-fill text-truncate"
                          href={`tel:${user.phone_number}`}
                          title="Qo'ng'iroq qilish"
                        >
                          {user.phone_number}
                        </a>
                      ) : (
                        <button className="btn btn-sm btn-outline-secondary flex-fill" disabled>
                          Telefon yo'q
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
