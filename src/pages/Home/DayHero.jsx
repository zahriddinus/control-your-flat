import { useState } from "react";
import { Avatar } from "../../components/Avatar";
import { useI18n } from "../../i18n";

// Bootstrap Icons
const TROPHY_PATH =
  "M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935";
const HEART_PATH = "M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314";

const Icon = ({ path, className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d={path} />
  </svg>
);

// Rahmat aytilganda uchib chiqadigan yuraklar soni
const HEARTS_COUNT = 6;

// Bugungi navbatchiga kichik minnatdorchilik.
// "Rahmat" faqat animatsiya: hech qayerga saqlanmaydi
export const DayHero = ({ users, schedule }) => {
  const { t } = useI18n();
  const [thanked, setThanked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const hero = users.find((user) => user.user_id === schedule?.duty?.user_id);

  if (!hero) return null;

  function handleThanks() {
    setThanked(true);

    // Har bosilganda yuraklar qaytadan uchadi
    setBurstKey((prev) => prev + 1);
  }

  return (
    <section className="home__hero card border-0 shadow-sm mb-4">
      <div className="card-body d-flex flex-wrap align-items-center gap-3 text-start">
        <div className="home__hero-avatar">
          <Avatar user={hero} size="lg" />

          <span className="home__hero-badge">
            <Icon path={TROPHY_PATH} />
          </span>
        </div>

        <div className="flex-grow-1 overflow-hidden">
          <span className="home__hero-label">
            <Icon path={TROPHY_PATH} className="home__hero-label-icon" />
            {t("home.hero.label")}
          </span>

          <h3 className="home__hero-name fw-bold m-0 text-truncate">
            {hero.name.trim()} {hero.last_name}
          </h3>

          <span className="text-muted">{t("home.hero.text")}</span>
        </div>

        <button
          type="button"
          className={`home__hero-thanks btn btn-sm ${thanked ? "thanked" : ""}`}
          onClick={handleThanks}
        >
          <Icon path={HEART_PATH} className="home__hero-heart" />
          {thanked ? t("home.hero.thanked") : t("home.hero.thank")}

          {burstKey > 0 && (
            <span className="home__hero-burst" key={burstKey} aria-hidden="true">
              {Array.from({ length: HEARTS_COUNT }, (_, index) => (
                <Icon
                  path={HEART_PATH}
                  className={`home__hero-burst-heart heart-${index}`}
                  key={index}
                />
              ))}
            </span>
          )}
        </button>
      </div>
    </section>
  );
};
