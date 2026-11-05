import "./home.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { PageSkeleton } from "../../components/Skeleton";
import { EmptyState, ErrorState } from "../../components/EmptyState";
import { WhoAmI } from "../../components/WhoAmI";
import { Confetti } from "../../components/Confetti";
import { Notice, useNotice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { addDays, formatDate, parseDate } from "../../utils/date";
import { fetchSchedules, TASKS } from "../../utils/schedule";
import { queryWithCache } from "../../utils/offline";
import { fetchDone, markDone, unmarkDone } from "../../utils/done";
import { useMyUser } from "../../hooks/useMyUser";
import { Greeting } from "./Greeting";
import { WeatherCard } from "./WeatherCard";
import { TodayTasks } from "./TodayTasks";
import { DayHero } from "./DayHero";
import { MyTurn } from "./MyTurn";
import { CleaningCountdown } from "./CleaningCountdown";
import { WeekView } from "./WeekView";
import { QuickLinks } from "./QuickLinks";
import { MonthRating } from "./MonthRating";

// Musor har 3 kunda bir kishiga, uborka har 7 kunda ikki kishiga beriladi.
// Shuncha kun ichida har bir xonadoshning har bir navbati kamida bir marta keladi
const getDaysAhead = (usersCount) => Math.max(7, usersCount * 3, 7 * Math.ceil(usersCount / 2));

// "Keyinroq" bosilgan bo'lsa, "Men kimman?" oynasi o'zi qayta ochilmaydi
const SKIP_KEY = "whoAmISkipped";

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Saqlab bo'lmasa, faqat shu safar eslab qolinadi
  }
};

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
  const [whoAmIOpen, setWhoAmIOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Bugungi "Bajardim" belgilari. null - funksiya hali yo'q (SQL ishga tushirilmagan) yoki yuklanmoqda
  const [doneToday, setDoneToday] = useState(null);
  const [doneBusy, setDoneBusy] = useState(null);
  const [notice, showNotice] = useNotice();

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

  // GET TODAY'S DONE MARKS

  useEffect(() => {
    let cancelled = false;

    fetchDone(todayKey, todayKey)
      .then((records) => !cancelled && setDoneToday(records))
      .catch((error) => console.error("Done error:", error));

    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  // Tanlangan odam ro'yxatda bo'lmasa (masalan, o'chirilgan), hech kim tanlanmagan deb olinadi
  const me = users.find((user) => user.user_id === myUserId) ?? null;

  // Birinchi kirishda "Men kimman?" oynasi o'zi ochiladi
  useEffect(() => {
    if (!loading && users.length && !me && !readStorage(SKIP_KEY)) {
      setWhoAmIOpen(true);
    }
  }, [loading, users.length, me]);

  // Bugun navbatim bo'lsa, kuniga bir marta konfetti
  const hasTaskToday =
    !schedulesLoading && me && TASKS.some((task) => task.isAssigned(schedules[0], me.user_id));

  useEffect(() => {
    if (!hasTaskToday) return;

    const key = `confetti:${me.user_id}:${todayKey}`;

    if (readStorage(key)) return;

    writeStorage(key, "1");
    setShowConfetti(true);
  }, [hasTaskToday, me, todayKey]);

  const handleWhoAmISelect = (userId) => {
    setMyUserId(userId);
    setWhoAmIOpen(false);
  };

  // "Bajardim" va uni bekor qilish (faqat bugungi o'z vazifasi uchun)
  const handleDone = async (taskKey) => {
    setDoneBusy(taskKey);

    try {
      const doneAt = await markDone(taskKey, me.user_id);

      setDoneToday((prev) => [
        ...(prev ?? []).filter(
          (record) => !(record.task === taskKey && record.user_id === me.user_id)
        ),
        { day: todayKey, task: taskKey, user_id: me.user_id, done_at: doneAt },
      ]);
      setShowConfetti(true);
      showNotice(t("done.success"));
    } catch (error) {
      console.error(error);
      showNotice(t("done.error"), "danger");
    } finally {
      setDoneBusy(null);
    }
  };

  const handleUndo = async (taskKey) => {
    setDoneBusy(taskKey);

    try {
      await unmarkDone(taskKey, me.user_id);

      setDoneToday((prev) =>
        (prev ?? []).filter((record) => !(record.task === taskKey && record.user_id === me.user_id))
      );
    } catch (error) {
      console.error(error);
      showNotice(t("done.error"), "danger");
    } finally {
      setDoneBusy(null);
    }
  };

  const handleWhoAmIClose = () => {
    writeStorage(SKIP_KEY, "1");
    setWhoAmIOpen(false);
  };

  if (loading) {
    return <PageSkeleton variant="home" />;
  }

  const renderSchedules = () => {
    if (error) {
      return <ErrorState text={t("home.usersError")} />;
    }

    if (!users.length) {
      return <EmptyState variant="noUsers" text={t("home.noUsers")} />;
    }

    if (scheduleError) {
      return <ErrorState text={t("home.schedulesError")} />;
    }

    const scheduleProps = { users, schedules, today, loading: schedulesLoading };

    return (
      <>
        <TodayTasks
          users={users}
          schedules={schedules}
          loading={schedulesLoading}
          done={doneToday}
        />

        {!schedulesLoading && <DayHero users={users} schedule={schedules[0]} done={doneToday} />}

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <MyTurn {...scheduleProps} userId={myUserId} onUserChange={setMyUserId} />
          </div>

          <div className="col-12 col-lg-6">
            <CleaningCountdown {...scheduleProps} />
          </div>
        </div>

        <WeekView {...scheduleProps} />

        {doneToday && <MonthRating users={users} today={today} doneToday={doneToday} />}
      </>
    );
  };

  return (
    <div className="home">
      {/* Bo'limlar ketma-ket paydo bo'ladi (stagger) */}
      <div className="container py-3 py-md-4 stagger">
        <Greeting
          now={currentDate}
          me={me}
          schedules={schedules}
          loading={schedulesLoading}
          onWhoAmI={users.length ? () => setWhoAmIOpen(true) : undefined}
          done={doneToday}
          doneBusy={doneBusy}
          onDone={handleDone}
          onUndo={handleUndo}
        />

        <WeatherCard users={users} schedules={schedules} />

        {renderSchedules()}

        <QuickLinks users={users} today={today} />
      </div>

      <WhoAmI
        isOpen={whoAmIOpen}
        users={users}
        currentId={me?.user_id}
        onSelect={handleWhoAmISelect}
        onClose={handleWhoAmIClose}
      />

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <Notice notice={notice} />
    </div>
  );
};
