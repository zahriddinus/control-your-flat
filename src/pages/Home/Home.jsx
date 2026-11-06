import "./home.scss";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabese";
import { PageSkeleton } from "../../components/Skeleton";
import { EmptyState, ErrorState } from "../../components/EmptyState";
import { Confetti } from "../../components/Confetti";
import { Notice, useNotice } from "../../components/Notice";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { addDays, formatDate, parseDate } from "../../utils/date";
import { fetchSchedules } from "../../utils/schedule";
import { queryWithCache } from "../../utils/offline";
import { fetchDone, markDone, unmarkDone } from "../../utils/done";
import { Greeting } from "./Greeting";
import { WeatherCard } from "./WeatherCard";
import { TodayTasks } from "./TodayTasks";
import { DayHero } from "./DayHero";
import { MyTurn } from "./MyTurn";
import { CleaningCountdown } from "./CleaningCountdown";
import { WeekView } from "./WeekView";
import { QuickLinks } from "./QuickLinks";
import { MonthRating } from "./MonthRating";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { SwapCenter } from "./SwapCenter";
import { ActivityFeed } from "./ActivityFeed";
import { usePullToRefresh, vibrate } from "../../hooks/useGestures";
import { AppIcon } from "../../components/AppIcon";

// Shuncha kun oldinga qaraladi: har bir vazifada har bir xonadoshga navbat kamida bir marta keladi
const getDaysAhead = (usersCount, tasks) =>
  Math.min(
    90,
    Math.max(7, ...tasks.map((task) => task.everyDays * Math.ceil(usersCount / task.people)))
  );

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
  const { flat, flatId, residentId, tasks } = useFlat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);

  // Almashish qabul qilinsa yoki "Bajardim" bosilsa: navbatlar va lenta qayta yuklanadi
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((key) => key + 1);

  // Telefonda sahifa tepasida pastga tortilsa - navbatlar, belgilar va lenta qayta yuklanadi
  const { pull, refreshing } = usePullToRefresh(async () => {
    refresh();
    await new Promise((resolve) => setTimeout(resolve, 600));
  });

  // "Mening navbatim"da kim ko'rilmoqda: boshida o'zim, boshqani ham tanlash mumkin
  const [viewUserId, setViewUserId] = useState(residentId);

  // Bugungi "Bajardim" belgilari (null - yuklanmoqda)
  const [doneToday, setDoneToday] = useState(null);
  const [doneBusy, setDoneBusy] = useState(null);
  const [notice, showNotice] = useNotice();

  useEffect(() => setViewUserId(residentId), [residentId]);

  // GET USERS

  useEffect(() => {
    let cancelled = false;

    const getUsers = async () => {
      setLoading(true);

      // Internet bo'lmasa, oxirgi saqlangan ro'yxat ko'rsatiladi
      const { data, error } = await queryWithCache(`users:home:${flatId}`, () =>
        supabase
          .from("users")
          .select("user_id, name, last_name, avatar_color, duty_order")
          .eq("flat_id", flatId)
          .order("duty_order", { ascending: true })
      );

      if (cancelled) return;

      if (error) {
        console.error(error);
        setError(error);
      } else {
        setError(null);
        setUsers(data);
      }

      setLoading(false);
    };

    getUsers();

    return () => {
      cancelled = true;
    };
  }, [flatId]);

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
  const daysAhead = getDaysAhead(users.length, tasks);

  // GET SCHEDULES (bugundan boshlab)

  useEffect(() => {
    if (!users.length) return;

    let cancelled = false;

    const getSchedules = async () => {
      setSchedulesLoading(true);

      try {
        const dates = Array.from({ length: daysAhead }, (_, index) => addDays(today, index));
        const result = await fetchSchedules(flatId, dates);

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
  }, [flatId, today, users.length, daysAhead, refreshKey]);

  // GET TODAY'S DONE MARKS

  useEffect(() => {
    let cancelled = false;

    setDoneToday(null);

    fetchDone(flatId, todayKey, todayKey)
      .then((records) => !cancelled && setDoneToday(records))
      .catch((error) => {
        console.error("Done error:", error);
        if (!cancelled) setDoneToday([]);
      });

    return () => {
      cancelled = true;
    };
  }, [flatId, todayKey, refreshKey]);

  // Men - hisobimga ulangan xonadosh
  const me = users.find((user) => user.user_id === residentId) ?? null;

  // Bugun navbatim bo'lsa, kuniga bir marta konfetti
  const hasTaskToday =
    !schedulesLoading && me && tasks.some((task) => task.isAssigned(schedules[0], me.user_id));

  useEffect(() => {
    if (!hasTaskToday) return;

    const key = `confetti:${me.user_id}:${todayKey}`;

    if (readStorage(key)) return;

    writeStorage(key, "1");
    setShowConfetti(true);
  }, [hasTaskToday, me, todayKey]);

  // "Bajardim" va uni bekor qilish (faqat bugungi o'z vazifasi uchun)
  const handleDone = async (taskKey) => {
    setDoneBusy(taskKey);
    vibrate(20);

    try {
      const doneAt = await markDone(flatId, taskKey);

      setDoneToday((prev) => [
        ...(prev ?? []).filter(
          (record) => !(record.task === taskKey && record.user_id === me.user_id)
        ),
        { day: todayKey, task: taskKey, user_id: me.user_id, done_at: doneAt },
      ]);
      setShowConfetti(true);
      showNotice(t("done.success"));
      refresh();
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
      await unmarkDone(flatId, taskKey);

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

    if (!tasks.length) {
      return (
        <EmptyState variant="notFound" title={t("home.noTasksTitle")} text={t("home.noTasks")} />
      );
    }

    const scheduleProps = { users, schedules, today, loading: schedulesLoading };
    const hasCleaning = tasks.some((task) => task.key === "cleaning");

    return (
      <>
        <TodayTasks
          users={users}
          schedules={schedules}
          loading={schedulesLoading}
          done={doneToday}
        />

        {!schedulesLoading && <DayHero users={users} schedule={schedules[0]} done={doneToday} />}

        {!schedulesLoading && (
          <SwapCenter
            users={users}
            schedules={schedules}
            today={today}
            onChanged={refresh}
            onNotice={showNotice}
          />
        )}

        <div className="row g-3 mb-4">
          <div className={`col-12 ${hasCleaning ? "col-lg-6" : ""}`}>
            <MyTurn {...scheduleProps} userId={viewUserId} onUserChange={setViewUserId} />
          </div>

          {hasCleaning && (
            <div className="col-12 col-lg-6">
              <CleaningCountdown {...scheduleProps} />
            </div>
          )}
        </div>

        <WeekView {...scheduleProps} />

        {doneToday && <MonthRating users={users} today={today} doneToday={doneToday} />}

        <ActivityFeed users={users} refreshKey={refreshKey} />
      </>
    );
  };

  return (
    <div className="home">
      {/* Pastga tortib yangilash ko'rsatkichi */}
      {(pull > 0 || refreshing) && (
        <div
          className={`home__pull ${pull >= 1 || refreshing ? "home__pull--ready" : ""}`}
          style={{ transform: `translate(-50%, ${refreshing ? 16 : pull * 56 - 40}px)` }}
          aria-hidden="true"
        >
          {refreshing ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <AppIcon name="arrowUp" className="home__pull-arrow" />
          )}
        </div>
      )}

      {/* Bo'limlar ketma-ket paydo bo'ladi (stagger) */}
      <div className="container py-3 py-md-4 stagger">
        <Greeting
          now={currentDate}
          me={me}
          schedules={schedules}
          loading={schedulesLoading}
          done={doneToday}
          doneBusy={doneBusy}
          onDone={handleDone}
          onUndo={handleUndo}
        />

        {/* Yangi uy uchun birinchi qadamlar (ega va boshqaruvchilarga) */}
        <OnboardingChecklist usersCount={users.length} />

        <WeatherCard users={users} schedules={schedules} flat={flat} />

        {renderSchedules()}

        <QuickLinks users={users} today={today} />
      </div>

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <Notice notice={notice} />
    </div>
  );
};
