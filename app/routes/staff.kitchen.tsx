import ProductionBoard from "../components/ProductionBoard";
import StaffRouteGuard from "../components/StaffRouteGuard";

export default function KitchenStaffPage() {
  return (
    <StaffRouteGuard allowedRole="KITCHEN">
      <ProductionBoard station="KITCHEN" />
    </StaffRouteGuard>
  );
}
