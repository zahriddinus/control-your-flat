import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useTaskText } from "../../hooks/useTaskText";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";
import { TaskIcon } from "../../components/TaskIcon";
import { addDays, formatDate, formatLongDate } from "../../utils/date";
import { getAssigned } from "../../utils/schedule";

const ERROR_KEYS = {
  already_pending: "swaps.errors.pending",
  not_assigned: "swaps.errors.changed",
  past_day: "swaps.errors.changed",
};

const getErrorKey = (error) =>
  Object.entries(ERROR_KEYS).find(([code]) => error?.message?.includes(code))?.[1] ??
  "swaps.errors.unknown";

// "Kunlarimizni almashamizmi?": avval o'z navbatim, keyin o'sha vazifadagi boshqa odamning kuni.
// schedules[0] - bugun, keyingilari ketma-ket kunlar
export const SwapRequestModal = ({ isOpen, users, schedules, today, onClose, onSent }) => {
  const { t, lang } = useI18n();
  const taskText = useTaskText();
  const { flatId, residentId, tasks } = useFlat();

  const [mine, setMine] = useState(null);
  const [other, setOther] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useModalEffects(isOpen, onClose, !saving);

  useEffect(() => {
    if (!isOpen) return;

    setMine(null);
    setOther(null);
    setMessage("");
    setError(null);
  }, [isOpen]);

  // Mening yaqin navbatlarim: { task, index }
  const myTurns = useMemo(
    () =>
      schedules.flatMap((schedule, index) =>
        tasks
          .filter((task) => task.isAssigned(schedule, residentId))
          .map((task) => ({ task, index, key: `${task.key}-${index}` }))
      ),
    [schedules, tasks, residentId]
  );

  // O'sha vazifada boshqalarning navbatlari: { userId, index }
  const otherTurns = useMemo(() => {
    if (!mine) return [];

    return schedules.flatMap((schedule, index) =>
      index === mine.index
        ? []
        : getAssigned(schedule, mine.task.key)
            .filter((person) => person.user_id !== residentId)
            .map((person) => ({ userId: person.user_id, index, key: `${person.user_id}-${index}` }))
    );
  }, [mine, schedules, residentId]);

  if (!isOpen) return null;

  const dayLabel = (index) => formatLongDate(addDays(today, index), lang);
  const findUser = (id) => users.find((user) => user.user_id === id);

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const { error } = await supabase.rpc("create_swap_request", {
      p_flat: flatId,
      p_task: mine.task.key,
      p_from_day: formatDate(addDays(today, mine.index)),
      p_to_user: other.userId,
      p_to_day: formatDate(addDays(today, other.index)),
      p_message: message.trim() || null,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setError(getErrorKey(error));
      return;
    }

    onSent();
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
        aria-labelledby="swapRequestLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleClose()}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow rounded-4 text-start">
            <div className="modal-header border-0 pb-0">
              <h2
                className="modal-title fs-5 fw-bold d-flex align-items-center gap-2"
                id="swapRequestLabel"
              >
                <span
                  className="confirm-modal__icon confirm-modal__icon--primary"
                  aria-hidden="true"
                >
                  <AppIcon name="swap" />
                </span>
                {t("swaps.requestTitle")}
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
              {/* 1-QADAM: mening navbatim */}
              <h3 className="swap__step">
                <span>1</span>
                {t("swaps.stepMine")}
              </h3>

              {!myTurns.length && <p className="small text-muted">{t("swaps.noTurns")}</p>}

              <div className="swap__options mb-3">
                {myTurns.map((turn) => (
                  <button
                    type="button"
                    key={turn.key}
                    className={`swap__option ${mine?.key === turn.key ? "active" : ""}`}
                    onClick={() => {
                      setMine(turn);
                      setOther(null);
                    }}
                    disabled={saving}
                  >
                    <TaskIcon taskKey={turn.task.key} />
                    <span className="flex-grow-1">
                      <span className="fw-semibold d-block">{taskText(turn.task.key)}</span>
                      <small className="text-muted">{dayLabel(turn.index)}</small>
                    </span>
                  </button>
                ))}
              </div>

              {/* 2-QADAM: kimning qaysi kuni bilan */}
              {mine && (
                <>
                  <h3 className="swap__step">
                    <span>2</span>
                    {t("swaps.stepOther")}
                  </h3>

                  {!otherTurns.length && <p className="small text-muted">{t("swaps.noOthers")}</p>}

                  <div className="swap__options mb-3">
                    {otherTurns.map((turn) => {
                      const person = findUser(turn.userId);

                      return (
                        <button
                          type="button"
                          key={turn.key}
                          className={`swap__option ${other?.key === turn.key ? "active" : ""}`}
                          onClick={() => setOther(turn)}
                          disabled={saving}
                        >
                          <Avatar user={person ?? { name: "?" }} size="sm" />
                          <span className="flex-grow-1">
                            <span className="fw-semibold d-block">
                              {person?.name?.trim() ?? "—"}
                            </span>
                            <small className="text-muted">{dayLabel(turn.index)}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {mine && other && (
                <>
                  <label htmlFor="swapMessage" className="form-label small fw-semibold">
                    {t("swaps.message")}
                  </label>
                  <input
                    id="swapMessage"
                    className="form-control"
                    maxLength={200}
                    placeholder={t("swaps.messagePlaceholder")}
                    value={message}
                    onChange={(evt) => setMessage(evt.target.value)}
                    disabled={saving}
                  />
                </>
              )}

              {error && (
                <div
                  className="alert alert-danger d-flex align-items-center gap-2 py-2 mt-3 mb-0"
                  role="alert"
                >
                  <AppIcon name="alert" className="flex-shrink-0" />
                  {t(error)}
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
                type="button"
                className="btn btn-primary px-4"
                onClick={handleSubmit}
                disabled={saving || !mine || !other}
              >
                {saving && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {t("swaps.send")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
};
