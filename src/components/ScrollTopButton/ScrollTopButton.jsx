import "./scrollTopButton.scss";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";

// Shuncha piksel pastga tushganda tugma paydo bo'ladi
const SHOW_AFTER = 300;

// Atrofdagi halqa: sahifaning qancha qismi o'qilganini ko'rsatadi
const RING_RADIUS = 24;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export const ScrollTopButton = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      setVisible(scrollTop > SHOW_AFTER);
      setProgress(maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      type="button"
      className={`scroll-top ${visible ? "scroll-top--visible" : ""}`}
      onClick={scrollToTop}
      aria-label={t("scrollTop")}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg className="scroll-top__ring" viewBox="0 0 56 56" aria-hidden="true">
        <circle className="scroll-top__track" cx="28" cy="28" r={RING_RADIUS} />
        <circle
          className="scroll-top__progress"
          cx="28"
          cy="28"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
        />
      </svg>

      <AppIcon name="arrowUp" className="scroll-top__arrow" />
    </button>
  );
};
