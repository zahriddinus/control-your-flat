import { useCallback } from "react";
import { useFlat } from "../context/FlatContext";
import { useI18n } from "../i18n";

// Vazifa nomi: o'rnatilganlari tarjimadan (tasks.<kalit>.title / .label), lekin nomi o'zgartirilgan
// bo'lsa - shu nom. O'z vazifasi - har doim o'z nomi.
// const taskText = useTaskText(); taskText("duty", "label")
export const useTaskText = () => {
  const { t } = useI18n();
  const { taskByKey } = useFlat();

  return useCallback(
    (taskKey, kind = "label") => {
      const task = taskByKey[taskKey];

      return task?.name || t(`tasks.${taskKey}.${kind}`);
    },
    [t, taskByKey]
  );
};
