import { Outlet } from "react-router";
import StaffRouteGuard from "../components/StaffRouteGuard";

export default function WaiterLayout() {
  return (
    <StaffRouteGuard allowedRole="WAITER">
      <Outlet />
    </StaffRouteGuard>
  );
}
