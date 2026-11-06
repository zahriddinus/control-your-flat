import { useFlat } from "../../context/FlatContext";
import { TaskIcon, getTaskChipStyle } from "./TaskIcon";

// Rangli yorliq: vazifa ikonkasi va ismlar. mine/dim - "Kimniki" filtri uchun.
// span: tugma ichida ham ishlatiladi (button ichiga div qo'yib bo'lmaydi)
export const TaskChip = ({ taskKey, names, title, mine = false, dim = false, className = "" }) => {
  const flatContext = useFlat();
  const task = flatContext?.taskByKey?.[taskKey];
  const stateClass = mine ? "task-chip--mine" : dim ? "task-chip--dim" : "";

  return (
    <span
      className={`task-chip task-chip--${task?.custom || task?.color ? "custom" : taskKey} ${stateClass} small ${className}`}
      style={getTaskChipStyle(task)}
      title={title}
    >
      <TaskIcon taskKey={taskKey} />

      <span className="task-chip__name">{names}</span>
    </span>
  );
};
