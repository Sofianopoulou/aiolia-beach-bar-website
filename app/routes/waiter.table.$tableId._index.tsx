import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { supabaseClient } from "../services/supabase.client";

type OrderItemStatus =
  "ARRIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

type TableOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  notes: string | null;
  station: "BAR" | "KITCHEN";
  status: OrderItemStatus;
  created_at: string;
};

type TableOrder = {
  id: string;
  order_number: number;
  subtotal: number | string;
  total: number | string;
  notes: string | null;
  created_at: string;
  items: TableOrderItem[];
};

type RestaurantTable = {
  id: string;
  number: number;
  name: string | null;
  active: boolean;
};

type TableSession = {
  id: string;
  table_id: string;
  status: "OPEN";
  opened_at: string;
  opened_by: string | null;
};

type TablePayment = {
  id: string;
  amount: number | string;
  method: "CASH" | "CARD";
  created_by: string;
  created_at: string;
};

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Waiter session expired.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export default function WaiterTablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [table, setTable] = useState<RestaurantTable | null>(null);

  const [session, setSession] = useState<TableSession | null>(null);

  const [orders, setOrders] = useState<TableOrder[]>([]);

  const [subtotal, setSubtotal] = useState(0);

  const [total, setTotal] = useState(0);

  const [payments, setPayments] = useState<TablePayment[]>([]);
  const [paid, setPaid] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

  const [paymentAmount, setPaymentAmount] = useState("");

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isClosingTable, setIsClosingTable] = useState(false);
  const [closeTableError, setCloseTableError] = useState<string | null>(null);

  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);
  const [cancelItemError, setCancelItemError] = useState<string | null>(null);

  const [cancelModalItem, setCancelModalItem] = useState<TableOrderItem | null>(
    null,
  );

  const [cancelQuantity, setCancelQuantity] = useState(1);

  async function loadTable() {
    if (!tableId) {
      return;
    }

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`/api/waiter/table/${tableId}`, {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load table");
      }

      setTable(result.table);
      setSession(result.session);

      setOrders(Array.isArray(result.orders) ? result.orders : []);

      setSubtotal(Number(result.subtotal ?? 0));

      setTotal(Number(result.total ?? 0));

      setPayments(Array.isArray(result.payments) ? result.payments : []);

      setPaid(Number(result.paid ?? 0));
      setRemaining(Number(result.remaining ?? 0));

      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load table");
    } finally {
      setIsLoading(false);
    }
  }

  async function registerPayment() {
    if (!tableId) {
      return;
    }

    const amount = Number(paymentAmount.replace(",", "."));

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Enter a valid payment amount.");
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          tableId,
          amount,
          method: paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not register payment");
      }

      setIsPaymentOpen(false);
      setPaymentAmount("");
      setPaymentMethod("CASH");

      await loadTable();
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Could not register payment",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function closeTable() {
    if (!tableId) {
      return;
    }

    try {
      setIsClosingTable(true);
      setCloseTableError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/close-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          tableId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not close table");
      }

      navigate("/waiter");
    } catch (error) {
      setCloseTableError(
        error instanceof Error ? error.message : "Could not close table",
      );
    } finally {
      setIsClosingTable(false);
    }
  }

  function openCancelModal(item: TableOrderItem) {
    if (item.status === "CANCELLED") {
      return;
    }

    setCancelItemError(null);
    setCancelModalItem(item);
    setCancelQuantity(1);
  }

  async function confirmCancelItem() {
    if (!cancelModalItem) {
      return;
    }

    if (
      !Number.isInteger(cancelQuantity) ||
      cancelQuantity <= 0 ||
      cancelQuantity > cancelModalItem.quantity
    ) {
      setCancelItemError(
        `Please choose a quantity between 1 and ${cancelModalItem.quantity}.`,
      );
      return;
    }

    try {
      setCancellingItemId(cancelModalItem.id);
      setCancelItemError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/cancel-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          itemId: cancelModalItem.id,
          quantity: cancelQuantity,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Cancel item API failed:", {
          status: response.status,
          result,
        });

        throw new Error(result.error || "Could not cancel item");
      }

      setCancelModalItem(null);
      setCancelQuantity(1);

      await loadTable();
    } catch (error) {
      setCancelItemError(
        error instanceof Error ? error.message : "Could not cancel item",
      );
    } finally {
      setCancellingItemId(null);
    }
  }

  async function handleBackToTables() {
    if (!tableId) {
      navigate("/waiter");
      return;
    }

    /*
     * If there are no orders, release the
     * accidentally opened table first.
     */
    if (orders.length === 0) {
      try {
        const headers = await getAuthHeaders();

        await fetch("/api/waiter/release-empty-table", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            tableId,
          }),
        });
      } catch (error) {
        console.error("Could not release empty table:", error);
      }
    }

    navigate("/waiter");
  }

  useEffect(() => {
    loadTable();

    const channel = supabaseClient
      .channel(`waiter-table-${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadTable();
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [tableId]);

  function formatMoney(amount: number | string) {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(amount ?? 0));
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return <main style={{ padding: 32 }}>Loading table...</main>;
  }

  if (!table) {
    return <main style={{ padding: 32 }}>Table not found.</main>;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "8px 10px 145px",
        color: "#111827",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 10,

          marginBottom: 12,
          padding: "4px 0",
        }}
      >
        <button
          type="button"
          onClick={handleBackToTables}
          style={{
            minHeight: 38,
            padding: "0 10px",

            border: "1px solid #e5e7eb",
            borderRadius: 9,

            background: "#ffffff",
            color: "#4b5563",

            fontSize: 13,
            fontWeight: 800,

            cursor: "pointer",
          }}
        >
          ← Tables
        </button>

        <div
          style={{
            textAlign: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.1,
              fontWeight: 900,
            }}
          >
            Table {table.number}
          </div>

          {table.name && (
            <div
              style={{
                marginTop: 2,
                color: "#6b7280",
                fontSize: 10,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {table.name}
            </div>
          )}
        </div>

        {session ? (
          <div
            style={{
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                color: "#059669",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              ● OPEN
            </div>

            <div
              style={{
                marginTop: 2,
                color: "#9ca3af",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {formatTime(session.opened_at)}
            </div>
          </div>
        ) : (
          <div />
        )}
      </header>

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "block",
        }}
      >
        {/* LEFT — CURRENT BILL */}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              Current Bill
            </h2>

            <div
              style={{
                color: "#9ca3af",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </div>
          </div>

          {orders.length === 0 ? (
            <div
              style={{
                padding: 48,
                border: "2px dashed #e5e7eb",
                borderRadius: 16,
                background: "#ffffff",
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 10,
                }}
              >
                🍽️
              </div>

              <div
                style={{
                  fontWeight: 800,
                }}
              >
                No orders yet
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                }}
              >
                Add the first order to this table.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {orders.map((order) => (
                <article
                  key={order.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {/* ORDER HEADER */}

                  <header
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 20,
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      Order #{order.order_number}
                    </div>

                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 13,
                      }}
                    >
                      {formatTime(order.created_at)}
                    </div>
                  </header>

                  {/* ITEMS */}

                  <div
                    style={{
                      padding: "4px 18px",
                    }}
                  >
                    {order.items.map((item) => {
                      const isCancelled = item.status === "CANCELLED";
                      const isCancelling = cancellingItemId === item.id;

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,

                            padding: "10px 0",

                            borderBottom: "1px solid #eeeeee",

                            opacity: isCancelled ? 0.5 : 1,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                textDecoration: isCancelled
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {item.quantity}× {item.product_name}
                            </div>

                            {item.notes && (
                              <div
                                style={{
                                  marginTop: 4,
                                  color: "#6b7280",
                                  fontSize: 12,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                ↳ {item.notes}
                              </div>
                            )}

                            <div
                              style={{
                                marginTop: 5,

                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,

                                  color:
                                    item.station === "BAR"
                                      ? "#269fa2"
                                      : "#d97724",
                                }}
                              >
                                {item.station}
                              </span>

                              <span
                                style={{
                                  color: isCancelled ? "#dc2626" : "#9ca3af",

                                  fontSize: 10,
                                  fontWeight: isCancelled ? 900 : 700,
                                }}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                              gap: 7,
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 14,
                                textDecoration: isCancelled
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {formatMoney(
                                Number(item.unit_price) * item.quantity,
                              )}
                            </strong>

                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => openCancelModal(item)}
                                style={{
                                  border: "none",

                                  padding: 0,

                                  background: "transparent",
                                  color: "#dc2626",

                                  fontSize: 11,
                                  fontWeight: 800,

                                  cursor: isCancelling
                                    ? "not-allowed"
                                    : "pointer",

                                  opacity: isCancelling ? 0.5 : 1,
                                }}
                              >
                                {isCancelling ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ORDER TOTAL */}

                  <footer
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                    }}
                  >
                    <span
                      style={{
                        color: "#6b7280",
                        fontWeight: 700,
                      }}
                    >
                      Order total
                    </span>

                    <strong>{formatMoney(order.total)}</strong>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FIXED MOBILE BILL BAR */}

        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,

            background: "#ffffff",
            borderTop: "1px solid #d1d5db",

            padding: "10px 12px 12px",

            boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* TOTALS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "center",
              marginBottom: 9,
            }}
          >
            <div>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Total
              </div>

              <div
                style={{
                  marginTop: 1,
                  fontSize: 15,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {formatMoney(total)}
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
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Remaining
              </div>

              <div
                style={{
                  marginTop: 1,
                  fontSize: 15,
                  fontWeight: 900,
                  lineHeight: 1,

                  color: remaining === 0 ? "#059669" : "#111827",
                }}
              >
                {formatMoney(remaining)}
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(`/waiter/table/${table.id}/order`)}
              style={{
                minHeight: 42,

                border: "none",
                borderRadius: 10,

                background: "#FA994F",
                color: "#ffffff",

                fontSize: 13,
                fontWeight: 900,

                cursor: "pointer",
              }}
            >
              + NEW ORDER
            </button>

            {remaining > 0 ? (
              <button
                type="button"
                disabled={orders.length === 0 || remaining <= 0}
                onClick={() => {
                  setPaymentError(null);

                  setPaymentAmount(remaining.toFixed(2));

                  setIsPaymentOpen(true);
                }}
                style={{
                  minHeight: 42,

                  border: "2px solid #5AD7D9",
                  borderRadius: 10,

                  background: "#ffffff",
                  color: "#269fa2",

                  fontSize: 13,
                  fontWeight: 900,

                  cursor: orders.length === 0 ? "not-allowed" : "pointer",

                  opacity: orders.length === 0 ? 0.45 : 1,
                }}
              >
                PAYMENT
              </button>
            ) : orders.length > 0 ? (
              <button
                type="button"
                disabled={isClosingTable}
                onClick={closeTable}
                style={{
                  minHeight: 48,

                  border: "none",
                  borderRadius: 10,

                  background: "#059669",
                  color: "#ffffff",

                  fontSize: 14,
                  fontWeight: 900,

                  cursor: isClosingTable ? "not-allowed" : "pointer",

                  opacity: isClosingTable ? 0.6 : 1,
                }}
              >
                {isClosingTable ? "CLOSING..." : "CLOSE TABLE"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  minHeight: 48,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#f9fafb",
                  color: "#9ca3af",
                  fontWeight: 900,
                }}
              >
                PAYMENT
              </button>
            )}
          </div>

          {closeTableError && (
            <div
              style={{
                marginTop: 8,
                color: "#991b1b",
                fontSize: 12,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {closeTableError}
            </div>
          )}
        </div>

        {isPaymentOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              background: "rgba(0,0,0,0.45)",
            }}
            onMouseDown={() => setIsPaymentOpen(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "#ffffff",
                borderRadius: 18,
                padding: 22,
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    TABLE {table.number}
                  </div>

                  <h2
                    style={{
                      margin: "3px 0 0",
                    }}
                  >
                    Register Payment
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  marginBottom: 18,
                  padding: 14,
                  background: "#f9fafb",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#6b7280",
                  }}
                >
                  <span>Remaining</span>

                  <strong
                    style={{
                      color: "#111827",
                    }}
                  >
                    {formatMoney(remaining)}
                  </strong>
                </div>
              </div>

              {/* METHOD */}

              <div
                style={{
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 800,
                  }}
                >
                  Payment method
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {(["CASH", "CARD"] as const).map((method) => {
                    const selected = paymentMethod === method;

                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        style={{
                          minHeight: 54,
                          border: selected
                            ? "2px solid #5AD7D9"
                            : "1px solid #d1d5db",
                          borderRadius: 10,
                          background: selected ? "#effefe" : "#ffffff",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        {method === "CASH" ? "💶 CASH" : "💳 CARD"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AMOUNT */}

              <label>
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 800,
                  }}
                >
                  Amount
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  max={remaining}
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 52,
                    padding: "0 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                />
              </label>

              {paymentError && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 9,
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontWeight: 700,
                  }}
                >
                  {paymentError}
                </div>
              )}

              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={registerPayment}
                style={{
                  width: "100%",
                  minHeight: 54,
                  marginTop: 20,
                  border: "none",
                  borderRadius: 10,
                  background: "#FA994F",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: isSubmittingPayment ? "not-allowed" : "pointer",
                  opacity: isSubmittingPayment ? 0.6 : 1,
                }}
              >
                {isSubmittingPayment ? "REGISTERING..." : "REGISTER PAYMENT"}
              </button>
            </div>
          </div>
        )}
      </div>
      {cancelModalItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17, 24, 39, 0.55)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => {
            if (!cancellingItemId) {
              setCancelModalItem(null);
              setCancelQuantity(1);
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#ffffff",
              borderRadius: 18,
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "18px 18px 14px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Cancel item
              </div>

              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                {cancelModalItem.product_name}
              </h3>

              <div
                style={{
                  marginTop: 6,
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Available quantity: <strong>{cancelModalItem.quantity}</strong>
              </div>
            </div>

            {/* BODY */}
            <div
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                Quantity to cancel
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCancelQuantity((current) => Math.max(1, current - 1))
                  }
                  disabled={cancellingItemId === cancelModalItem.id}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: 24,
                    fontWeight: 700,
                    cursor:
                      cancellingItemId === cancelModalItem.id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  −
                </button>

                <div
                  style={{
                    minWidth: 70,
                    height: 44,
                    borderRadius: 12,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  {cancelQuantity}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCancelQuantity((current) =>
                      Math.min(cancelModalItem.quantity, current + 1),
                    )
                  }
                  disabled={cancellingItemId === cancelModalItem.id}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: 24,
                    fontWeight: 700,
                    cursor:
                      cancellingItemId === cancelModalItem.id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  +
                </button>
              </div>

              {cancelModalItem.notes && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: 10,
                    borderRadius: 10,
                    background: "#f9fafb",
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Note: {cancelModalItem.notes}
                </div>
              )}

              {cancelItemError && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: 12,
                    borderRadius: 10,
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {cancelItemError}
                </div>
              )}

              {/* ACTIONS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!cancellingItemId) {
                      setCancelModalItem(null);
                      setCancelQuantity(1);
                    }
                  }}
                  disabled={cancellingItemId === cancelModalItem.id}
                  style={{
                    minHeight: 48,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor:
                      cancellingItemId === cancelModalItem.id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Keep item
                </button>

                <button
                  type="button"
                  onClick={confirmCancelItem}
                  disabled={cancellingItemId === cancelModalItem.id}
                  style={{
                    minHeight: 48,
                    borderRadius: 12,
                    border: "none",
                    background: "#FA994F",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: 15,
                    cursor:
                      cancellingItemId === cancelModalItem.id
                        ? "not-allowed"
                        : "pointer",
                    opacity: cancellingItemId === cancelModalItem.id ? 0.7 : 1,
                  }}
                >
                  {cancellingItemId === cancelModalItem.id
                    ? "CANCELLING..."
                    : `Cancel ${cancelQuantity}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
