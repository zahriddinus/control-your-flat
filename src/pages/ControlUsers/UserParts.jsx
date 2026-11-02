import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";

// Jadval va mobil kartochkalar uchun umumiy bo'laklar

// taskKey - qaysi vazifa bo'yicha "Bugun" (tanlangan tab)
export const RoleBadges = ({ user, isToday, taskKey = "duty" }) => {
  const { t } = useI18n();

  return (
    <>
      <span
        className={`badge ${user.role === "admin" ? "text-bg-primary" : "text-bg-light border"}`}
      >
        {user.role === "admin" ? t("control.roles.admin") : t("control.roles.user")}
      </span>

      {isToday && (
        <span className="control__today-badge badge text-bg-warning ms-1">
          <TaskIcon taskKey={taskKey} />
          {t("control.todayBadge")}
        </span>
      )}
    </>
  );
};

export const NicknameLink = ({ nickname }) =>
  nickname ? (
    <a href={`https://t.me/${nickname.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
      {nickname}
    </a>
  ) : (
    "—"
  );

export const PhoneLink = ({ phone }) => (phone ? <a href={`tel:${phone}`}>{phone}</a> : "—");

export const EmailLink = ({ email }) => (email ? <a href={`mailto:${email}`}>{email}</a> : "—");

// swapState: "idle" - hech kim tanlanmagan, "source" - shu odam tanlangan,
// "target" - boshqasi tanlangan, shu odam bilan almashtirsa bo'ladi
const SWAP_BUTTONS = {
  idle: { className: "btn-outline-secondary", labelKey: "control.swap" },
  source: { className: "btn-secondary", labelKey: "control.swapCancel" },
  target: { className: "btn-primary", labelKey: "control.swapWith" },
};

export const UserActions = ({
  user,
  isSelf,
  disabled,
  swapState = "idle",
  onSwap,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();

  const swapButton = SWAP_BUTTONS[swapState];

  return (
    <>
      <button
        className={`btn btn-sm ${swapButton.className} me-2`}
        type="button"
        onClick={() => onSwap(user)}
        disabled={disabled}
      >
        {t(swapButton.labelKey)}
      </button>

      <button
        className="btn btn-sm btn-outline-primary me-2"
        type="button"
        onClick={() => onEdit(user)}
        disabled={disabled}
      >
        {t("control.edit")}
      </button>

      <button
        className="btn btn-sm btn-outline-danger"
        type="button"
        onClick={() => onDelete(user)}
        disabled={disabled || isSelf}
        title={isSelf ? t("control.selfDelete") : undefined}
      >
        {t("control.delete")}
      </button>
    </>
  );
};
