import { Route, Routes } from "react-router-dom";
import { DutiesSchedule, Error, ControlUsers, Home, Users } from "../pages";
import { ProtectedRoute } from "../routes";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/duties-schedule" element={<DutiesSchedule />} />
      <Route path="/users" element={<Users />} />
      <Route
        path="/control-users"
        element={
          <ProtectedRoute>
            <ControlUsers />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};
