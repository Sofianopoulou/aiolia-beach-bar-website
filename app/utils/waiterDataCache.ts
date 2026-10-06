import type { WaiterTableListItem } from "../types/waiter";
import type {
  RestaurantTable,
  TableOrder,
  TablePayment,
  TableSession,
} from "../types/waiter";

export type WaiterTableSnapshot = {
  table: RestaurantTable;
  session: TableSession | null;
  orders: TableOrder[];
  payments: TablePayment[];
  subtotal: number;
  total: number;
  paid: number;
  remaining: number;
};

let cachedTables: WaiterTableListItem[] | null = null;
const cachedTableSnapshots = new Map<string, WaiterTableSnapshot>();

export function getCachedTables(): WaiterTableListItem[] | null {
  return cachedTables;
}

export function setCachedTables(tables: WaiterTableListItem[]) {
  cachedTables = tables;
}

export function getCachedTable(
  tableId: string,
): WaiterTableSnapshot | null {
  return cachedTableSnapshots.get(tableId) ?? null;
}

export function setCachedTable(
  tableId: string,
  snapshot: WaiterTableSnapshot,
) {
  cachedTableSnapshots.set(tableId, snapshot);
}
