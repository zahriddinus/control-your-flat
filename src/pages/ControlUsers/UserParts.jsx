import { AppIcon } from "../../components/AppIcon";
import { TaskIcon } from "../../components/TaskIcon";
import { useI18n } from "../../i18n";

// Jadval va mobil kartochkalar uchun umumiy bo'laklar

// account - "owner" (uy egasi), "admin" (boshqaruvchi), qolganlar bir xil "A'zo".
// taskKey - qaysi vazifa bo'yicha "Bugun" (tanlangan tab)
// pending - hali qo'shilmagan, lekin qo'shilganda shu rol bilan kiradi: "admin" | "owner"
export const RoleBadges = ({ account, pending = null, isToday, taskKey = "duty" }) => {
  const { t } = useI18n();

  return (
    <>
      {account === "owner" && (
        <span className="control__account-badge badge text-bg-primary">
          <AppIcon name="shield" />
          {t("control.roles.owner")}
        </span>
      )}

      {account === "admin" && (
        <span className="control__account-badge control__account-badge--admin badge">
          <AppIcon name="sliders" />
          {t("control.roles.admin")}
        </span>
      )}

      {pending && (
        <span
          className={`control__account-badge control__account-badge--pending badge ${
            pending === "owner" ? "text-bg-primary" : "control__account-badge--admin"
          }`}
        >
          <AppIcon name={pending === "owner" ? "shield" : "sliders"} />
          {t(`control.roles.${pending}`)} · {t("control.roles.pending")}
        </span>
      )}

      {account !== "owner" && account !== "admin" && !pending && (
        <span className="control__account-badge control__account-badge--none badge">
          {t("control.roles.member")}
        </span>
      )}

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
  idle: { className: "btn-outline-secondary", icon: "swap", labelKey: "control.swap" },
  source: { className: "btn-secondary", icon: "close", labelKey: "control.swapCancel" },
  target: { className: "btn-primary", icon: "swap", labelKey: "control.swapWith" },
};

// compact - jadval uchun faqat ikonkalar, nomi esa tooltip'da
export const UserActions = ({
  user,
  compact = false,
  isSelf,
  disabled,
  swapState = "idle",
  onSwap,
  onEdit,
  onDelete,
}) => {
  const { t } = useI18n();

  const swapButton = SWAP_BUTTONS[swapState];

  if (compact) {
    const deleteTitle = isSelf ? t("control.selfDelete") : t("control.delete");

    return (
      <div className="control__actions">
        <button
          className={`control__icon-btn control__icon-btn--swap control__icon-btn--${swapState}`}
          type="button"
          onClick={() => onSwap(user)}
          disabled={disabled}
          title={t(swapButton.labelKey)}
          aria-label={t(swapButton.labelKey)}
        >
          <AppIcon name={swapButton.icon} />
        </button>

        <button
          className="control__icon-btn control__icon-btn--edit"
          type="button"
          onClick={() => onEdit(user)}
          disabled={disabled}
          title={t("control.edit")}
          aria-label={t("control.edit")}
        >
          <AppIcon name="edit" />
        </button>

        <button
          className="control__icon-btn control__icon-btn--delete"
          type="button"
          onClick={() => onDelete(user)}
          disabled={disabled || isSelf}
          title={deleteTitle}
          aria-label={deleteTitle}
        >
          <AppIcon name="trash" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        className={`btn btn-sm ${swapButton.className} me-2`}
        type="button"
        onClick={() => onSwap(user)}
        disabled={disabled}
      >
        <AppIcon name={swapButton.icon} className="me-1" />
        {t(swapButton.labelKey)}
      </button>

      <button
        className="btn btn-sm btn-outline-primary me-2"
        type="button"
        onClick={() => onEdit(user)}
        disabled={disabled}
      >
        <AppIcon name="edit" className="me-1" />
        {t("control.edit")}
      </button>

      <button
        className="btn btn-sm btn-outline-danger"
        type="button"
        onClick={() => onDelete(user)}
        disabled={disabled || isSelf}
        title={isSelf ? t("control.selfDelete") : undefined}
      >
        <AppIcon name="trash" className="me-1" />
        {t("control.delete")}
      </button>
    </>
  );
};
