import ProductionBoard from "../components/ProductionBoard";
import StaffRouteGuard from "../components/StaffRouteGuard";

export default function BarStaffPage() {
  return (
    <StaffRouteGuard allowedRole="BAR">
      <ProductionBoard station="BAR" />
    </StaffRouteGuard>
  );
}
