import type { TableOrder, TableOrderItem } from "../../types/waiter";

type WaiterOrderCardProps = {
  order: TableOrder;
  cancellingItemId: string | null;

  onCancelItem: (item: TableOrderItem) => void;

  formatMoney: (amount: number | string) => string;
  formatTime: (date: string) => string;
};

export default function WaiterOrderCard({
  order,
  cancellingItemId,
  onCancelItem,
  formatMoney,
  formatTime,
}: WaiterOrderCardProps) {
  return (
    <article
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
              {/* LEFT SIDE */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    textDecoration: isCancelled ? "line-through" : "none",
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
                      color: item.station === "BAR" ? "#269fa2" : "#d97724",
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

              {/* RIGHT SIDE */}
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
                    textDecoration: isCancelled ? "line-through" : "none",
                  }}
                >
                  {formatMoney(Number(item.unit_price) * item.quantity)}
                </strong>

                {!isCancelled && (
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => onCancelItem(item)}
                    style={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      color: "#dc2626",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: isCancelling ? "not-allowed" : "pointer",
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
  );
}
