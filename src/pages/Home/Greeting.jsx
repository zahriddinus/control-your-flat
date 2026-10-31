import { WeatherIcon } from "../../components/WeatherIcon";
import { formatUzDate, getDayOfYear } from "../../utils/date";

// Maslahat belgilari (16x16). Ba'zilari to'ldirilgan, ba'zilari chiziqli
const TIP_ICONS = {
  dishes: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.3" />
      <circle cx="8" cy="8" r="3.3" />
    </g>
  ),
  sparkles: (
    <path d="M7.66 6.25c.11-.33.57-.33.68 0l.65 1.94a2.9 2.9 0 0 0 1.83 1.82l1.93.65c.33.11.33.57 0 .68l-1.93.65a2.9 2.9 0 0 0-1.83 1.83l-.65 1.93a.36.36 0 0 1-.68 0l-.65-1.93a2.9 2.9 0 0 0-1.83-1.83l-1.93-.65a.36.36 0 0 1 0-.68l1.93-.65a2.9 2.9 0 0 0 1.83-1.82zM3.8 1.15a.22.22 0 0 1 .4 0l.4 1.16c.17.52.58.92 1.1 1.1l1.16.38a.22.22 0 0 1 0 .42l-1.16.38a1.7 1.7 0 0 0-1.1 1.1l-.4 1.16a.22.22 0 0 1-.4 0l-.39-1.16a1.7 1.7 0 0 0-1.1-1.1L1.15 4.2a.22.22 0 0 1 0-.42l1.16-.38a1.7 1.7 0 0 0 1.1-1.1z" />
  ),
  trash: (
    <path d="M6 1h4a1 1 0 0 1 1 1v1h3a.5.5 0 0 1 0 1h-.6l-.8 10.1A1 1 0 0 1 11.6 15H4.4a1 1 0 0 1-1-.9L2.6 4H2a.5.5 0 0 1 0-1h3V2a1 1 0 0 1 1-1m0 2h4V2H6z" />
  ),
  moon: <path d="M9 1.5a6.5 6.5 0 1 0 5.5 9.9A5.5 5.5 0 0 1 9 1.5z" />,
  fridge: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="3.5" y="1.2" width="9" height="13.6" rx="1.6" />
      <line x1="3.5" y1="6" x2="12.5" y2="6" />
      <line x1="10.3" y1="3" x2="10.3" y2="4.2" />
      <line x1="10.3" y1="8" x2="10.3" y2="10.5" />
    </g>
  ),
  heart: (
    <path
      fillRule="evenodd"
      d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
    />
  ),
  drop: <path d="M8 1.5S3 7 3 10a5 5 0 0 0 10 0c0-3-5-8.5-5-8.5z" />,
  bulb: (
    <>
      <path d="M8 1a4.6 4.6 0 0 0-2.7 8.3c.4.3.7.8.7 1.3V11.5h4v-.9c0-.5.3-1 .7-1.3A4.6 4.6 0 0 0 8 1z" />
      <rect x="6" y="12.4" width="4" height="1.5" rx=".75" />
    </>
  ),
  swap: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 5.5h10l-2.5-2.5" />
      <path d="M13.5 10.5h-10l2.5 2.5" />
    </g>
  ),
  shirt: (
    <path d="M5.5 1.5 1.5 4l1.7 3.2 1.8-.9V14.5h6V6.3l1.8.9L14.5 4l-4-2.5a2.5 2.5 0 0 1-5 0z" />
  ),
};

// Har kuni bittasi navbat bilan chiqadi
const TIPS = [
  { icon: "dishes", text: "Idishlarni o'sha kuni yuving, ertaga ular ikki barobar ko'p bo'ladi!" },
  { icon: "sparkles", text: "Oshxonadan chiqishdan oldin stolni artib qo'ying." },
  { icon: "trash", text: "Musor paketi to'lsa, navbatni kutmasdan tashlab yuboring!" },
  { icon: "moon", text: "Kechqurun shovqinni kamaytiring, kimdir dam olayotgan bo'lishi mumkin." },
  { icon: "fridge", text: "Muzlatgichdagi eski ovqatlarni bir kunda bir marta tekshiring." },
  { icon: "heart", text: "Boshqalarning narsasini so'ramasdan olmang!" },
  { icon: "drop", text: "Hammom va hojatxonani o'zingizdan keyin toza qoldiring!" },
  { icon: "bulb", text: "Chiroq va suvni behuda yoqib qoldirmang!" },
  { icon: "swap", text: "Navbatni almashtirmoqchi bo'lsangiz, oldindan kelishib oling." },
  { icon: "shirt", text: "Yuvilgan kiyimlarni quritgichda uzoq qoldirmang." },
];

const TipIcon = ({ name, className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    {TIP_ICONS[name]}
  </svg>
);

// Salomlashish va unga mos osmon manzarasi
const getGreeting = (hour) => {
  if (hour >= 5 && hour < 11) return { text: "Xayrli tong", scene: "sunrise", isDay: true };
  if (hour >= 11 && hour < 17) return { text: "Xayrli kun", scene: "clear", isDay: true };
  if (hour >= 17 && hour < 22) return { text: "Xayrli kech", scene: "sunset", isDay: true };

  return { text: "Xayrli tun", scene: "clear", isDay: false };
};

export const Greeting = ({ now }) => {
  const tip = TIPS[getDayOfYear(now) % TIPS.length];
  const greeting = getGreeting(now.getHours());

  return (
    <section className="home__greeting card border-0 shadow-sm mb-4 text-start">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="flex-grow-1">
            <p className="home__date mb-1">{formatUzDate(now)}</p>

            <h1 className="home__title fw-bold mb-1">{greeting.text}, xonadoshlar!</h1>

            <p className="home__subtitle m-0">Uydagi barcha navbatlar bir joyda.</p>
          </div>

          <div className="home__greeting-scene">
            <WeatherIcon type={greeting.scene} isDay={greeting.isDay} size="lg" />
          </div>
        </div>

        <div className="home__tip d-flex align-items-center gap-3">
          <span className="home__tip-badge">
            <TipIcon name={tip.icon} />
          </span>

          <div>
            <small className="home__tip-label d-flex align-items-center gap-1 mb-1">
              <TipIcon name="bulb" className="home__tip-bulb" />
              Kun maslahati
            </small>

            <span>{tip.text}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
