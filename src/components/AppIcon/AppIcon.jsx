// Sayt bo'ylab ishlatiladigan chiziqli belgilar (16x16, currentColor)
const ICONS = {
  home: <path d="M2.5 7 8 2.5 13.5 7v6.5a1 1 0 0 1-1 1h-3v-4h-3v4h-3a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3M5.7 10.2l1.6 1.6 3.2-3.3" />
    </>
  ),
  users: (
    <>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.5 14a4.5 4.5 0 0 1 9 0" />
      <circle cx="11.5" cy="6" r="2" />
      <path d="M11.2 9.6a3.6 3.6 0 0 1 3.3 4" />
    </>
  ),
  // Boshqaruv slayderlari
  sliders: (
    <>
      <path d="M2 4h6.5M12.5 4H14M2 12h2.5M8.5 12H14" />
      <circle cx="10.5" cy="4" r="2" />
      <circle cx="6.5" cy="12" r="2" />
    </>
  ),
  logout: <path d="M6.5 2.5h-3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3M10.5 5l3 3-3 3M13.5 8H6" />,
  chevron: <path d="m4 6 4 4 4-4" />,
  arrowUp: <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />,
  globe: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M1.5 8h13M8 1.5c1.9 2 2.8 4.2 2.8 6.5S9.9 12.5 8 14.5M8 1.5C6.1 3.5 5.2 5.7 5.2 8s.9 4.5 2.8 6.5" />
    </>
  ),
  check: <path d="m3 8.5 3 3 7-7" />,
  user: (
    <>
      <circle cx="8" cy="5.5" r="2.8" />
      <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
    </>
  ),
  shield: <path d="M8 1.5 3 3.5v4c0 3.2 2.1 5.8 5 7 2.9-1.2 5-3.8 5-7v-4zM6 8l1.5 1.5 2.7-3" />,
  phone: (
    <path d="M5 1.5h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM7 12h2" />
  ),
  // Telegram'ga o'xshash qog'oz samolyot
  send: <path d="M14.5 1.5 7 9M14.5 1.5 10 14.5 7 9 1.5 6z" />,
  cake: (
    <path d="M2.5 14h11M3.5 14V9.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1V14M3.5 11.5c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0M8 8.5V6.5M8 4.5c.8-.6.8-1.6 0-2.5-.8.9-.8 1.9 0 2.5z" />
  ),
  edit: <path d="m11 2.5 2.5 2.5L6 12.5l-3 .5.5-3zM9.5 4 12 6.5" />,
  trash: (
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.3a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4M6.8 6.5v5M9.2 6.5v5" />
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  swap: <path d="M2.5 5.5h10l-2.5-2.5M13.5 10.5h-10l2.5 2.5" />,
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  bulb: (
    <path d="M6 13.5h4M6.5 11.5h3M8 1.5a4.5 4.5 0 0 0-2.6 8.2c.4.3.6.7.6 1.2v.6h4v-.6c0-.5.2-.9.6-1.2A4.5 4.5 0 0 0 8 1.5z" />
  ),
  lock: (
    <>
      <rect x="3" y="7" width="10" height="7.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2M8 10v1.5" />
    </>
  ),
  mail: (
    <>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="m2 4 6 5 6-5" />
    </>
  ),
  eye: (
    <>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
      <path d="m2.5 2.5 11 11" />
    </>
  ),
  alert: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.8v3.7M8 11.2h.01" />
    </>
  ),
  table: (
    <>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M2 6.5h12M2 10h12M6 2.5v11" />
    </>
  ),
  calendarPlus: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3M8 8.5v4M6 10.5h4" />
    </>
  ),
  // Bulut ortidan chiqqan quyosh: ob-havo
  weather: (
    <>
      <path d="M4.5 4.2a2.6 2.6 0 0 1 4.6.4M6 1v1M2 3l.7.7M1.5 6.5h1" />
      <path d="M4.5 14h7a2.5 2.5 0 0 0 .3-5 3.5 3.5 0 0 0-6.7-.8A2.9 2.9 0 0 0 4.5 14z" />
    </>
  ),
  // Buklangan xarita
  map: <path d="M1.5 3.5 5.5 2l5 2 4-1.5v10l-4 1.5-5-2-4 1.5zM5.5 2v10M10.5 4v10" />,
  pin: (
    <>
      <path d="M8 14.5s4.5-4.2 4.5-8a4.5 4.5 0 0 0-9 0c0 3.8 4.5 8 4.5 8z" />
      <circle cx="8" cy="6.5" r="1.6" />
    </>
  ),
  chat: (
    <path d="M2.5 3.5h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H7l-3 2.5V12H2.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM5 7.5h6" />
  ),
  sun: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
    </>
  ),
  moon: <path d="M13.5 9.6A5.6 5.6 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1z" />,
  // Yarmi to'ldirilgan doira: avtomatik rejim
  auto: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" stroke="none" />
    </>
  ),
};

export const AppIcon = ({ name, className = "" }) => (
  <svg
    className={`app-icon ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

// Logotip: uycha va ichida yurak - "uy" va "xonadoshlar"
export const LogoIcon = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
  >
    <path
      d="M3 11 12 4l9 7M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      transform="translate(8.6 11.3) scale(0.43)"
      fill="currentColor"
      fillRule="evenodd"
      d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
    />
  </svg>
);
