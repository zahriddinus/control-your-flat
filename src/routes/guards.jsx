import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFlat } from "../context/FlatContext";
import { PageSkeleton } from "../components/Skeleton";

// Login talab qilinadi: bo'lmasa, kirib bo'lgach shu sahifaga qaytadi
export const RequireAuth = ({ children, skeleton = "home" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton variant={skeleton} />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);

    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
};

// Biror uyga a'zo bo'lish talab qilinadi: bo'lmasa, uy yaratish sahifasiga
export const RequireFlat = ({ children, skeleton = "home" }) => {
  const { loading, membership } = useFlat();

  if (loading) return <PageSkeleton variant={skeleton} />;

  if (!membership) return <Navigate to="/new-flat" replace />;

  return children;
};

// Faqat uy egasi yoki boshqaruvchisi uchun
export const RequireManager = ({ children }) => {
  const { isManager } = useFlat();

  if (!isManager) return <Navigate to="/" replace />;

  return children;
};

// Login qilgan odam kirish/ro'yxatdan o'tish sahifalarini ko'rmaydi
export const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton variant="home" />;

  if (user) {
    const next = new URLSearchParams(location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

    return <Navigate to={safeNext} replace />;
  }

  return children;
};
