import type { TableOrderItem } from "../../types/waiter";

type CancelItemModalProps = {
  item: TableOrderItem | null;
  quantity: number;
  isCancelling: boolean;
  error: string | null;

  onQuantityChange: (quantity: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelItemModal({
  item,
  quantity,
  isCancelling,
  error,
  onQuantityChange,
  onClose,
  onConfirm,
}: CancelItemModalProps) {
  if (!item) {
    return null;
  }

  return (
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
        if (!isCancelling) {
          onClose();
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
        onClick={(event) => event.stopPropagation()}
      >
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
            {item.product_name}
          </h3>

          <div
            style={{
              marginTop: 6,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Available quantity: <strong>{item.quantity}</strong>
          </div>
        </div>

        <div style={{ padding: 18 }}>
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
              disabled={isCancelling}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontSize: 24,
                cursor: isCancelling ? "not-allowed" : "pointer",
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
              }}
            >
              {quantity}
            </div>

            <button
              type="button"
              disabled={isCancelling}
              onClick={() =>
                onQuantityChange(Math.min(item.quantity, quantity + 1))
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontSize: 24,
                cursor: isCancelling ? "not-allowed" : "pointer",
              }}
            >
              +
            </button>
          </div>

          {item.notes && (
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
              Note: {item.notes}
            </div>
          )}

          {error && (
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
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button
              type="button"
              disabled={isCancelling}
              onClick={onClose}
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontWeight: 800,
                cursor: isCancelling ? "not-allowed" : "pointer",
              }}
            >
              Keep item
            </button>

            <button
              type="button"
              disabled={isCancelling}
              onClick={onConfirm}
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: "none",
                background: "#FA994F",
                color: "#ffffff",
                fontWeight: 900,
                cursor: isCancelling ? "not-allowed" : "pointer",
                opacity: isCancelling ? 0.7 : 1,
              }}
            >
              {isCancelling ? "CANCELLING..." : `Cancel ${quantity}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
