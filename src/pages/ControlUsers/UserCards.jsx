import { Avatar } from "../../components/Avatar";
import { useI18n } from "../../i18n";
import { EmailLink, NicknameLink, PhoneLink, RoleBadges, UserActions } from "./UserParts";

// Telefon uchun: navbat ↑ ↓ tugmalari bilan o'zgaradi
export const UserCards = ({
  users,
  firstUserId,
  lastUserId,
  todayDutyId,
  currentUserId,
  busy,
  onMoveStep,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();

  return (
    <div className="d-md-none d-flex flex-column gap-3">
      {users.map((user) => {
        const isToday = user.user_id === todayDutyId;

        return (
          <div
            className={`control__card card border-0 shadow-sm ${isToday ? "control__card--today" : ""}`}
            key={user.user_id}
          >
            <div className="card-body text-start">
              <div className="d-flex align-items-center gap-3 mb-2">
                <span className="control__order">#{user.duty_order}</span>

                <Avatar user={user} />

                <div className="flex-grow-1 overflow-hidden lh-sm">
                  <span className="fw-semibold d-block text-truncate">
                    {user.name} {user.last_name}
                  </span>

                  <RoleBadges user={user} isToday={isToday} />
                </div>

                <div className="btn-group-vertical btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => onMoveStep(user, -1)}
                    disabled={busy || user.user_id === firstUserId}
                    aria-label={t("control.moveUp", { name: user.name })}
                  >
                    ↑
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => onMoveStep(user, 1)}
                    disabled={busy || user.user_id === lastUserId}
                    aria-label={t("control.moveDown", { name: user.name })}
                  >
                    ↓
                  </button>
                </div>
              </div>

              <ul className="control__info list-unstyled small mb-3">
                <li>🎂 {user.age ? t("control.age", { count: user.age }) : "—"}</li>
                <li>
                  💬 <NicknameLink nickname={user.nickname} />
                </li>
                <li>
                  📞 <PhoneLink phone={user.phone_number} />
                </li>
                <li className="text-truncate">
                  ✉️ <EmailLink email={user.email} />
                </li>
              </ul>

              <UserActions
                user={user}
                isSelf={user.user_id === currentUserId}
                disabled={busy}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
