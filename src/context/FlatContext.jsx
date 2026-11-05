import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabese";
import { TASKS } from "../utils/schedule";
import { useAuth } from "./AuthContext";

const FlatContext = createContext(null);

// Bir nechta uyga a'zo bo'lsa, oxirgi tanlangani eslab qolinadi
const STORAGE_KEY = "currentFlatId";

const readSavedFlatId = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveFlatId = (flatId) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, flatId);
  } catch {
    // Saqlab bo'lmasa, keyingi safar birinchi uy ochiladi
  }
};

// Joriy uy: a'zoliklar, tanlangan uy, uning qoidalari va mening rolim.
// memberships: undefined - yuklanmoqda, [] - hech qaysi uyga a'zo emas
export const FlatProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState(undefined);
  // Qaysi uyning qoidalari yuklangani: boshqa uyga o'tganda eskisi ko'rinib qolmaydi
  const [taskState, setTaskState] = useState({ flatId: null, rows: [] });
  const [currentFlatId, setCurrentFlatId] = useState(readSavedFlatId);
  const [error, setError] = useState(null);

  const userId = user?.id;

  const loadMemberships = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("flat_members")
      .select(
        "flat_id, role, resident_id, resident:users(name, last_name), flat:flats(id, name, start_date, timezone, latitude, longitude, address)"
      )
      .eq("auth_user_id", userId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error(error);
      setError(error);
      setMemberships([]);
      return;
    }

    setError(null);
    setMemberships(data.filter((membership) => membership.flat));
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setMemberships([]);
      return;
    }

    setMemberships(undefined);
    loadMemberships();
  }, [authLoading, userId, loadMemberships]);

  const membership =
    memberships?.find((item) => item.flat_id === currentFlatId) ?? memberships?.[0] ?? null;

  const flatId = membership?.flat_id ?? null;

  // Uy qoidalari: qaysi vazifa yoqilgan, necha kunda, necha kishi
  const loadTasks = useCallback(async () => {
    if (!flatId) {
      setTaskState({ flatId: null, rows: [] });
      return;
    }

    const { data, error } = await supabase
      .from("flat_tasks")
      .select("task, enabled, every_days, people")
      .eq("flat_id", flatId);

    if (error) {
      console.error(error);
      setTaskState({ flatId, rows: [] });
      return;
    }

    setTaskState({ flatId, rows: data });
  }, [flatId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const selectFlat = useCallback((id) => {
    setCurrentFlatId(id);
    saveFlatId(id);
  }, []);

  const flatTasks = useMemo(
    () => (taskState.flatId === flatId ? taskState.rows : []),
    [taskState, flatId]
  );
  const tasksLoading = Boolean(flatId) && taskState.flatId !== flatId;

  // Yoqilgan vazifalar, qoidalari bilan (TASKS tartibida)
  const tasks = useMemo(
    () =>
      TASKS.map((task) => {
        const rule = flatTasks.find((item) => item.task === task.key);

        return rule
          ? { ...task, everyDays: rule.every_days, people: rule.people, enabled: rule.enabled }
          : null;
      }).filter((task) => task?.enabled),
    [flatTasks]
  );

  const value = {
    loading: authLoading || memberships === undefined || tasksLoading,
    error,
    memberships: memberships ?? [],
    membership,
    flat: membership?.flat ?? null,
    flatId,
    isOwner: membership?.role === "owner",
    // Ega yoki boshqaruvchi: xonadoshlar, navbatlar, qoidalar va takliflarni boshqaradi
    isManager: membership?.role === "owner" || membership?.role === "admin",
    residentId: membership?.resident_id ?? null,
    tasks,
    flatTasks,
    selectFlat,
    reload: loadMemberships,
    reloadTasks: loadTasks,
  };

  return <FlatContext.Provider value={value}>{children}</FlatContext.Provider>;
};

export const useFlat = () => useContext(FlatContext);
