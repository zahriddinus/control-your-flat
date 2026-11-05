import "./confetti.scss";
import { useEffect, useMemo, useState } from "react";

const COLORS = ["#0d6efd", "#6f42c1", "#20c997", "#ffc107", "#fd7e14", "#d63384"];
const PIECES = 48;
const DURATION = 3800;

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// Bir martalik konfetti: ekran tepasidan tushadi va o'zi yo'qoladi
export const Confetti = ({ onDone }) => {
  const [visible, setVisible] = useState(() => !prefersReducedMotion());

  // Har bir bo'lakning joyi, rangi va tezligi bir marta tasodifiy tanlanadi
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, index) => ({
        left: Math.random() * 100,
        color: COLORS[index % COLORS.length],
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 540,
        round: index % 3 === 0,
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, DURATION);

    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`confetti__piece ${piece.round ? "confetti__piece--round" : ""}`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            "--drift": `${piece.drift}px`,
            "--spin": `${piece.spin}deg`,
          }}
        ></span>
      ))}
    </div>
  );
};
