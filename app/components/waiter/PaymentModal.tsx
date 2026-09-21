type PaymentModalProps = {
  isOpen: boolean;
  tableNumber: number;
  remaining: number;
  paymentMethod: "CASH" | "CARD";
  paymentAmount: string;
  isSubmitting: boolean;
  error: string | null;

  onClose: () => void;
  onMethodChange: (method: "CASH" | "CARD") => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;

  formatMoney: (amount: number | string) => string;
};

export default function PaymentModal({
  isOpen,
  tableNumber,
  remaining,
  paymentMethod,
  paymentAmount,
  isSubmitting,
  error,
  onClose,
  onMethodChange,
  onAmountChange,
  onSubmit,
  formatMoney,
}: PaymentModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
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
      onMouseDown={onClose}
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
        {/* HEADER */}
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
              TABLE {tableNumber}
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
            onClick={onClose}
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

        {/* REMAINING */}
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
                  onClick={() => onMethodChange(method)}
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
            onChange={(event) => onAmountChange(event.target.value)}
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

        {/* ERROR */}
        {error && (
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
            {error}
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
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

            cursor: isSubmitting ? "not-allowed" : "pointer",

            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "REGISTERING..." : "REGISTER PAYMENT"}
        </button>
      </div>
    </div>
  );
}
