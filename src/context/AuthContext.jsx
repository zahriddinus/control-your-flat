import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabese";

const AuthContext = createContext(null);

// Login holati butun sayt uchun bitta joyda.
// session: undefined - hali tekshirilmoqda, null - login qilinmagan
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // Parolni tiklash havolasidan kelganda "yangi parol" sahifasiga yo'naltirish uchun
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    recovery,
    clearRecovery: () => setRecovery(false),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
