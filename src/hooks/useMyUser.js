import { useCallback, useEffect, useState } from "react";

// "Men kimman?" tanlovi. Home'dagi "Mening navbatim" va Duties schedule'dagi
// "Kimniki" filtri bitta qiymatni ishlatadi, brauzerda eslab qolinadi
const STORAGE_KEY = "myUserId";

const readSavedUserId = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export const useMyUser = () => {
  const [myUserId, setMyUserIdState] = useState(readSavedUserId);

  // Boshqa tabda o'zgartirilsa, bu yerda ham yangilanadi
  useEffect(() => {
    const handleStorage = (evt) => {
      if (evt.key === STORAGE_KEY) setMyUserIdState(evt.newValue || "");
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setMyUserId = useCallback((userId) => {
    setMyUserIdState(userId);

    try {
      window.localStorage.setItem(STORAGE_KEY, userId);
    } catch {
      // Saqlab bo'lmasa, tanlov faqat shu sahifada qoladi
    }
  }, []);

  return [myUserId, setMyUserId];
};
