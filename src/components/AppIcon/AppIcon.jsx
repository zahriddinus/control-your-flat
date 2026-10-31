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
