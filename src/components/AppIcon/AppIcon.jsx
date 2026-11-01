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
