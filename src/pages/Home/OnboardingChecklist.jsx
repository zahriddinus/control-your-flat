import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";

const readFlag = (key) => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeFlag = (key) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Saqlab bo'lmasa, ro'yxat keyingi safar yana chiqadi
  }
};

// Sozlamalar sahifasi ochilganda belgilanadi: "qoidalarni ko'rib chiqdim"
export const markRulesReviewed = (flatId) => writeFlag(`onboarding:rules:${flatId}`);

// Yangi uy uchun birinchi qadamlar (faqat ega va boshqaruvchilarga).
// Hammasi bajarilsa yoki "Yashirish" bosilsa, boshqa chiqmaydi
export const OnboardingChecklist = ({ usersCount }) => {
  const { t } = useI18n();
  const { flatId, residentId, isManager } = useFlat();
  const hiddenKey = `onboarding:hidden:${flatId}`;

  const [hidden, setHidden] = useState(() => readFlag(hiddenKey));
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isManager || hidden) return;

    let cancelled = false;

    const load = async () => {
      const [members, invites, me] = await Promise.all([
        supabase
          .from("flat_members")
          .select("auth_user_id", { count: "exact", head: true })
          .eq("flat_id", flatId),
        supabase
          .from("invites")
          .select("code", { count: "exact", head: true })
          .eq("flat_id", flatId),
        supabase.from("users").select("nickname, phone_number").eq("user_id", residentId).single(),
      ]);

      if (cancelled) return;

      setStats({
        joined: (members.count ?? 0) > 1 || (invites.count ?? 0) > 0,
        profile: Boolean(me.data?.nickname || me.data?.phone_number),
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [flatId, residentId, isManager, hidden]);

  if (!isManager || hidden || !stats) return null;

  const steps = [
    { key: "flat", done: true },
    { key: "flatmates", done: usersCount > 1, to: "/control-users" },
    { key: "invite", done: stats.joined, to: "/control-users" },
    { key: "rules", done: readFlag(`onboarding:rules:${flatId}`), to: "/settings" },
    { key: "profile", done: stats.profile, to: "/profile" },
  ];

  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) return null;

  const progress = Math.round((doneCount / steps.length) * 100);

  function handleHide() {
    writeFlag(hiddenKey);
    setHidden(true);
  }

  return (
    <section className="home__onboarding card border-0 shadow-sm mb-4 text-start">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
          <div>
            <h2 className="home__section-title mb-1">{t("onboarding.title")}</h2>
            <small className="text-muted">
              {t("onboarding.progress", { done: doneCount, total: steps.length })}
            </small>
          </div>

          <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={handleHide}>
            {t("onboarding.hide")}
          </button>
        </div>

        <div
          className="home__onboarding-bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("onboarding.title")}
        >
          <span style={{ width: `${progress}%` }}></span>
        </div>

        <ol className="home__onboarding-list list-unstyled m-0">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={`home__onboarding-step ${step.done ? "home__onboarding-step--done" : ""}`}
            >
              <span className="home__onboarding-mark" aria-hidden="true">
                {step.done ? <AppIcon name="check" /> : index + 1}
              </span>

              <div className="flex-grow-1">
                <span className="fw-semibold d-block">
                  {t(`onboarding.steps.${step.key}.title`)}
                </span>
                {!step.done && (
                  <small className="text-muted">{t(`onboarding.steps.${step.key}.text`)}</small>
                )}
              </div>

              {!step.done && step.to && (
                <Link className="btn btn-sm btn-primary text-nowrap" to={step.to}>
                  {t("onboarding.go")}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
