import { useI18n } from "../../i18n";

// Jadval va mobil kartochkalar uchun umumiy bo'laklar

export const RoleBadges = ({ user, isToday }) => {
  const { t } = useI18n();

  return (
    <>
      <span
        className={`badge ${user.role === "admin" ? "text-bg-primary" : "text-bg-light border"}`}
      >
        {user.role === "admin" ? t("control.roles.admin") : t("control.roles.user")}
      </span>

      {isToday && <span className="badge text-bg-warning ms-1">{t("control.todayBadge")}</span>}
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

export const UserActions = ({ user, isSelf, disabled, onEdit, onDelete }) => {
  const { t } = useI18n();

  return (
    <>
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
