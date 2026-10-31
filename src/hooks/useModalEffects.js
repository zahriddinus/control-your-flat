import { useEffect } from "react";

// Modal ochiqligida orqa sahifa aylanmaydi va Escape bilan yopiladi.
// canClose false bo'lsa (masalan, saqlash paytida), Escape ishlamaydi
export const useModalEffects = (isOpen, onClose, canClose = true) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canClose) return;

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, canClose, onClose]);
};
