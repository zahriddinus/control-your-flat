import { Avatar } from "../../components/Avatar";
import { AppIcon } from "../../components/AppIcon";
import { useI18n } from "../../i18n";
import { EmailLink, NicknameLink, PhoneLink, RoleBadges, UserActions } from "./UserParts";

// Telefon uchun: navbat ↑ ↓ tugmalari bilan o'zgaradi
export const UserCards = ({
  users,
  orderColumn,
  firstUserId,
  lastUserId,
  todayIds,
  todayTaskKey,
  groupSize = 1,
  accounts = {},
  currentUserId,
  protectedIds = [],
  busy,
  swapSourceId,
  onMoveStep,
  onSwap,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();

  return (
    <div className="d-md-none d-flex flex-column gap-3">
      {users.map((user) => {
        const isToday = todayIds.includes(user.user_id);
        // Bir navbatda bir necha kishi bo'lsa, qo'shni o'rinlar guruh
        const pairMode = groupSize > 1;
        const pairNumber = Math.ceil((user[orderColumn] ?? 0) / groupSize);
        const pairClass = pairMode ? `control__card--pair-${pairNumber % 2 ? "odd" : "even"}` : "";

        return (
          <div
            className={`control__card card border-0 shadow-sm ${isToday ? "control__card--today" : ""} ${pairClass} ${
              user.user_id === swapSourceId ? "control__card--swap" : ""
            }`}
            key={user.user_id}
          >
            <div className="card-body text-start">
              <div className="d-flex align-items-center gap-3 mb-2">
                <span className="control__order">
                  #{user[orderColumn]}
                  {pairMode && (
                    <span className="control__pair-badge d-block">
                      {t("control.pairLabel", { number: pairNumber })}
                    </span>
                  )}
                </span>

                <Avatar user={user} />

                <div className="flex-grow-1 overflow-hidden lh-sm">
                  <span className="fw-semibold d-block text-truncate">
                    {user.name} {user.last_name}
                  </span>

                  <RoleBadges
                    account={accounts[user.user_id]}
                    pending={
                      !accounts[user.user_id] && user.invite_role !== "member"
                        ? user.invite_role
                        : null
                    }
                    isToday={isToday}
                    taskKey={todayTaskKey}
                  />
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
                <li>
                  <AppIcon name="cake" className="control__info-icon" />
                  {user.age ? t("control.age", { count: user.age }) : "—"}
                </li>
                <li>
                  <AppIcon name="send" className="control__info-icon" />
                  <NicknameLink nickname={user.nickname} />
                </li>
                <li>
                  <AppIcon name="phone" className="control__info-icon" />
                  <PhoneLink phone={user.phone_number} />
                </li>
                <li className="text-truncate">
                  <AppIcon name="mail" className="control__info-icon" />
                  <EmailLink email={user.email} />
                </li>
              </ul>

              <UserActions
                user={user}
                isSelf={user.user_id === currentUserId || protectedIds.includes(user.user_id)}
                disabled={busy}
                swapState={
                  !swapSourceId ? "idle" : user.user_id === swapSourceId ? "source" : "target"
                }
                onSwap={onSwap}
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
