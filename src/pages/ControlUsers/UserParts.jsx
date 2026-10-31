// Jadval va mobil kartochkalar uchun umumiy bo'laklar

export const RoleBadges = ({ user, isToday }) => (
  <>
    <span className={`badge ${user.role === "admin" ? "text-bg-primary" : "text-bg-light border"}`}>
      {user.role === "admin" ? "Admin" : "User"}
    </span>

    {isToday && <span className="badge text-bg-warning ms-1">⭐ Bugun</span>}
  </>
);

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

export const UserActions = ({ user, isSelf, disabled, onEdit, onDelete }) => (
  <>
    <button
      className="btn btn-sm btn-outline-primary me-2"
      type="button"
      onClick={() => onEdit(user)}
      disabled={disabled}
    >
      ✏️ Edit
    </button>

    <button
      className="btn btn-sm btn-outline-danger"
      type="button"
      onClick={() => onDelete(user)}
      disabled={disabled || isSelf}
      title={isSelf ? "O'zingizni o'chira olmaysiz" : undefined}
    >
      🗑️ Delete
    </button>
  </>
);
