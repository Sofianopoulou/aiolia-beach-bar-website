import { useEffect } from "react";
import { Outlet } from "react-router";
import StaffRouteGuard from "../components/StaffRouteGuard";
import { getMenu } from "../utils/menuCache";

export default function WaiterLayout() {
  useEffect(() => {
    void getMenu().catch(() => {
      // The order page will retry and show an error if the menu is still unavailable.
    });
  }, []);

  return (
    <StaffRouteGuard allowedRole="WAITER">
      <Outlet />
    </StaffRouteGuard>
  );
}
