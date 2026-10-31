import "./weatherIcon.scss";

// Animatsiyali ob-havo belgilari. Hammasi 64x64 maydonda chiziladi

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const Sun = ({ cx = 32, cy = 32, r = 11 }) => (
  <g className="wi-sun">
    <g className="wi-sun-rays">
      {RAY_ANGLES.map((angle) => {
        const radians = (angle * Math.PI) / 180;

        return (
          <line
            key={angle}
            x1={cx + Math.cos(radians) * (r + 4)}
            y1={cy + Math.sin(radians) * (r + 4)}
            x2={cx + Math.cos(radians) * (r + 9)}
            y2={cy + Math.sin(radians) * (r + 9)}
          />
        );
      })}
    </g>

    <circle className="wi-sun-core" cx={cx} cy={cy} r={r} />
  </g>
);

const Moon = () => (
  <g className="wi-moon">
    <path className="wi-moon-body" d="M38 12a18 18 0 1 0 14 30A15 15 0 0 1 38 12z" />
    <circle className="wi-star" cx="14" cy="14" r="1.6" />
    <circle className="wi-star wi-star--late" cx="22" cy="6" r="1.2" />
    <circle className="wi-star" cx="52" cy="10" r="1.4" />
  </g>
);

// Bulut: offsetY - yuqoriga/pastga surish, variant - "front" (oq) yoki "back" (kulrang)
const Cloud = ({ offsetY = 0, variant = "front", scale = 1, offsetX = 0 }) => (
  <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
    <path
      className={`wi-cloud wi-cloud--${variant}`}
      d="M18 50H46A10 10 0 0 0 47.6 30.1A14 14 0 0 0 20.4 27A11.5 11.5 0 0 0 18 50Z"
    />
  </g>
);

const Drops = () => (
  <g className="wi-drops">
    {[22, 32, 42].map((x, index) => (
      <line key={x} className={`wi-drop wi-delay-${index}`} x1={x} y1="46" x2={x - 2} y2="53" />
    ))}
  </g>
);

const Flakes = () => (
  <g className="wi-flakes">
    {[22, 32, 42].map((x, index) => (
      <circle key={x} className={`wi-flake wi-delay-${index}`} cx={x} cy="49" r="2.4" />
    ))}
  </g>
);

const Bolt = () => (
  <polygon className="wi-bolt" points="34,40 25,53 32,53 29,62 40,48 33,48 36,40" />
);

const Fog = () => (
  <g className="wi-fog">
    <line className="wi-fog-line" x1="12" y1="52" x2="44" y2="52" />
    <line className="wi-fog-line wi-delay-1" x1="20" y1="58" x2="52" y2="58" />
  </g>
);

// Tong va kech: ufq chizig'idan chiqayotgan/botayotgan quyosh
const Horizon = ({ evening }) => (
  <>
    <defs>
      <clipPath id="wi-horizon-clip">
        <rect x="0" y="0" width="64" height="44" />
      </clipPath>
    </defs>

    <g clipPath="url(#wi-horizon-clip)">
      <g className={`wi-horizon-sun ${evening ? "wi-horizon-sun--evening" : ""}`}>
        <Sun cx={32} cy={44} r={12} />
      </g>
    </g>

    <line className="wi-horizon" x1="6" y1="44" x2="58" y2="44" />
    <line className="wi-horizon wi-horizon--short" x1="18" y1="51" x2="46" y2="51" />
  </>
);

const renderScene = (type, isDay) => {
  switch (type) {
    case "sunrise":
      return <Horizon />;

    case "sunset":
      return <Horizon evening />;

    case "clear":
      return isDay ? <Sun /> : <Moon />;

    case "partly":
      return (
        <>
          {isDay ? <Sun cx={24} cy={22} r={9} /> : <Moon />}
          <g className="wi-drift">
            <Cloud offsetX={6} offsetY={6} scale={0.9} />
          </g>
        </>
      );

    case "cloudy":
      return (
        <>
          <g className="wi-drift wi-drift--slow">
            <Cloud variant="back" offsetX={14} offsetY={-6} scale={0.75} />
          </g>
          <g className="wi-drift">
            <Cloud offsetY={2} />
          </g>
        </>
      );

    case "fog":
      return (
        <>
          <Cloud offsetY={-8} />
          <Fog />
        </>
      );

    case "rain":
      return (
        <>
          <Cloud offsetY={-8} />
          <Drops />
        </>
      );

    case "snow":
      return (
        <>
          <Cloud offsetY={-8} />
          <Flakes />
        </>
      );

    case "thunder":
      return (
        <>
          <Cloud variant="back" offsetY={-8} />
          <Bolt />
        </>
      );

    default:
      return <Cloud />;
  }
};

// type: getWeatherInfo(code).type yoki "sunrise" / "sunset", size: "md" | "lg"
export const WeatherIcon = ({ type, isDay = true, size = "md" }) => {
  return (
    <svg
      className={`weather-icon weather-icon--${size}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      {renderScene(type, isDay)}
    </svg>
  );
};
