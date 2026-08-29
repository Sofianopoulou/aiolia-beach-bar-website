import { Outlet } from "react-router";
import StaffRouteGuard from "../components/StaffRouteGuard";

export default function AdminLayout() {
  return (
    <StaffRouteGuard allowedRole="ADMIN">
      <Outlet />
    </StaffRouteGuard>
  );
}
