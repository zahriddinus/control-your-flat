import { Route, Routes, useLocation } from "react-router-dom";
import { DutiesSchedule, Error, ControlUsers, Home, Users } from "../pages";
import { ProtectedRoute } from "../routes";

// Manzil o'zgarganda yangi sahifa yumshoq paydo bo'ladi
export const AppRoutes = () => {
  const { pathname } = useLocation();

  return (
    <div className="page-transition" key={pathname}>
      <Routes>
        <Route
          path="/control-users"
          element={
            <ProtectedRoute>
              <ControlUsers />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route path="/duties-schedule" element={<DutiesSchedule />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};
