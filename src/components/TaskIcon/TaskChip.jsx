import { TaskIcon } from "./TaskIcon";

// Rangli yorliq: vazifa ikonkasi va ismlar. mine/dim - "Kimniki" filtri uchun.
// span: tugma ichida ham ishlatiladi (button ichiga div qo'yib bo'lmaydi)
export const TaskChip = ({ taskKey, names, title, mine = false, dim = false, className = "" }) => {
  const stateClass = mine ? "task-chip--mine" : dim ? "task-chip--dim" : "";

  return (
    <span
      className={`task-chip task-chip--${taskKey} ${stateClass} small ${className}`}
      title={title}
    >
      <TaskIcon taskKey={taskKey} />

      <span className="task-chip__name">{names}</span>
    </span>
  );
};
