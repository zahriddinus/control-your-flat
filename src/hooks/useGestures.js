import { useEffect, useRef, useState } from "react";

// Telefonda yengil tebranish (qo'llab-quvvatlanmasa, hech narsa bo'lmaydi)
export const vibrate = (duration = 15) => {
  try {
    navigator.vibrate?.(duration);
  } catch {
    // Ba'zi brauzerlar tebranishni taqiqlaydi
  }
};

// Chapga / o'ngga surish. Yon tomonga aylanadigan jadval ichida boshlangan surish hisobga olinmaydi
export const useSwipe = (ref, { onLeft, onRight, threshold = 70 }) => {
  const handlers = useRef({ onLeft, onRight });

  handlers.current = { onLeft, onRight };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let start = null;

    const handleStart = (evt) => {
      const touch = evt.touches[0];
      const scroller = evt.target.closest?.(".table-responsive");

      // Jadval yon tomonga aylanayotgan bo'lsa, surish uniki
      start =
        scroller && scroller.scrollWidth > scroller.clientWidth
          ? null
          : { x: touch.clientX, y: touch.clientY };
    };

    const handleEnd = (evt) => {
      if (!start) return;

      const touch = evt.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      start = null;

      // Asosan gorizontal va yetarlicha uzun bo'lsa
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      vibrate(10);

      if (dx < 0) handlers.current.onLeft?.();
      else handlers.current.onRight?.();
    };

    element.addEventListener("touchstart", handleStart, { passive: true });
    element.addEventListener("touchend", handleEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleStart);
      element.removeEventListener("touchend", handleEnd);
    };
  }, [ref, threshold]);
};

// Sahifaning eng tepasida pastga tortib yangilash. pull - 0..1 (ko'rsatkich uchun)
export const usePullToRefresh = (onRefresh, { distance = 80 } = {}) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const callback = useRef(onRefresh);

  callback.current = onRefresh;

  useEffect(() => {
    let startY = null;
    let current = 0;

    const handleStart = (evt) => {
      startY = window.scrollY <= 0 ? evt.touches[0].clientY : null;
    };

    const handleMove = (evt) => {
      if (startY === null) return;

      const delta = evt.touches[0].clientY - startY;

      if (delta <= 0 || window.scrollY > 0) {
        current = 0;
        setPull(0);
        return;
      }

      current = Math.min(1, delta / distance);
      setPull(current);
    };

    const handleEnd = async () => {
      if (startY === null) return;

      startY = null;
      setPull(0);

      if (current < 1) return;

      current = 0;
      vibrate(15);
      setRefreshing(true);

      try {
        await callback.current();
      } finally {
        setRefreshing(false);
      }
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [distance]);

  return { pull, refreshing };
};
