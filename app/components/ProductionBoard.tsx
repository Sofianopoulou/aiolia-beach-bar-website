import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "../services/supabase.client";

type Station = "BAR" | "KITCHEN";

type ProductionBoardProps = {
  station: Station;
};

type ItemStatus = "ARRIVED" | "PREPARING" | "READY" | "COMPLETED";

type ActiveStatus = "ARRIVED" | "PREPARING" | "READY";

type ProductionOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  notes: string | null;
  status: ItemStatus;
  created_at: string;

  order: {
    id: string;
    order_number: number;
    order_type: "TABLE" | "TAKEAWAY";
    table_number: number | null;
    customer_name: string | null;
    created_at: string;
  };
};

type GroupedOrder = {
  order: ProductionOrderItem["order"];
  items: ProductionOrderItem[];
};

type StaffShift = {
  id: string;
  user_id: string;
  station: "BAR" | "KITCHEN";
  status: "ASSIGNED" | "ACTIVE" | "CLOSED" | "CANCELLED";
  scheduled_start: string;
  scheduled_end: string;
  started_at: string | null;
  ended_at: string | null;
};

type StaffProfile = {
  id: string;
  name: string;
  role: "BAR" | "KITCHEN" | "ADMIN";
};

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Staff session expired.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export default function ProductionBoard({ station }: ProductionBoardProps) {
  const [items, setItems] = useState<ProductionOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [shift, setShift] = useState<StaffShift | null>(null);
  const [isUpdatingShift, setIsUpdatingShift] = useState(false);

  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);

  // Used so elapsed-time labels refresh automatically.
  const [now, setNow] = useState(Date.now());

  async function loadItems() {
    try {
      const authHeaders = await getAuthHeaders();

      const response = await fetch(`/api/staff/${station.toLowerCase()}`, {
        headers: authHeaders,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load orders");
      }

      setItems(result.items);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  // Initial fetch + Supabase Realtime.
  useEffect(() => {
    loadItems();
    loadMyShift();
    loadStaffProfile();

    const channel = supabaseClient
      .channel(`${station.toLowerCase()}-order-items`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `station=eq.${station}`,
        },
        () => {
          loadItems();
        },
      )
      .subscribe((status) => {
        console.log(`${station} realtime subscription:`, status);
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [station]);

  // Refresh displayed waiting times every 30 seconds.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  async function loadMyShift() {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/staff/my-shift", {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load your shift");
      }

      setShift(result.shift ?? null);
    } catch (error) {
      console.error("Load shift error:", error);
      setShift(null);
    }
  }

  async function loadStaffProfile() {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        setStaffProfile(null);
        return;
      }

      const { data, error } = await supabaseClient
        .from("staff_profiles")
        .select("id, name, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Could not load staff profile:", error);
        setStaffProfile(null);
        return;
      }

      setStaffProfile(data as StaffProfile);
    } catch (error) {
      console.error("Could not load staff profile:", error);
      setStaffProfile(null);
    }
  }

  async function updateMyShift(action: "START" | "END") {
    try {
      setIsUpdatingShift(true);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/staff/my-shift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not update shift");
      }

      await loadMyShift();
    } catch (error) {
      console.error("Shift update error:", error);
      alert(error instanceof Error ? error.message : "Could not update shift");
    } finally {
      setIsUpdatingShift(false);
    }
  }

  const groupedOrders = useMemo<GroupedOrder[]>(() => {
    const groups = new Map<string, GroupedOrder>();

    for (const item of items) {
      const existing = groups.get(item.order.id);

      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.order.id, {
          order: item.order,
          items: [item],
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        new Date(a.order.created_at).getTime() -
        new Date(b.order.created_at).getTime(),
    );
  }, [items]);

  function getOrderStatus(orderItems: ProductionOrderItem[]): ActiveStatus {
    if (orderItems.every((item) => item.status === "READY")) {
      return "READY";
    }

    if (
      orderItems.some(
        (item) => item.status === "PREPARING" || item.status === "READY",
      )
    ) {
      return "PREPARING";
    }

    return "ARRIVED";
  }

  const ordersByStatus = useMemo(() => {
    return {
      ARRIVED: groupedOrders.filter(
        (order) => getOrderStatus(order.items) === "ARRIVED",
      ),

      PREPARING: groupedOrders.filter(
        (order) => getOrderStatus(order.items) === "PREPARING",
      ),

      READY: groupedOrders.filter(
        (order) => getOrderStatus(order.items) === "READY",
      ),
    };
  }, [groupedOrders]);

  async function updateItemStatus(
    itemId: string,
    status: "PREPARING" | "READY" | "COMPLETED",
  ) {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`/api/staff/items/${itemId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        status,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Could not update status");
    }
  }

  async function updateWholeOrder(
    groupedOrder: GroupedOrder,
    status: "PREPARING" | "READY" | "COMPLETED",
  ) {
    try {
      setUpdatingOrderId(groupedOrder.order.id);
      setError(null);

      const itemsToUpdate = groupedOrder.items.filter(
        (item) => item.status !== status,
      );

      await Promise.all(
        itemsToUpdate.map((item) => updateItemStatus(item.id, status)),
      );

      await loadItems();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getElapsedMinutes(date: string) {
    return Math.max(0, Math.floor((now - new Date(date).getTime()) / 60_000));
  }

  function getElapsedLabel(date: string) {
    const minutes = getElapsedMinutes(date);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes === 1) {
      return "1 min";
    }

    return `${minutes} min`;
  }

  function getUrgencyStyles(date: string) {
    const minutes = getElapsedMinutes(date);

    if (minutes >= 15) {
      return {
        border: "#ef4444",
        timerBackground: "#fee2e2",
        timerColor: "#b91c1c",
      };
    }

    if (minutes >= 8) {
      return {
        border: "#f59e0b",
        timerBackground: "#fef3c7",
        timerColor: "#92400e",
      };
    }

    return {
      border: "#e5e7eb",
      timerBackground: "#f3f4f6",
      timerColor: "#374151",
    };
  }

  function renderOrderCard(groupedOrder: GroupedOrder, status: ActiveStatus) {
    const isUpdating = updatingOrderId === groupedOrder.order.id;

    const urgency = getUrgencyStyles(groupedOrder.order.created_at);

    return (
      <article
        key={groupedOrder.order.id}
        style={{
          background: "#ffffff",
          border: `2px solid ${urgency.border}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* ORDER HEADER */}

        <header
          style={{
            padding: 18,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                ORDER
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                #{groupedOrder.order.order_number}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                {formatTime(groupedOrder.order.created_at)}
              </div>

              <div
                style={{
                  display: "inline-block",
                  marginTop: 5,
                  padding: "5px 9px",
                  borderRadius: 8,
                  background: urgency.timerBackground,
                  color: urgency.timerColor,
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {getElapsedLabel(groupedOrder.order.created_at)}
              </div>
            </div>
          </div>

          {/* TABLE / PICKUP */}

          <div
            style={{
              marginTop: 15,
              padding: "11px 14px",
              borderRadius: 10,
              background: "#f9fafb",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {groupedOrder.order.order_type === "TABLE"
              ? `TABLE ${groupedOrder.order.table_number}`
              : `PICKUP — ${groupedOrder.order.customer_name || ""}`}
          </div>
        </header>

        {/* ITEMS */}

        <div
          style={{
            padding: "5px 18px",
          }}
        >
          {groupedOrder.items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid #eeeeee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 19,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    minWidth: 32,
                    fontSize: 21,
                    fontWeight: 900,
                  }}
                >
                  {item.quantity}×
                </span>

                <span>{item.product_name}</span>
              </div>

              {item.notes && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  ↳ {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ACTION */}

        <footer
          style={{
            padding: 18,
          }}
        >
          {status === "ARRIVED" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => updateWholeOrder(groupedOrder, "PREPARING")}
              style={{
                width: "100%",
                minHeight: 52,
                border: "none",
                borderRadius: 10,
                background: "#FA994F",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "UPDATING..." : "START PREPARING"}
            </button>
          )}

          {status === "PREPARING" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => updateWholeOrder(groupedOrder, "READY")}
              style={{
                width: "100%",
                minHeight: 52,
                border: "none",
                borderRadius: 10,
                background: "#5AD7D9",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "UPDATING..." : "MARK AS READY"}
            </button>
          )}

          {status === "READY" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => updateWholeOrder(groupedOrder, "COMPLETED")}
              style={{
                width: "100%",
                minHeight: 52,
                border: "none",
                borderRadius: 10,
                background: "#111827",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "UPDATING..." : "✓ COMPLETE"}
            </button>
          )}
        </footer>
      </article>
    );
  }

  function renderColumn(title: ActiveStatus, orders: GroupedOrder[]) {
    const labels: Record<ActiveStatus, string> = {
      ARRIVED: "NEW ORDERS",
      PREPARING: "PREPARING",
      READY: "READY",
    };

    return (
      <section
        style={{
          minWidth: 0,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            padding: "0 4px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {labels[title]}
          </h2>

          <div
            style={{
              minWidth: 30,
              height: 30,
              padding: "0 8px",
              borderRadius: 15,
              background: "#111827",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {orders.length}
          </div>
        </header>

        {orders.length === 0 ? (
          <div
            style={{
              padding: 30,
              border: "2px dashed #e5e7eb",
              borderRadius: 14,
              textAlign: "center",
              color: "#9ca3af",
              fontWeight: 600,
            }}
          >
            No orders
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {orders.map((order) => renderOrderCard(order, title))}
          </div>
        )}
      </section>
    );
  }

  if (isLoading) {
    return (
      <main
        style={{
          padding: 32,
        }}
      >
        Loading {station} orders...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: 24,
        color: "#111827",
      }}
    >
      {/* MAIN HEADER */}

      <header
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "18px 22px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: "#6b7280",
            }}
          >
            AIOLIA
          </div>

          <h1
            style={{
              margin: "2px 0 0",
              fontSize: 30,
            }}
          >
            {station === "BAR" ? "Bar Production" : "Kitchen Production"}
          </h1>
          {staffProfile && (
            <div
              style={{
                marginTop: 5,
                color: "#FA994F",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Logged in as {staffProfile.name}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {(!shift ||
              shift.status === "CLOSED" ||
              shift.status === "CANCELLED") && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                No active or assigned shift
              </div>
            )}

            {shift?.status === "ASSIGNED" && (
              <>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 700,
                    }}
                  >
                    TODAY'S SHIFT
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                    }}
                  >
                    {new Date(shift.scheduled_start).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" → "}
                    {new Date(shift.scheduled_end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isUpdatingShift}
                  onClick={() => updateMyShift("START")}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    border: "none",
                    borderRadius: 8,
                    background: "#FA994F",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: isUpdatingShift ? "not-allowed" : "pointer",
                  }}
                >
                  START SHIFT
                </button>
              </>
            )}

            {shift?.status === "ACTIVE" && (
              <>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#dcfce7",
                    color: "#166534",
                    fontWeight: 900,
                  }}
                >
                  ● ON SHIFT
                  {shift.started_at && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontWeight: 600,
                      }}
                    >
                      since{" "}
                      {new Date(shift.started_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isUpdatingShift}
                  onClick={() => updateMyShift("END")}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    background: "#ffffff",
                    fontWeight: 800,
                    cursor: isUpdatingShift ? "not-allowed" : "pointer",
                  }}
                >
                  END SHIFT
                </button>
              </>
            )}

            <div
              style={{
                color: "#6b7280",
                fontWeight: 700,
              }}
            >
              {groupedOrders.length} active orders
            </div>

            <button
              type="button"
              onClick={loadItems}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 20,
            borderRadius: 10,
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {/* PRODUCTION BOARD */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "start",
          overflowX: "auto",
        }}
      >
        {renderColumn("ARRIVED", ordersByStatus.ARRIVED)}

        {renderColumn("PREPARING", ordersByStatus.PREPARING)}

        {renderColumn("READY", ordersByStatus.READY)}
      </div>
    </main>
  );
}
