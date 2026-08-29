import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../services/supabase.client";

type Station = "BAR" | "KITCHEN";

type ItemStatus = "ARRIVED" | "PREPARING" | "READY" | "COMPLETED";

type ActiveStatus = "ARRIVED" | "PREPARING" | "READY";

type AdminOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  notes: string | null;
  station: Station;
  status: ItemStatus;
  created_at: string;
  started_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
};

type AdminOrder = {
  id: string;
  order_number: number;
  order_type: "TABLE" | "TAKEAWAY";
  table_number: number | null;
  customer_name: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  items: AdminOrderItem[];
};

type StationTicket = {
  id: string;
  station: Station;
  order: AdminOrder;
  items: AdminOrderItem[];
};

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin session expired.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

function AdminOrdersContent() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const [now, setNow] = useState(Date.now());

  async function loadOrders() {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/admin/orders", {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load orders");
      }

      setOrders(Array.isArray(result.orders) ? result.orders : []);

      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const channel = supabaseClient
      .channel("admin-production-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadOrders();
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const tickets = useMemo<StationTicket[]>(() => {
    const result: StationTicket[] = [];

    for (const order of orders) {
      const barItems = order.items.filter(
        (item) => item.station === "BAR" && item.status !== "COMPLETED",
      );

      const kitchenItems = order.items.filter(
        (item) => item.station === "KITCHEN" && item.status !== "COMPLETED",
      );

      if (barItems.length > 0) {
        result.push({
          id: `${order.id}-BAR`,
          station: "BAR",
          order,
          items: barItems,
        });
      }

      if (kitchenItems.length > 0) {
        result.push({
          id: `${order.id}-KITCHEN`,
          station: "KITCHEN",
          order,
          items: kitchenItems,
        });
      }
    }

    return result.sort(
      (a, b) =>
        new Date(a.order.created_at).getTime() -
        new Date(b.order.created_at).getTime(),
    );
  }, [orders]);

  function getTicketStatus(items: AdminOrderItem[]): ActiveStatus {
    if (items.every((item) => item.status === "READY")) {
      return "READY";
    }

    if (
      items.some(
        (item) => item.status === "PREPARING" || item.status === "READY",
      )
    ) {
      return "PREPARING";
    }

    return "ARRIVED";
  }

  const ticketsByStatus = useMemo(() => {
    return {
      ARRIVED: tickets.filter(
        (ticket) => getTicketStatus(ticket.items) === "ARRIVED",
      ),

      PREPARING: tickets.filter(
        (ticket) => getTicketStatus(ticket.items) === "PREPARING",
      ),

      READY: tickets.filter(
        (ticket) => getTicketStatus(ticket.items) === "READY",
      ),
    };
  }, [tickets]);

  async function updateItemStatus(
    itemId: string,
    status: "PREPARING" | "READY" | "COMPLETED",
  ) {
    const headers = await getAuthHeaders();

    const response = await fetch(`/api/staff/items/${itemId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
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

  async function updateTicket(
    ticket: StationTicket,
    status: "PREPARING" | "READY" | "COMPLETED",
  ) {
    try {
      setUpdatingTicketId(ticket.id);
      setError(null);

      const itemsToUpdate = ticket.items.filter(
        (item) => item.status !== status,
      );

      await Promise.all(
        itemsToUpdate.map((item) => updateItemStatus(item.id, status)),
      );

      await loadOrders();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update order",
      );
    } finally {
      setUpdatingTicketId(null);
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

  function renderTicket(ticket: StationTicket, status: ActiveStatus) {
    const isUpdating = updatingTicketId === ticket.id;

    const urgency = getUrgencyStyles(ticket.order.created_at);

    const stationColor = ticket.station === "BAR" ? "#5AD7D9" : "#FA994F";

    return (
      <article
        key={ticket.id}
        style={{
          background: "#ffffff",
          border: `2px solid ${urgency.border}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
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
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: 7,
                    background: stationColor,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {ticket.station}
                </span>

                <span
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  ORDER
                </span>
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                #{ticket.order.order_number}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                {formatTime(ticket.order.created_at)}
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
                }}
              >
                {getElapsedLabel(ticket.order.created_at)}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 15,
              padding: "11px 14px",
              borderRadius: 10,
              background: "#f9fafb",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {ticket.order.order_type === "TABLE"
              ? `TABLE ${ticket.order.table_number}`
              : `PICKUP — ${ticket.order.customer_name || ""}`}
          </div>
        </header>

        <div
          style={{
            padding: "5px 18px",
          }}
        >
          {ticket.items.map((item) => (
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
                  gap: 10,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    minWidth: 32,
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
                    color: "#6b7280",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  ↳ {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        <footer
          style={{
            padding: 18,
          }}
        >
          {status === "ARRIVED" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => updateTicket(ticket, "PREPARING")}
              style={{
                width: "100%",
                minHeight: 50,
                border: "none",
                borderRadius: 10,
                background: "#FA994F",
                color: "#ffffff",
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
              onClick={() => updateTicket(ticket, "READY")}
              style={{
                width: "100%",
                minHeight: 50,
                border: "none",
                borderRadius: 10,
                background: "#5AD7D9",
                color: "#ffffff",
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
              onClick={() => updateTicket(ticket, "COMPLETED")}
              style={{
                width: "100%",
                minHeight: 50,
                border: "none",
                borderRadius: 10,
                background: "#111827",
                color: "#ffffff",
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

  function renderColumn(status: ActiveStatus, columnTickets: StationTicket[]) {
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
            {labels[status]}
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
            {columnTickets.length}
          </div>
        </header>

        {columnTickets.length === 0 ? (
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
            {columnTickets.map((ticket) => renderTicket(ticket, status))}
          </div>
        )}
      </section>
    );
  }

  if (isLoading) {
    return <main style={{ padding: 32 }}>Loading orders...</main>;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f3f4f6",
        color: "#111827",
      }}
    >
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontWeight: 800,
              letterSpacing: 1.5,
              fontSize: 13,
            }}
          >
            AIOLIA
          </div>

          <h1
            style={{
              margin: "3px 0",
              fontSize: 30,
            }}
          >
            Order Control
          </h1>

          <div
            style={{
              color: "#6b7280",
            }}
          >
            {tickets.length} active production tickets
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={loadOrders}
            style={{
              minHeight: 44,
              padding: "0 16px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              borderRadius: 9,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={{
              minHeight: 44,
              padding: "0 16px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              borderRadius: 9,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "start",
          overflowX: "auto",
        }}
      >
        {renderColumn("ARRIVED", ticketsByStatus.ARRIVED)}

        {renderColumn("PREPARING", ticketsByStatus.PREPARING)}

        {renderColumn("READY", ticketsByStatus.READY)}
      </div>
    </main>
  );
}

export default function AdminOrdersPage() {
  return <AdminOrdersContent />;
}
