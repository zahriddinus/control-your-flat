import "./loading.scss";
import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";

// Kulgili yozuvlar shu oraliqda almashadi
const PHRASE_INTERVAL_MS = 1500;

// Yuklanish ekrani: logotipdagi uycha o'zi chiziladi, ichida yurak uradi,
// ostida yozuvlar almashib turadi
export const Loading = () => {
  const { t } = useI18n();
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrases = t("common.loadingPhrases");

  useEffect(() => {
    const timer = setInterval(() => setPhraseIndex((prev) => prev + 1), PHRASE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading__logo" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          {/* pathLength="1": chizish animatsiyasi uzunlikdan qat'i nazar bir xil ishlaydi */}
          <path
            className="app-loading__house"
            pathLength="1"
            d="M3 11 12 4l9 7M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"
          />
          <g transform="translate(8.6 11.3) scale(0.43)">
            <path
              className="app-loading__heart"
              d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
            />
          </g>
        </svg>
      </div>

      <p className="app-loading__text">
        {/* key o'zgarsa, yozuv qayta "suzib" chiqadi */}
        <span className="app-loading__phrase" key={phraseIndex}>
          {phrases[phraseIndex % phrases.length]}
        </span>

        <span className="app-loading__dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </p>

      <span className="visually-hidden">{t("common.loading")}</span>
    </div>
  );
};
