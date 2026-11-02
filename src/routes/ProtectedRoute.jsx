import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabese";
import { PageSkeleton } from "../components/Skeleton";

export const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  // localStorage'ga ishonmaymiz: admin ekanligi faqat sessiya va bazadan tekshiriladi
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (data?.role === "admin") {
        setIsAdmin(true);
      }

      setLoading(false);

      if (error) {
        console.error(error);
        return;
      }
      // console.log("ERROR:", error);

      // console.log("SESSION:", session);
      // console.log("EMAIL:", session?.user?.email);
      // console.log("USER:", data);
      // console.log("ROLE:", data?.role);
    };

    checkAdmin();
  }, []);

  if (loading) {
    // Hozircha faqat Control Users himoyalangan, shuning uchun uning skeleti ko'rinadi
    return <PageSkeleton variant="control" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
