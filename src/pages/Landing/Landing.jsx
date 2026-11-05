import "./landing.scss";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { AppIcon, LogoIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";

// Imkoniyatlar: belgi va tarjima kaliti (landing.features.<key>.title / .text)
const FEATURES = [
  { key: "schedule", icon: <AppIcon name="calendar" /> },
  { key: "rules", icon: <AppIcon name="sliders" /> },
  { key: "done", icon: <AppIcon name="check" /> },
  { key: "invite", icon: <AppIcon name="users" /> },
  { key: "telegram", icon: <AppIcon name="send" /> },
  { key: "private", icon: <AppIcon name="lock" /> },
];

const STEPS = ["signup", "flat", "invite"];

// Login qilmagan mehmon uchun bosh sahifa
export const Landing = () => {
  const { t } = useI18n();

  return (
    <div className="landing">
      {/* HERO */}

      <section className="landing__hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-6 text-start stagger">
              <span className="landing__eyebrow">
                <LogoIcon />
                Control Your Flat
              </span>

              <h1 className="landing__title">{t("landing.title")}</h1>

              <p className="landing__lead">{t("landing.lead")}</p>

              <div className="d-flex flex-wrap gap-2">
                <Link className="landing__cta btn btn-light btn-lg" to="/signup">
                  {t("landing.start")}
                </Link>

                <Link className="landing__ghost btn btn-outline-light btn-lg" to="/login">
                  {t("login.submit")}
                </Link>
              </div>
            </div>

            {/* Namuna: bugungi navbatlar kartochkasi */}
            <div className="col-12 col-lg-6">
              <div className="landing__preview" aria-hidden="true">
                <div className="landing__preview-head">
                  <span>{t("landing.preview.title")}</span>
                  <small>{t("landing.preview.date")}</small>
                </div>

                {["duty", "rubbish", "cleaning"].map((taskKey, index) => (
                  <div className="landing__preview-row" key={taskKey} style={{ "--i": index }}>
                    <TaskIcon taskKey={taskKey} size="md" />

                    <div className="flex-grow-1">
                      <small>{t(`tasks.${taskKey}.label`)}</small>
                      <strong>{t(`landing.preview.${taskKey}`)}</strong>
                    </div>

                    {index === 0 && (
                      <span className="landing__preview-done">
                        <AppIcon name="check" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMKONIYATLAR */}

      <section className="container py-5">
        <h2 className="landing__section-title">{t("landing.featuresTitle")}</h2>

        <div className="row g-3 stagger">
          {FEATURES.map((feature) => (
            <div className="col-12 col-sm-6 col-lg-4" key={feature.key}>
              <div className="landing__feature card border-0 shadow-sm h-100 text-start">
                <div className="card-body">
                  <span className={`landing__feature-icon landing__feature-icon--${feature.key}`}>
                    {feature.icon}
                  </span>

                  <h3 className="h6 fw-bold mt-3 mb-1">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="text-muted small m-0">
                    {t(`landing.features.${feature.key}.text`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QANDAY ISHLAYDI */}

      <section className="container pb-5">
        <h2 className="landing__section-title">{t("landing.stepsTitle")}</h2>

        <ol className="landing__steps list-unstyled row g-3 m-0">
          {STEPS.map((step, index) => (
            <li className="col-12 col-md-4" key={step}>
              <div className="landing__step h-100 text-start">
                <span className="landing__step-number">{index + 1}</span>
                <h3 className="h6 fw-bold mb-1">{t(`landing.steps.${step}.title`)}</h3>
                <p className="text-muted small m-0">{t(`landing.steps.${step}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="text-center mt-4">
          <Link className="landing__cta-bottom btn btn-primary btn-lg px-5" to="/signup">
            {t("landing.start")}
          </Link>
        </div>
      </section>
    </div>
  );
};
