import "./avatar.scss";
import { getAvatarColorKey, getAvatarGradient } from "../../utils/avatarColors";

const getInitials = (user) =>
  `${user?.name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "?";

// size: "sm", "md" yoki "lg". Rang - xonadoshning o'zi tanlagani yoki ID'dan avtomatik
export const Avatar = ({ user, size = "md" }) => {
  return (
    <div
      className={`avatar avatar--${size} flex-shrink-0`}
      style={{ background: getAvatarGradient(getAvatarColorKey(user)) }}
    >
      {getInitials(user)}
    </div>
  );
};
