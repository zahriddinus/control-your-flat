import { useState } from "react";
import { Avatar } from "../../components/Avatar";
import { useI18n } from "../../i18n";
import { EmailLink, NicknameLink, PhoneLink, RoleBadges, UserActions } from "./UserParts";

// Katta ekran uchun: qatorni sudrab navbatni o'zgartirish mumkin
export const UsersTable = ({
  users,
  orderColumn,
  todayIds,
  todayTaskKey,
  pairMode,
  currentUserId,
  busy,
  swapSourceId,
  onMove,
  onSwap,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();
  const [draggedId, setDraggedId] = useState(null);
  const [overId, setOverId] = useState(null);

  const resetDrag = () => {
    setDraggedId(null);
    setOverId(null);
  };

  function handleDrop(targetUser) {
    const draggedUser = users.find((user) => user.user_id === draggedId);

    resetDrag();

    if (draggedUser && draggedUser.user_id !== targetUser.user_id) {
      onMove(draggedUser, targetUser[orderColumn]);
    }
  }

  // "source" - almashtirish uchun tanlangan, "target" - u bilan almashtirsa bo'ladi
  const getSwapState = (user) => {
    if (!swapSourceId) return "idle";

    return user.user_id === swapSourceId ? "source" : "target";
  };

  // Uborka tabida qo'shni o'rinlar juftlik: 1-2, 3-4, ... Juftliklar navbat bilan bo'yaladi
  const getPairNumber = (user) => Math.ceil((user[orderColumn] ?? 0) / 2);
  const isPairStart = (user) => (user[orderColumn] ?? 0) % 2 === 1;

  const getRowClass = (user) =>
    [
      "control__row",
      pairMode && (getPairNumber(user) % 2 ? "control__row--pair-odd" : "control__row--pair-even"),
      pairMode && isPairStart(user) && "control__row--pair-start",
      todayIds.includes(user.user_id) && "control__row--today",
      user.user_id === swapSourceId && "control__row--swap",
      user.user_id === draggedId && "control__row--dragging",
      user.user_id === overId && user.user_id !== draggedId && "control__row--over",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="control__table-wrapper table-responsive d-none d-md-block shadow-sm">
      <table className="control__table table align-middle m-0">
        <thead>
          <tr>
            <th aria-label={t("control.table.drag")}></th>
            <th>#</th>
            <th>{t("control.table.user")}</th>
            <th>{t("control.table.age")}</th>
            <th>{t("control.table.nickname")}</th>
            <th>{t("control.table.phone")}</th>
            <th>{t("control.table.email")}</th>
            <th className="text-end">{t("control.table.actions")}</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.user_id}
              className={getRowClass(user)}
              draggable={!busy}
              onDragStart={(evt) => {
                setDraggedId(user.user_id);
                evt.dataTransfer.effectAllowed = "move";
                evt.dataTransfer.setData("text/plain", user.user_id);
              }}
              onDragOver={(evt) => {
                if (!draggedId) return;

                evt.preventDefault();
                setOverId(user.user_id);
              }}
              onDrop={(evt) => {
                evt.preventDefault();
                handleDrop(user);
              }}
              onDragEnd={resetDrag}
            >
              <td className="control__handle" title={t("control.table.dragTitle")}>
                ⠿
              </td>

              <th>
                {user[orderColumn]}

                {pairMode && isPairStart(user) && (
                  <span className="control__pair-badge">
                    {t("control.pairLabel", { number: getPairNumber(user) })}
                  </span>
                )}
              </th>

              <td>
                <div className="d-flex align-items-center gap-2">
                  <Avatar user={user} size="sm" />

                  <div className="text-start lh-sm">
                    <span className="fw-semibold d-block">
                      {user.name} {user.last_name}
                    </span>

                    <RoleBadges
                      user={user}
                      isToday={todayIds.includes(user.user_id)}
                      taskKey={todayTaskKey}
                    />
                  </div>
                </div>
              </td>

              <td>{user.age}</td>

              <td>
                <NicknameLink nickname={user.nickname} />
              </td>

              <td>
                <PhoneLink phone={user.phone_number} />
              </td>

              <td>
                <EmailLink email={user.email} />
              </td>

              <td className="text-end text-nowrap">
                <UserActions
                  user={user}
                  isSelf={user.user_id === currentUserId}
                  disabled={busy}
                  swapState={getSwapState(user)}
                  onSwap={onSwap}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
