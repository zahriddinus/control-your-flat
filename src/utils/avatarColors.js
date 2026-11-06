// Avatar ranglari: har bir xonadoshning o'z rangi (users.avatar_color).
// Tanlanmagan bo'lsa, ID'dan avtomatik olinadi - shuning uchun hamma sahifada bir xil turadi
export const AVATAR_COLORS = {
  blue: ["#3b82f6", "#1d4ed8"],
  indigo: ["#6366f1", "#4338ca"],
  purple: ["#a855f7", "#7e22ce"],
  pink: ["#ec4899", "#be185d"],
  red: ["#f87171", "#dc2626"],
  orange: ["#fb923c", "#ea580c"],
  amber: ["#fbbf24", "#d97706"],
  green: ["#4ade80", "#16a34a"],
  teal: ["#2dd4bf", "#0f766e"],
  cyan: ["#22d3ee", "#0891b2"],
};

const COLOR_KEYS = Object.keys(AVATAR_COLORS);

// Satrdan barqaror son: bir xil ID har doim bir xil rang beradi
const hashString = (text) => {
  let hash = 0;

  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

export const getAvatarColorKey = (user) => {
  if (user?.avatar_color && AVATAR_COLORS[user.avatar_color]) return user.avatar_color;

  const seed = user?.user_id ?? `${user?.name ?? ""}${user?.last_name ?? ""}`;

  return COLOR_KEYS[hashString(seed) % COLOR_KEYS.length];
};

export const getAvatarGradient = (colorKey) => {
  const [from, to] = AVATAR_COLORS[colorKey] ?? AVATAR_COLORS.blue;

  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
};
