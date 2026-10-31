import { useState } from "react";
import { Avatar } from "../../components/Avatar";
import { EmailLink, NicknameLink, PhoneLink, RoleBadges, UserActions } from "./UserParts";

// Katta ekran uchun: qatorni sudrab navbatni o'zgartirish mumkin
export const UsersTable = ({
  users,
  todayDutyId,
  currentUserId,
  busy,
  onMove,
  onEdit,
  onDelete,
}) => {
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
      onMove(draggedUser, targetUser.duty_order);
    }
  }

  const getRowClass = (user) =>
    [
      "control__row",
      user.user_id === todayDutyId && "control__row--today",
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
            <th aria-label="Sudrash"></th>
            <th>#</th>
            <th>User</th>
            <th>Yosh</th>
            <th>Nickname</th>
            <th>Telefon</th>
            <th>Email</th>
            <th className="text-end">Amallar</th>
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
              <td className="control__handle" title="Sudrab navbatni o'zgartiring">
                ⠿
              </td>

              <th>{user.duty_order}</th>

              <td>
                <div className="d-flex align-items-center gap-2">
                  <Avatar user={user} size="sm" />

                  <div className="text-start lh-sm">
                    <span className="fw-semibold d-block">
                      {user.name} {user.last_name}
                    </span>

                    <RoleBadges user={user} isToday={user.user_id === todayDutyId} />
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
