import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabese";
import { Loading } from "../components/Loading";

export const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(window.localStorage.getItem("isAdmin") === "true");

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
      // console.log("ERROR:", error);

      // console.log("SESSION:", session);
      // console.log("EMAIL:", session?.user?.email);
      // console.log("USER:", data);
      // console.log("ROLE:", data?.role);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
