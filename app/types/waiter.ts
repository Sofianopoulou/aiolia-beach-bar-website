export type OrderItemStatus =
  "ARRIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type TableOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  notes: string | null;
  station: "BAR" | "KITCHEN";
  status: OrderItemStatus;
  created_at: string;
};

export type TableOrder = {
  id: string;
  order_number: number;
  subtotal: number | string;
  total: number | string;
  notes: string | null;
  created_at: string;
  items: TableOrderItem[];
};

export type RestaurantTable = {
  id: string;
  number: number;
  name: string | null;
  active: boolean;
};

export type TableSession = {
  id: string;
  table_id: string;
  status: "OPEN";
  opened_at: string;
  opened_by: string | null;
};

export type TablePayment = {
  id: string;
  amount: number | string;
  method: "CASH" | "CARD";
  created_by: string;
  created_at: string;
};
