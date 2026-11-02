import "./home.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { PageSkeleton } from "../../components/Skeleton";
import { useI18n } from "../../i18n";
import { addDays, formatDate, parseDate } from "../../utils/date";
import { fetchSchedules } from "../../utils/schedule";
import { queryWithCache } from "../../utils/offline";
import { useMyUser } from "../../hooks/useMyUser";
import { Greeting } from "./Greeting";
import { WeatherCard } from "./WeatherCard";
import { TodayTasks } from "./TodayTasks";
import { DayHero } from "./DayHero";
import { MyTurn } from "./MyTurn";
import { CleaningCountdown } from "./CleaningCountdown";
import { WeekView } from "./WeekView";
import { QuickLinks } from "./QuickLinks";

// Musor har 3 kunda bir kishiga, uborka har 7 kunda ikki kishiga beriladi.
// Shuncha kun ichida har bir xonadoshning har bir navbati kamida bir marta keladi
const getDaysAhead = (usersCount) => Math.max(7, usersCount * 3, 7 * Math.ceil(usersCount / 2));

export const Home = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [myUserId, setMyUserId] = useMyUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // GET USERS

  useEffect(() => {
    const getUsers = async () => {
      // Internet bo'lmasa, oxirgi saqlangan ro'yxat ko'rsatiladi
      const { data, error } = await queryWithCache("users:home", () =>
        supabase
          .from("users")
          .select("user_id, name, last_name, duty_order")
          .order("duty_order", { ascending: true })
      );

      if (error) {
        console.error(error);
        setError(error);
      } else {
        setUsers(data);
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

  // Faqat kun almashganda o'zgaradi, shuning uchun navbatlar har daqiqa qayta so'ralmaydi
  const todayKey = formatDate(currentDate);
  const today = useMemo(() => parseDate(todayKey), [todayKey]);

  // GET SCHEDULES (bugundan boshlab)

  useEffect(() => {
    if (!users.length) return;

    let cancelled = false;

    const getSchedules = async () => {
      setSchedulesLoading(true);

      try {
        const dates = Array.from({ length: getDaysAhead(users.length) }, (_, index) =>
          addDays(today, index)
        );

        const result = await fetchSchedules(dates);

        if (cancelled) return;

        setSchedules(result);
        setScheduleError(null);
      } catch (error) {
        if (cancelled) return;

        console.error("Schedules error:", error);
        setScheduleError(error);
      } finally {
        if (!cancelled) {
          setSchedulesLoading(false);
        }
      }
    };

    getSchedules();

    return () => {
      cancelled = true;
    };
  }, [today, users.length]);

  if (loading) {
    return <PageSkeleton variant="home" />;
  }

  const renderSchedules = () => {
    if (error) {
      return <div className="alert alert-danger">{t("home.usersError")}</div>;
    }

    if (!users.length) {
      return <div className="alert alert-info">{t("home.noUsers")}</div>;
    }

    if (scheduleError) {
      return <div className="alert alert-danger">{t("home.schedulesError")}</div>;
    }

    const scheduleProps = { users, schedules, today, loading: schedulesLoading };

    return (
      <>
        <TodayTasks users={users} schedules={schedules} loading={schedulesLoading} />

        {!schedulesLoading && <DayHero users={users} schedule={schedules[0]} />}

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <MyTurn {...scheduleProps} userId={myUserId} onUserChange={setMyUserId} />
          </div>

          <div className="col-12 col-lg-6">
            <CleaningCountdown {...scheduleProps} />
          </div>
        </div>

        <WeekView {...scheduleProps} />
      </>
    );
  };

  return (
    <div className="home">
      <div className="container py-3 py-md-4">
        <Greeting
          now={currentDate}
          me={users.find((user) => user.user_id === myUserId) ?? null}
          schedules={schedules}
          loading={schedulesLoading}
        />

        <WeatherCard users={users} schedules={schedules} />

        {renderSchedules()}

        <QuickLinks users={users} today={today} />
      </div>
    </div>
  );
};
