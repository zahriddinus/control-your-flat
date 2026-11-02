import "./installPrompt.scss";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { LogoIcon } from "../AppIcon";

// Yopilgandan keyin taklif shuncha kun ko'rinmaydi
const DISMISS_DAYS = 14;
const STORAGE_KEY = "installDismissedAt";

// Sahifa ochilgandan keyin biroz kutib chiqadi, darhol xalaqit bermasin
const SHOW_DELAY_MS = 3000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const wasDismissedRecently = () => {
  try {
    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY));
    return dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

// "Ilovani o'rnating" taklifi. Android va kompyuterda brauzerning o'rnatish oynasini ochadi,
// iPhone'da esa "Ulashish -> Bosh ekranga qo'shish" yo'riqnomasini ko'rsatadi
export const InstallPrompt = () => {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    const handleBeforeInstall = (evt) => {
      // Brauzerning o'z kichik panelini to'xtatib, o'zimiznikini ko'rsatamiz
      evt.preventDefault();
      setInstallEvent(evt);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const iosTimer = isIos() ? setTimeout(() => setShowIosHint(true), SHOW_DELAY_MS) : null;

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setInstallEvent(null);
    setShowIosHint(false);

    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Saqlab bo'lmasa, keyingi safar yana chiqadi
    }
  }

  async function install() {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (!installEvent && !showIosHint) return null;

  return (
    <div className="install-prompt" role="dialog" aria-labelledby="installPromptTitle">
      <span className="install-prompt__logo" aria-hidden="true">
        <LogoIcon />
      </span>

      <div className="install-prompt__text">
        <strong id="installPromptTitle" className="d-block">
          {t("install.title")}
        </strong>

        <small>{showIosHint ? t("install.iosText") : t("install.text")}</small>
      </div>

      {installEvent && (
        <button type="button" className="install-prompt__btn btn btn-sm" onClick={install}>
          {t("install.button")}
        </button>
      )}

      <button
        type="button"
        className="btn-close"
        aria-label={t("common.close")}
        onClick={dismiss}
      ></button>
    </div>
  );
};
