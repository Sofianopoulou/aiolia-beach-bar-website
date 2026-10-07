import menuJson from "../../public/menu.json";
import type { MenuData } from "../types/types";
import { requireStaff } from "../services/staffAuth.server";
import { supabase } from "../services/supabase.server";

const menu = menuJson as MenuData;
const sectionsByProduct = new Map<string, string>();
function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
for (const section of menu.sections) {
  for (const item of section.items) {
    if (item.name) sectionsByProduct.set(`${slug(section.name)}__${slug(item.name)}`, section.name);
  }
}

async function fetchRange<T>(table: "orders" | "payments" | "table_sessions", columns: string, field: string, start: string, end: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).gte(field, start).lt(field, end).order(field).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function fetchItems(orderIds: string[]) {
  const rows: { order_id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; station: string | null; status: string }[] = [];
  for (let i = 0; i < orderIds.length; i += 200) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("order_items").select("order_id, product_id, product_name, quantity, unit_price, station, status").in("order_id", orderIds.slice(i, i + 200)).range(from, from + 999);
      if (error) throw new Error(error.message);
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
  }
  return rows;
}

async function fetchCancellations(start: string, end: string) {
  const rows: { order_id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; station: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("order_items").select("order_id, product_id, product_name, quantity, unit_price, station").eq("status", "CANCELLED").gte("cancelled_at", start).lt("cancelled_at", end).order("cancelled_at").range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function fetchSessionOwners(sessionIds: string[]) {
  const rows: { id: string; opened_by: string | null }[] = [];
  for (let i = 0; i < sessionIds.length; i += 200) {
    const { data, error } = await supabase.from("table_sessions").select("id, opened_by").in("id", sessionIds.slice(i, i + 200));
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
  }
  return rows;
}

const asMoney = (value: unknown) => Number(value ?? 0);
const asCount = (value: unknown) => Number(value ?? 0);

export async function loader({ request }: { request: Request }) {
  try {
    await requireStaff(request, ["ADMIN"]);
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const previousStart = url.searchParams.get("previousStart");
    const previousEnd = url.searchParams.get("previousEnd");
    if (!start || !end || !previousStart || !previousEnd || ![start, end, previousStart, previousEnd].every((value) => Number.isFinite(Date.parse(value))) || Date.parse(end) <= Date.parse(start) || Date.parse(previousEnd) <= Date.parse(previousStart)) {
      return Response.json({ success: false, error: "A valid date range is required." }, { status: 400 });
    }

    const [orders, previousOrders, payments, sessions, closedSessions, cancellations, staffResult] = await Promise.all([
      fetchRange<{ id: string; order_number: number; order_type: string; total: number; created_at: string; table_session_id: string | null }>("orders", "id, order_number, order_type, total, created_at, table_session_id", "created_at", start, end),
      fetchRange<{ total: number }>("orders", "total", "created_at", previousStart, previousEnd),
      fetchRange<{ id: string; table_session_id: string; amount: number; method: string; created_by: string; created_at: string }>("payments", "id, table_session_id, amount, method, created_by, created_at", "created_at", start, end),
      fetchRange<{ id: string; table_id: string; status: string; opened_at: string; closed_at: string | null; opened_by: string | null }>("table_sessions", "id, table_id, status, opened_at, closed_at, opened_by", "opened_at", start, end),
      fetchRange<{ id: string; table_id: string; status: string; opened_at: string; closed_at: string | null; opened_by: string | null }>("table_sessions", "id, table_id, status, opened_at, closed_at, opened_by", "closed_at", start, end),
      fetchCancellations(start, end),
      supabase.from("staff_profiles").select("id, name, role").eq("role", "WAITER").order("name"),
    ]);
    if (staffResult.error) throw new Error(staffResult.error.message);
    const items = await fetchItems(orders.map((order) => order.id));
    const sessionOwners = await fetchSessionOwners([...new Set(orders.flatMap((order) => order.table_session_id ? [order.table_session_id] : []))]);
    const itemMap = new Map<string, typeof items>();
    for (const item of items) itemMap.set(item.order_id, [...(itemMap.get(item.order_id) ?? []), item]);

    const products = new Map<string, { product: string; category: string; quantity: number; revenue: number; station: string; cancelledQuantity: number; cancelledRevenue: number; hourly: Map<string, number> }>();
    for (const section of menu.sections) {
      if (!section.station) continue;
      for (const item of section.items) {
        if (!item.name || !item.price) continue;
        const id = `${slug(section.name)}__${slug(item.name)}`;
        products.set(id, { product: item.name, category: section.name, quantity: 0, revenue: 0, station: section.station, cancelledQuantity: 0, cancelledRevenue: 0, hourly: new Map<string, number>() });
      }
    }
    const cancelEvents = new Map<string, { quantity: number; revenue: number }>();
    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, revenue: 0 }));
    const weekdays = Array.from({ length: 7 }, (_, day) => ({ day, orders: 0, revenue: 0 }));
    const days = new Map<string, { orders: number; revenue: number }>();
    const productDays = new Map<string, { quantity: number; revenue: number }>();
    const categories = new Map<string, number>();
    const stations = new Map<string, number>();
    const sessionRevenue = new Map<string, number>();
    let revenue = 0;
    let tableOrders = 0;
    let takeawayOrders = 0;
    let soldQuantity = 0;
    let cancelledQuantity = 0;
    let cancelledRevenue = 0;
    let productRevenue = 0;
    let discrepantOrders = 0;

    for (const order of orders) {
      const orderRevenue = asMoney(order.total);
      revenue += orderRevenue;
      if (order.order_type === "TABLE") tableOrders += 1;
      if (order.order_type === "TAKEAWAY") takeawayOrders += 1;
      const date = new Date(order.created_at);
      const dayKey = date.toISOString().slice(0, 10);
      const hour = date.getUTCHours();
      const weekday = date.getUTCDay();
      hours[hour].orders += 1;
      hours[hour].revenue += orderRevenue;
      weekdays[weekday].orders += 1;
      weekdays[weekday].revenue += orderRevenue;
      const day = days.get(dayKey) ?? { orders: 0, revenue: 0 };
      day.orders += 1;
      day.revenue += orderRevenue;
      days.set(dayKey, day);
      if (order.table_session_id) sessionRevenue.set(order.table_session_id, (sessionRevenue.get(order.table_session_id) ?? 0) + orderRevenue);

      const orderItems = itemMap.get(order.id) ?? [];
      let orderItemRevenue = 0;
      for (const item of orderItems) {
        const quantity = asCount(item.quantity);
        const amount = asMoney(item.unit_price) * quantity;
        const id = item.product_id || item.product_name;
        const category = sectionsByProduct.get(id) || "Uncategorized";
        const product = products.get(id) ?? { product: item.product_name, category, quantity: 0, revenue: 0, station: item.station || "Unknown", cancelledQuantity: 0, cancelledRevenue: 0, hourly: new Map<string, number>() };
        if (item.status === "CANCELLED") {
          // Cancellation events are attributed to cancelled_at below, rather than the original order date.
        } else {
          product.quantity += quantity;
          product.revenue += amount;
          product.hourly.set(String(hour), (product.hourly.get(String(hour)) ?? 0) + quantity);
          soldQuantity += quantity;
          productRevenue += amount;
          orderItemRevenue += amount;
          categories.set(category, (categories.get(category) ?? 0) + amount);
          stations.set(product.station, (stations.get(product.station) ?? 0) + amount);
          const productDay = productDays.get(dayKey) ?? { quantity: 0, revenue: 0 };
          productDay.quantity += quantity;
          productDay.revenue += amount;
          productDays.set(dayKey, productDay);
        }
        products.set(id, product);
      }
      if (Math.abs(orderRevenue - orderItemRevenue) > 0.009) discrepantOrders += 1;
    }

    for (const item of cancellations) {
      const quantity = asCount(item.quantity);
      const amount = asMoney(item.unit_price) * quantity;
      const id = item.product_id || item.product_name;
      const category = sectionsByProduct.get(id) || "Uncategorized";
      const product = products.get(id) ?? { product: item.product_name, category, quantity: 0, revenue: 0, station: item.station || "Unknown", cancelledQuantity: 0, cancelledRevenue: 0, hourly: new Map<string, number>() };
      product.cancelledQuantity += quantity;
      product.cancelledRevenue += amount;
      products.set(id, product);
      cancelEvents.set(id, { quantity: (cancelEvents.get(id)?.quantity ?? 0) + quantity, revenue: (cancelEvents.get(id)?.revenue ?? 0) + amount });
      cancelledQuantity += quantity;
      cancelledRevenue += amount;
    }

    const activeSessions = sessions.filter((session) => session.status === "OPEN").length;
    const closedRows = [...new Map([...sessions, ...closedSessions].map((session) => [session.id, session])).values()];
    const closedDurations = closedRows.filter((session) => session.closed_at && Date.parse(session.closed_at) >= Date.parse(start) && Date.parse(session.closed_at) < Date.parse(end)).map((session) => Math.max(0, Date.parse(session.closed_at!) - Date.parse(session.opened_at)) / 60000);
    const productRows = [...products.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).map((product, index) => ({ ...product, contribution: productRevenue > 0 ? product.revenue / productRevenue * 100 : 0, rank: index + 1, cancelledRate: product.quantity + product.cancelledQuantity > 0 ? product.cancelledQuantity / (product.quantity + product.cancelledQuantity) * 100 : 0, hourly: Object.fromEntries(product.hourly) }));
    const paymentSummary: { CASH: number; CARD: number; other: number; count: number } = { CASH: 0, CARD: 0, other: 0, count: payments.length };
    const waiterMap = new Map((staffResult.data ?? []).map((person) => [person.id, { id: person.id, name: person.name, payments: 0, paymentCount: 0, sessionsOpened: 0, attributedSessionRevenue: 0 }]));
    const sessionWaiter = new Map(sessionOwners.map((session) => [session.id, session.opened_by]));
    for (const payment of payments) {
      const amount = asMoney(payment.amount);
      if (payment.method === "CASH") paymentSummary.CASH += amount;
      else if (payment.method === "CARD") paymentSummary.CARD += amount;
      else paymentSummary.other += amount;
      const waiter = waiterMap.get(payment.created_by);
      if (waiter) { waiter.payments += amount; waiter.paymentCount += 1; }
    }
    for (const session of sessions) {
      const waiter = session.opened_by ? waiterMap.get(session.opened_by) : null;
      if (waiter) waiter.sessionsOpened += 1;
    }
    for (const [sessionId, amount] of sessionRevenue) {
      const waiterId = sessionWaiter.get(sessionId);
      const waiter = waiterId ? waiterMap.get(waiterId) : null;
      if (waiter) waiter.attributedSessionRevenue += amount;
    }

    const previousRevenue = previousOrders.reduce((sum, order) => sum + asMoney(order.total), 0);
    const dayRows = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
    const busiestHour = [...hours].sort((a, b) => b.orders - a.orders)[0];
    const busiestDay = [...weekdays].sort((a, b) => b.orders - a.orders)[0];
    return Response.json({
      success: true,
      summary: {
        revenue, productRevenue, revenueItemDifference: revenue - productRevenue, discrepantOrders,
        orderCount: orders.length, itemsSold: soldQuantity,
        averageOrderValue: orders.length ? revenue / orders.length : 0,
        sessionCount: sessionRevenue.size,
        averageSessionSpend: sessionRevenue.size ? [...sessionRevenue.values()].reduce((sum, amount) => sum + amount, 0) / sessionRevenue.size : 0,
        tableOrders, takeawayOrders, previousRevenue,
        revenueChange: previousRevenue ? (revenue - previousRevenue) / previousRevenue * 100 : null,
        previousOrderCount: previousOrders.length, cancelledQuantity, cancelledRevenue,
        cancellationCount: cancellations.length,
        cancellationRate: soldQuantity + cancelledQuantity ? cancelledQuantity / (soldQuantity + cancelledQuantity) * 100 : 0,
        averageSessionMinutes: closedDurations.length ? closedDurations.reduce((a, b) => a + b, 0) / closedDurations.length : null,
        activeSessions,
      },
      products: productRows,
      cancellationEvents: [...cancelEvents].map(([productId, values]) => ({ productId, ...values })),
      categories: [...categories].map(([category, amount]) => ({ category, revenue: amount })).sort((a, b) => b.revenue - a.revenue),
      stations: [...stations].map(([station, amount]) => ({ station, revenue: amount })),
      payments: paymentSummary,
      trends: dayRows,
      productTrends: [...productDays].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values })),
      hours, weekdays, busiestHour, busiestDay,
      waiters: [...waiterMap.values()].sort((a, b) => b.payments - a.payments),
      attribution: { waiterOrdersAvailable: false, shiftSalesAvailable: false },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Could not load analytics." }, { status: 500 });
  }
}
