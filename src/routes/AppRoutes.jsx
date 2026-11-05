import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ControlUsers,
  DutiesSchedule,
  Error,
  ForgotPassword,
  Home,
  Invite,
  Landing,
  Login,
  NewFlat,
  ResetPassword,
  Settings,
  Signup,
  Users,
} from "../pages";
import { GuestOnly, RequireAuth, RequireFlat, RequireManager } from "./guards";

// Bosh sahifa: mehmonga tanishtiruv, a'zoga - uyning bugungi holati
const HomeGate = () => {
  const { user, loading } = useAuth();

  if (!loading && !user) return <Landing />;

  return (
    <RequireAuth>
      <RequireFlat>
        <Home />
      </RequireFlat>
    </RequireAuth>
  );
};

const MemberPage = ({ children, skeleton }) => (
  <RequireAuth skeleton={skeleton}>
    <RequireFlat skeleton={skeleton}>{children}</RequireFlat>
  </RequireAuth>
);

const OwnerPage = ({ children, skeleton }) => (
  <MemberPage skeleton={skeleton}>
    <RequireManager>{children}</RequireManager>
  </MemberPage>
);

// Manzil o'zgarganda yangi sahifa yumshoq paydo bo'ladi
export const AppRoutes = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { recovery } = useAuth();

  // Parolni tiklash havolasidan kelinganda - yangi parol sahifasiga
  useEffect(() => {
    if (recovery && pathname !== "/reset-password") navigate("/reset-password", { replace: true });
  }, [recovery, pathname, navigate]);

  return (
    <div className="page-transition" key={pathname}>
      <Routes>
        <Route path="/" element={<HomeGate />} />

        <Route
          path="/login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <Signup />
            </GuestOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPassword />
            </GuestOnly>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/invite/:code" element={<Invite />} />

        <Route
          path="/new-flat"
          element={
            <RequireAuth>
              <NewFlat />
            </RequireAuth>
          }
        />

        <Route
          path="/duties-schedule"
          element={
            <MemberPage skeleton="schedule">
              <DutiesSchedule />
            </MemberPage>
          }
        />
        <Route
          path="/users"
          element={
            <MemberPage skeleton="users">
              <Users />
            </MemberPage>
          }
        />

        <Route
          path="/control-users"
          element={
            <OwnerPage skeleton="control">
              <ControlUsers />
            </OwnerPage>
          }
        />
        <Route
          path="/settings"
          element={
            <OwnerPage>
              <Settings />
            </OwnerPage>
          }
        />

        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};
