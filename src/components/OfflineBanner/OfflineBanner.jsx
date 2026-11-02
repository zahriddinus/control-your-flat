import "./offlineBanner.scss";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";

// Internet uzilsa, tepada ogohlantirish chiqadi: sahifalar oxirgi saqlangan nusxani ko'rsatadi
export const OfflineBanner = () => {
  const { t } = useI18n();
  const [offline, setOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="status">
      {t("offline")}
    </div>
  );
};
