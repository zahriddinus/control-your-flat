import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { useTaskText } from "../../hooks/useTaskText";
import { Avatar } from "../../components/Avatar";
import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { formatLongDate, parseDate } from "../../utils/date";
import { SwapRequestModal } from "./SwapRequestModal";
import { vibrate } from "../../hooks/useGestures";

// Navbat almashish: menga kelgan so'rovlar, men yuborganlar va yangi so'rov.
// onChanged - so'rov qabul qilinsa, navbatlar va lenta yangilanadi
export const SwapCenter = ({ users, schedules, today, onChanged, onNotice }) => {
  const { t, lang } = useI18n();
  const taskText = useTaskText();
  const { flatId, residentId } = useFlat();
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("swap_requests")
      .select("id, task, from_user, from_day, to_user, to_day, message, created_at")
      .eq("flat_id", flatId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRequests(data);
  }, [flatId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const incoming = requests.filter((request) => request.to_user === residentId);
  const outgoing = requests.filter((request) => request.from_user === residentId);

  const nameOf = (id) => users.find((user) => user.user_id === id)?.name?.trim() ?? "—";
  const userOf = (id) => users.find((user) => user.user_id === id) ?? { name: "?" };
  const dayText = (value) => formatLongDate(parseDate(value), lang);

  async function run(id, request, successKey, changesSchedule) {
    setBusyId(id);
    vibrate();

    const { error } = await request;

    setBusyId(null);

    if (error) {
      console.error(error);
      onNotice(t("swaps.errors.changed"), "danger");
      await loadRequests();
      return;
    }

    onNotice(t(successKey));
    await loadRequests();
    if (changesSchedule) onChanged();
  }

  const respond = (request, accept) =>
    run(
      request.id,
      supabase.rpc("respond_swap_request", { p_id: request.id, p_accept: accept }),
      accept ? "swaps.accepted" : "swaps.declined",
      accept
    );

  const cancel = (request) =>
    run(
      request.id,
      supabase.rpc("cancel_swap_request", { p_id: request.id }),
      "swaps.cancelled",
      false
    );

  if (!residentId) return null;

  return (
    <section className="home__swaps card border-0 shadow-sm mb-4 text-start">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <h2 className="home__section-title d-flex align-items-center gap-2 m-0">
            <AppIcon name="swap" />
            {t("swaps.title")}
            {incoming.length > 0 && (
              <span className="badge rounded-pill text-bg-danger">{incoming.length}</span>
            )}
          </h2>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary text-nowrap"
            onClick={() => setModalOpen(true)}
          >
            <AppIcon name="plus" className="me-1" />
            {t("swaps.ask")}
          </button>
        </div>

        {!incoming.length && !outgoing.length && (
          <p className="small text-muted m-0">{t("swaps.hint")}</p>
        )}

        {/* Menga kelgan so'rovlar */}
        {incoming.map((request) => (
          <div className="home__swap home__swap--incoming" key={request.id}>
            <Avatar user={userOf(request.from_user)} size="sm" />

            <div className="flex-grow-1">
              <span className="d-block">
                {t("swaps.incoming", {
                  name: nameOf(request.from_user),
                  fromDay: dayText(request.from_day),
                  toDay: dayText(request.to_day),
                })}
              </span>
              <small className="text-muted d-inline-flex align-items-center gap-1">
                <TaskIcon taskKey={request.task} />
                {taskText(request.task)}
                {request.message && <> · «{request.message}»</>}
              </small>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => respond(request, true)}
                disabled={busyId === request.id}
              >
                <AppIcon name="check" className="me-1" />
                {t("swaps.accept")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => respond(request, false)}
                disabled={busyId === request.id}
              >
                {t("swaps.decline")}
              </button>
            </div>
          </div>
        ))}

        {/* Men yuborganlar */}
        {outgoing.map((request) => (
          <div className="home__swap" key={request.id}>
            <Avatar user={userOf(request.to_user)} size="sm" />

            <div className="flex-grow-1">
              <span className="d-block">
                {t("swaps.outgoing", {
                  name: nameOf(request.to_user),
                  fromDay: dayText(request.from_day),
                  toDay: dayText(request.to_day),
                })}
              </span>
              <small className="text-muted d-inline-flex align-items-center gap-1">
                <TaskIcon taskKey={request.task} />
                {taskText(request.task)} · {t("swaps.waiting")}
              </small>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => cancel(request)}
              disabled={busyId === request.id}
            >
              {t("common.cancel")}
            </button>
          </div>
        ))}
      </div>

      <SwapRequestModal
        isOpen={modalOpen}
        users={users}
        schedules={schedules}
        today={today}
        onClose={() => setModalOpen(false)}
        onSent={async () => {
          setModalOpen(false);
          vibrate();
          onNotice(t("swaps.sent"));
          await loadRequests();
          onChanged();
        }}
      />
    </section>
  );
};
