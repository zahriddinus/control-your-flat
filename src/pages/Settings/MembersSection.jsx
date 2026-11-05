import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useAuth } from "../../context/AuthContext";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";
import { ConfirmModal } from "../../components/ConfirmModal";

const ROLE_ORDER = { owner: 0, admin: 1, member: 2 };

// Huquqi borlar: ega va boshqaruvchilar. Oddiy a'zolar bu yerda chiqmaydi:
// boshqaruvchi tayinlash - Boshqaruv sahifasida, xonadoshni tahrirlash oynasida.
// Ega boshqaruvchining huquqini oladi, egalikni unga beradi yoki uni uydan chiqaradi.
// Hali qo'shilmagan, lekin boshqaruvchi qilib belgilanganlar ham "kutilmoqda" bilan chiqadi
export const MembersSection = ({ onNotice }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { flatId, isOwner, reload } = useFlat();
  const [members, setMembers] = useState([]);

  // Hisobsiz, lekin qo'shilganda boshqaruvchi bo'ladigan xonadoshlar (users.invite_role = 'admin')
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // { type: "transfer" | "remove", member } yoki { type: "pendingOwner", resident }
  const [confirm, setConfirm] = useState(null);

  const loadMembers = useCallback(async () => {
    const [membersResult, pendingResult] = await Promise.all([
      supabase
        .from("flat_members")
        .select("auth_user_id, role, resident_id, resident:users(name, last_name)")
        .eq("flat_id", flatId),
      supabase
        .from("users")
        .select("user_id, name, last_name, invite_role")
        .eq("flat_id", flatId)
        .in("invite_role", ["admin", "owner"]),
    ]);

    const error = membersResult.error ?? pendingResult.error;

    if (error) {
      console.error(error);
      return;
    }

    const linkedIds = new Set(membersResult.data.map((member) => member.resident_id));

    setMembers(
      membersResult.data
        .filter((member) => member.role !== "member")
        .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    );
    // Kutilayotgan ega birinchi
    setPending(
      pendingResult.data
        .filter((resident) => !linkedIds.has(resident.user_id))
        .sort((a, b) => ROLE_ORDER[a.invite_role] - ROLE_ORDER[b.invite_role])
    );
  }, [flatId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Amal bajarilgach ro'yxat va (rolim o'zgargan bo'lishi mumkin) joriy uy yangilanadi
  async function run(member, request, successKey) {
    setBusyId(member.auth_user_id);

    const { error } = await request;

    setBusyId(null);
    setConfirm(null);

    if (error) {
      console.error(error);
      onNotice(t("members.error"), "danger");
      return;
    }

    onNotice(t(successKey, { name: getName(member) }));
    await Promise.all([loadMembers(), reload()]);
  }

  const getName = (member) =>
    member.resident
      ? `${member.resident.name.trim()} ${member.resident.last_name ?? ""}`.trim()
      : "—";

  const toggleAdmin = (member) =>
    run(
      member,
      supabase.rpc("set_member_role", {
        p_flat: flatId,
        p_auth_user_id: member.auth_user_id,
        p_role: member.role === "admin" ? "member" : "admin",
      }),
      member.role === "admin" ? "members.demoted" : "members.promoted"
    );

  const transfer = (member) =>
    run(
      member,
      supabase.rpc("transfer_ownership", { p_flat: flatId, p_auth_user_id: member.auth_user_id }),
      "members.transferred"
    );

  const remove = (member) =>
    run(
      member,
      supabase
        .from("flat_members")
        .delete()
        .eq("flat_id", flatId)
        .eq("auth_user_id", member.auth_user_id),
      "members.removed"
    );

  async function cancelPending(resident) {
    setBusyId(resident.user_id);

    const { error } = await supabase
      .from("users")
      .update({ invite_role: "member" })
      .eq("user_id", resident.user_id);

    setBusyId(null);

    if (error) {
      console.error(error);
      onNotice(t("members.error"), "danger");
      return;
    }

    onNotice(t("members.demoted", { name: resident.name.trim() }));
    await loadMembers();
  }

  // Qo'shilganda ega bo'lsin (enabled) yoki buni bekor qilish - u boshqaruvchi bo'lib qoladi
  async function setPendingOwner(resident, enabled) {
    setBusyId(resident.user_id);

    const { error } = await supabase.rpc("set_pending_owner", {
      p_resident_id: resident.user_id,
      p_enabled: enabled,
    });

    setBusyId(null);
    setConfirm(null);

    if (error) {
      console.error(error);
      onNotice(t("members.error"), "danger");
      return;
    }

    const name = resident.name.trim();

    onNotice(t(enabled ? "members.pendingOwnerSet" : "members.pendingOwnerCancelled", { name }));
    await loadMembers();
  }

  // Boshqaruvchini faqat ega chiqaradi
  const canRemove = (member) =>
    member.auth_user_id !== user.id && member.role === "admin" && isOwner;

  return (
    <section className="settings__section card border-0 shadow-sm">
      <div className="card-body p-3 p-md-4 text-start">
        <h2 className="settings__section-title">{t("members.title")}</h2>

        <p className="small text-muted d-flex gap-2">
          <AppIcon name="bulb" className="flex-shrink-0 mt-1" />
          {t("members.hint")}
        </p>

        <ul className="list-unstyled d-flex flex-column gap-2 m-0">
          {members.map((member) => {
            const isMe = member.auth_user_id === user.id;
            const busy = busyId === member.auth_user_id;

            return (
              <li className="settings__member" key={member.auth_user_id}>
                <Avatar user={member.resident ?? { name: "?" }} size="sm" />

                <div className="flex-grow-1 overflow-hidden">
                  <span className="fw-semibold d-block text-truncate">
                    {getName(member)}
                    {isMe && <small className="text-muted fw-normal"> · {t("members.you")}</small>}
                  </span>

                  <span className={`settings__role settings__role--${member.role}`}>
                    {t(`control.roles.${member.role}`)}
                  </span>
                </div>

                <div className="settings__member-actions">
                  {isOwner && member.role === "admin" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => toggleAdmin(member)}
                        disabled={busy}
                      >
                        <AppIcon name="sliders" className="me-1" />
                        {t("members.demote")}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => setConfirm({ type: "transfer", member })}
                        disabled={busy}
                      >
                        <AppIcon name="shield" className="me-1" />
                        {t("members.transfer")}
                      </button>
                    </>
                  )}

                  {canRemove(member) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setConfirm({ type: "remove", member })}
                      disabled={busy}
                      title={t("members.remove")}
                      aria-label={t("members.remove")}
                    >
                      <AppIcon name="logout" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}

          {pending.map((resident) => (
            <li
              className="settings__member settings__member--pending"
              key={`pending-${resident.user_id}`}
            >
              <Avatar user={resident} size="sm" />

              <div className="flex-grow-1 overflow-hidden">
                <span className="fw-semibold d-block text-truncate">
                  {`${resident.name.trim()} ${resident.last_name ?? ""}`.trim()}
                </span>

                <span className={`settings__role settings__role--${resident.invite_role}`}>
                  {t(`control.roles.${resident.invite_role}`)} · {t("control.roles.pending")}
                </span>

                <small className="text-muted d-block mt-1">
                  {resident.invite_role === "owner"
                    ? t("members.pendingOwnerHint")
                    : t("members.pendingHint")}
                </small>
              </div>

              {isOwner && resident.invite_role === "admin" && (
                <div className="settings__member-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => cancelPending(resident)}
                    disabled={busyId === resident.user_id}
                  >
                    <AppIcon name="sliders" className="me-1" />
                    {t("members.demote")}
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => setConfirm({ type: "pendingOwner", resident })}
                    disabled={busyId === resident.user_id}
                  >
                    <AppIcon name="shield" className="me-1" />
                    {t("members.transfer")}
                  </button>
                </div>
              )}

              {isOwner && resident.invite_role === "owner" && (
                <div className="settings__member-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setPendingOwner(resident, false)}
                    disabled={busyId === resident.user_id}
                  >
                    <AppIcon name="close" className="me-1" />
                    {t("common.cancel")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Hozircha boshqaruvchi yo'q: qanday tayinlashni ko'rsatamiz */}
        {members.length === 1 && !pending.length && (
          <div className="settings__members-empty">
            <AppIcon name="send" className="flex-shrink-0 mt-1" />

            <div>
              <span className="d-block">{t("members.alone")}</span>
              <Link className="small" to="/control-users">
                {t("members.goInvite")}
              </Link>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm?.type === "transfer"}
        title={t("members.transferTitle")}
        icon="shield"
        confirmLabel={t("members.transfer")}
        confirmVariant="primary"
        loading={Boolean(busyId)}
        onConfirm={() => transfer(confirm.member)}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.type === "transfer" && (
          <p className="m-0">{t("members.transferQuestion", { name: getName(confirm.member) })}</p>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirm?.type === "pendingOwner"}
        title={t("members.transferTitle")}
        icon="shield"
        confirmLabel={t("members.transfer")}
        confirmVariant="primary"
        loading={Boolean(busyId)}
        onConfirm={() => setPendingOwner(confirm.resident, true)}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.type === "pendingOwner" && (
          <p className="m-0">
            {t("members.pendingOwnerQuestion", { name: confirm.resident.name.trim() })}
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirm?.type === "remove"}
        title={t("members.removeTitle")}
        icon="logout"
        confirmLabel={t("members.remove")}
        loading={Boolean(busyId)}
        onConfirm={() => remove(confirm.member)}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.type === "remove" && (
          <p className="m-0">{t("members.removeQuestion", { name: getName(confirm.member) })}</p>
        )}
      </ConfirmModal>
    </section>
  );
};
