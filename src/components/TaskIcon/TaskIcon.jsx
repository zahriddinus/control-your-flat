import "./taskIcon.scss";
import { useFlat } from "../../context/FlatContext";
import { AVATAR_COLORS, getAvatarGradient } from "../../utils/avatarColors";

// Vazifa belgilari (16x16). fill - to'ldirilgan (Bootstrap Icons), stroke - chiziqli.
// Kalitlar bazada flat_tasks.icon; bo'sh bo'lsa o'rnatilgan vazifa o'z belgisini oladi
const TASK_ICONS = {
  star: {
    fill: "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z",
  },
  bin: {
    fill: "M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5",
  },
  sparkles: {
    fill: "M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z",
  },
  dishes: {
    stroke: (
      <>
        <circle cx="8" cy="8" r="6" />
        <circle cx="8" cy="8" r="3" />
      </>
    ),
  },
  plant: {
    stroke: (
      <path d="M5 10h6l-1 4.5H6zM8 10V6.5M8 7.5c0-2.2 1.6-3.8 4.2-3.8 0 2.2-1.6 3.8-4.2 3.8zM8 8.5c0-1.9-1.4-3.2-3.7-3.2 0 1.9 1.4 3.2 3.7 3.2z" />
    ),
  },
  laundry: {
    stroke: (
      <>
        <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
        <circle cx="8" cy="9" r="3" />
        <path d="M3 4.5h10M5 3h.01" />
      </>
    ),
  },
  cart: {
    stroke: (
      <>
        <path d="M1.5 2h2l1.6 8h7.4l1.5-5.5H4.3" />
        <circle cx="6" cy="13" r="1" />
        <circle cx="12" cy="13" r="1" />
      </>
    ),
  },
  bath: {
    stroke: (
      <path d="M2 8h12v1.5a3.5 3.5 0 0 1-3.5 3.5h-5A3.5 3.5 0 0 1 2 9.5zM4 8V3.5a1.5 1.5 0 0 1 3 0M4.5 13 4 14.5M11.5 13l.5 1.5" />
    ),
  },
  pet: {
    stroke: (
      <>
        <circle cx="4.5" cy="6.5" r="1.2" />
        <circle cx="7" cy="4.3" r="1.2" />
        <circle cx="9.5" cy="4.3" r="1.2" />
        <circle cx="12" cy="6.5" r="1.2" />
        <path d="M8.2 8.5c-2 0-3.5 2-3.5 3.5 0 1.2 1 1.8 2 1.5.6-.2 1-.4 1.5-.4s.9.2 1.5.4c1 .3 2-.3 2-1.5 0-1.5-1.5-3.5-3.5-3.5z" />
      </>
    ),
  },
  cook: {
    stroke: (
      <path d="M2.5 7h11M3.5 7v5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V7M1 7h1.5M13.5 7H15M6 4.5c0-1 1-1 1-2M9 4.5c0-1 1-1 1-2" />
    ),
  },
  broom: {
    stroke: (
      <path d="m10.5 1.5-3.5 5.5M5 7.5l4 2.5-1.5 4.5c-2 0-4.5-1.5-5-4zM4 11l1.5-1.5M6 12.5 7 11" />
    ),
  },
  window: {
    stroke: (
      <>
        <rect x="2.5" y="2" width="11" height="12" rx="1" />
        <path d="M8 2v12M2.5 8h11" />
      </>
    ),
  },
  water: {
    stroke: <path d="M8 1.5S3.5 6.5 3.5 10a4.5 4.5 0 0 0 9 0C12.5 6.5 8 1.5 8 1.5z" />,
  },
};

export const TASK_ICON_KEYS = Object.keys(TASK_ICONS);

// O'rnatilgan vazifalarning asl belgisi va rangi
export const DEFAULT_TASK_ICON = { duty: "star", rubbish: "bin", cleaning: "sparkles" };
export const DEFAULT_TASK_COLOR = { duty: "blue", rubbish: "green", cleaning: "orange" };

// Faqat belgining o'zi (svg): oynalarda ham ishlatiladi
export const TaskSvg = ({ icon }) => {
  const shape = TASK_ICONS[icon] ?? TASK_ICONS.broom;

  if (shape.fill) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d={shape.fill} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape.stroke}
    </svg>
  );
};

// Rang tanlangan (yoki o'z vazifasi) bo'lsa - inline gradient, aks holda o'rnatilgan rang (CSS)
const hasOwnColor = (task) => Boolean(task?.custom || task?.color);

export const getTaskColorStyle = (task) =>
  hasOwnColor(task) ? { background: getAvatarGradient(task.color ?? "blue") } : undefined;

// Chip uchun: tanlangan rangdagi yozuv va och fon
export const getTaskChipStyle = (task) => {
  if (!hasOwnColor(task)) return undefined;

  const [, dark] = AVATAR_COLORS[task.color] ?? AVATAR_COLORS.blue;

  return { color: dark, backgroundColor: `${dark}1f` };
};

// taskKey: o'rnatilgan ("duty" | "rubbish" | "cleaning") yoki uyning o'z vazifasi kaliti.
// size: "sm" | "md" | "lg"
export const TaskIcon = ({ taskKey, size = "sm" }) => {
  const flatContext = useFlat();
  const task = flatContext?.taskByKey?.[taskKey];
  const icon = task?.icon ?? DEFAULT_TASK_ICON[taskKey] ?? "broom";
  const colorClass = hasOwnColor(task) ? "task-icon--custom" : `task-icon--${taskKey}`;

  return (
    <span
      className={`task-icon ${colorClass} task-icon--${size}`}
      style={getTaskColorStyle(task)}
      aria-hidden="true"
    >
      <TaskSvg icon={icon} />
    </span>
  );
};
