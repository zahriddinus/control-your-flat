import "./avatar.scss";

const getInitials = (user) =>
  `${user?.name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "?";

// size: "sm", "md" yoki "lg"
export const Avatar = ({ user, size = "md" }) => {
  return <div className={`avatar avatar--${size} flex-shrink-0`}>{getInitials(user)}</div>;
};
