type WaiterBillBarProps = {
  total: number;
  remaining: number;
  hasOrders: boolean;
  isClosingTable: boolean;
  closeTableError: string | null;

  onNewOrder: () => void;
  onPayment: () => void;
  onCloseTable: () => void;

  formatMoney: (amount: number | string) => string;
};

export default function WaiterBillBar({
  total,
  remaining,
  hasOrders,
  isClosingTable,
  closeTableError,
  onNewOrder,
  onPayment,
  onCloseTable,
  formatMoney,
}: WaiterBillBarProps) {
  return (
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
          onClick={onNewOrder}
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
            disabled={!hasOrders || remaining <= 0}
            onClick={onPayment}
            style={{
              minHeight: 42,

              border: "2px solid #5AD7D9",
              borderRadius: 10,

              background: "#ffffff",
              color: "#269fa2",

              fontSize: 13,
              fontWeight: 900,

              cursor: !hasOrders ? "not-allowed" : "pointer",

              opacity: !hasOrders ? 0.45 : 1,
            }}
          >
            PAYMENT
          </button>
        ) : hasOrders ? (
          <button
            type="button"
            disabled={isClosingTable}
            onClick={onCloseTable}
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
  );
}
