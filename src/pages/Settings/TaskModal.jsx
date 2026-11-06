import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import {
  DEFAULT_TASK_COLOR,
  DEFAULT_TASK_ICON,
  TASK_ICON_KEYS,
  TaskSvg,
} from "../../components/TaskIcon";
import { AVATAR_COLORS, getAvatarGradient } from "../../utils/avatarColors";

const EMPTY = { name: "", icon: "dishes", color: "teal", everyDays: 1, people: 1 };

// Vazifa qo'shish (task = null) yoki tahrirlash: nom, belgi va rang.
// O'rnatilgan vazifada nom bo'sh qolsa - asl nomi; "Asl holiga qaytarish" hammasini tiklaydi.
// Qoidalar (necha kunda, necha kishi) faqat qo'shishda; keyin ro'yxatning o'zida o'zgaradi
export const TaskModal = ({ isOpen, task, onClose, onSubmit }) => {
  const { t } = useI18n();
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const builtin = Boolean(task && !task.custom);
  const defaultName = builtin ? t(`tasks.${task.key}.title`) : "";

  useModalEffects(isOpen, onClose, !saving);

  useEffect(() => {
    if (!isOpen) return;

    setSaving(false);

    if (!task) {
      setValues(EMPTY);
      return;
    }

    setValues({
      ...EMPTY,
      name: task.name ?? "",
      icon: task.icon ?? DEFAULT_TASK_ICON[task.key] ?? "dishes",
      color: task.color ?? DEFAULT_TASK_COLOR[task.key] ?? "teal",
    });
  }, [isOpen, task]);

  if (!isOpen) return null;

  const set = (field, value) => setValues((prev) => ({ ...prev, [field]: value }));

  const resetBuiltin = () =>
    setValues((prev) => ({
      ...prev,
      name: "",
      icon: DEFAULT_TASK_ICON[task.key],
      color: DEFAULT_TASK_COLOR[task.key],
    }));

  async function handleSubmit(evt) {
    evt.preventDefault();

    if (!builtin && !values.name.trim()) return;

    setSaving(true);

    // O'rnatilgan vazifada asl belgi va rang bo'sh saqlanadi - keyin ham "asl holi" bo'lib qoladi
    await onSubmit({
      ...values,
      name: values.name.trim(),
      icon: builtin && values.icon === DEFAULT_TASK_ICON[task.key] ? "" : values.icon,
      color: builtin && values.color === DEFAULT_TASK_COLOR[task.key] ? "" : values.color,
      everyDays: Math.min(31, Math.max(1, Number(values.everyDays) || 1)),
      people: Math.min(4, Math.max(1, Number(values.people) || 1)),
    });

    setSaving(false);
  }

  const handleClose = () => {
    if (!saving) onClose();
  };

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="taskModalLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            className="modal-content border-0 shadow rounded-4 text-start"
            onSubmit={handleSubmit}
          >
            <div className="modal-header border-0 pb-0">
              <h2
                className="modal-title fs-5 fw-bold d-flex align-items-center gap-2"
                id="taskModalLabel"
              >
                <span
                  className="task-icon task-icon--custom task-icon--md"
                  style={{ background: getAvatarGradient(values.color) }}
                  aria-hidden="true"
                >
                  <TaskSvg icon={values.icon} />
                </span>
                {task ? t("tasksEditor.editTitle") : t("tasksEditor.addTitle")}
              </h2>

              <button
                type="button"
                className="btn-close"
                aria-label={t("common.close")}
                onClick={handleClose}
                disabled={saving}
              ></button>
            </div>

            <div className="modal-body">
              <label htmlFor="taskName" className="form-label small fw-semibold">
                {t("tasksEditor.name")}
              </label>
              <input
                id="taskName"
                className="form-control mb-3"
                maxLength={40}
                placeholder={builtin ? defaultName : t("tasksEditor.namePlaceholder")}
                value={values.name}
                onChange={(evt) => set("name", evt.target.value)}
                disabled={saving}
                autoFocus
                required={!builtin}
              />

              <span className="form-label small fw-semibold d-block">{t("tasksEditor.icon")}</span>
              <div
                className="task-editor__icons mb-3"
                role="radiogroup"
                aria-label={t("tasksEditor.icon")}
              >
                {TASK_ICON_KEYS.map((iconKey) => (
                  <button
                    type="button"
                    key={iconKey}
                    className={`task-editor__icon ${values.icon === iconKey ? "active" : ""}`}
                    onClick={() => set("icon", iconKey)}
                    aria-pressed={values.icon === iconKey}
                    aria-label={iconKey}
                    disabled={saving}
                  >
                    <TaskSvg icon={iconKey} />
                  </button>
                ))}
              </div>

              <span className="form-label small fw-semibold d-block">{t("tasksEditor.color")}</span>
              <div
                className="task-editor__colors mb-3"
                role="radiogroup"
                aria-label={t("tasksEditor.color")}
              >
                {Object.keys(AVATAR_COLORS).map((colorKey) => (
                  <button
                    type="button"
                    key={colorKey}
                    className={`task-editor__color ${values.color === colorKey ? "active" : ""}`}
                    style={{ background: getAvatarGradient(colorKey) }}
                    onClick={() => set("color", colorKey)}
                    aria-pressed={values.color === colorKey}
                    aria-label={colorKey}
                    disabled={saving}
                  >
                    {values.color === colorKey && <AppIcon name="check" />}
                  </button>
                ))}
              </div>

              {builtin && (
                <button
                  type="button"
                  className="btn btn-sm btn-link px-0"
                  onClick={resetBuiltin}
                  disabled={saving}
                >
                  <AppIcon name="auto" className="me-1" />
                  {t("tasksEditor.reset")}
                </button>
              )}

              {!task && (
                <div className="row g-3">
                  <div className="col-6">
                    <label htmlFor="taskEvery" className="form-label small fw-semibold">
                      {t("settings.everyDays")}
                    </label>
                    <input
                      id="taskEvery"
                      type="number"
                      min={1}
                      max={31}
                      className="form-control"
                      value={values.everyDays}
                      onChange={(evt) => set("everyDays", evt.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="col-6">
                    <label htmlFor="taskPeople" className="form-label small fw-semibold">
                      {t("settings.people")}
                    </label>
                    <input
                      id="taskPeople"
                      type="number"
                      min={1}
                      max={4}
                      className="form-control"
                      value={values.people}
                      onChange={(evt) => set("people", evt.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={saving || (!builtin && !values.name.trim())}
              >
                {saving && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {task ? t("settings.save") : t("tasksEditor.add")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
};
