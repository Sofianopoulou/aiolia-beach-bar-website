import type { WaiterTableListItem } from "../../types/waiter";

type TransferTableModalProps = {
  isOpen: boolean;
  currentTableNumber: number;

  tables: WaiterTableListItem[];

  selectedTableId: string | null;

  isLoadingTables: boolean;
  isTransferring: boolean;

  error: string | null;

  onSelectTable: (tableId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function TransferTableModal({
  isOpen,
  currentTableNumber,
  tables,
  selectedTableId,
  isLoadingTables,
  isTransferring,
  error,
  onSelectTable,
  onClose,
  onConfirm,
}: TransferTableModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: 16,

        background: "rgba(17, 24, 39, 0.55)",
      }}
      onClick={() => {
        if (!isTransferring) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,

          maxHeight: "85vh",

          display: "flex",
          flexDirection: "column",

          background: "#ffffff",

          borderRadius: 18,

          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",

          overflow: "hidden",
        }}
        onClick={(event) => event.stopPropagation()}
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
              color: "#6b7280",

              fontSize: 12,
              fontWeight: 800,

              textTransform: "uppercase",
              letterSpacing: 1.1,
            }}
          >
            Move table
          </div>

          <h2
            style={{
              margin: "5px 0 0",

              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Table {currentTableNumber}
          </h2>

          <div
            style={{
              marginTop: 5,

              color: "#6b7280",

              fontSize: 13,
            }}
          >
            Select the destination table.
          </div>
        </div>

        {/* TABLE LIST */}

        <div
          style={{
            flex: 1,

            overflowY: "auto",

            padding: 14,
          }}
        >
          {isLoadingTables ? (
            <div
              style={{
                padding: 30,

                textAlign: "center",

                color: "#6b7280",

                fontWeight: 700,
              }}
            >
              Loading available tables...
            </div>
          ) : tables.length === 0 ? (
            <div
              style={{
                padding: 30,

                textAlign: "center",

                color: "#9ca3af",

                fontWeight: 700,
              }}
            >
              No free tables available.
            </div>
          ) : (
            <div
              style={{
                display: "grid",

                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

                gap: 8,
              }}
            >
              {tables.map((table) => {
                const selected = selectedTableId === table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={isTransferring}
                    onClick={() => onSelectTable(table.id)}
                    style={{
                      minHeight: 72,

                      padding: 8,

                      border: selected
                        ? "2px solid #5AD7D9"
                        : "1px solid #d1d5db",

                      borderRadius: 12,

                      background: selected ? "#effefe" : "#ffffff",

                      color: "#111827",

                      cursor: isTransferring ? "not-allowed" : "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
                      {table.number}
                    </div>

                    {table.name && (
                      <div
                        style={{
                          marginTop: 3,

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

                    <div
                      style={{
                        marginTop: 4,

                        color: "#059669",

                        fontSize: 9,
                        fontWeight: 900,
                      }}
                    >
                      FREE
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 14,

                padding: 12,

                borderRadius: 10,

                background: "#fee2e2",
                color: "#991b1b",

                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ACTIONS */}

        <div
          style={{
            flexShrink: 0,

            display: "grid",
            gridTemplateColumns: "1fr 1fr",

            gap: 10,

            padding: 14,

            borderTop: "1px solid #e5e7eb",

            background: "#ffffff",
          }}
        >
          <button
            type="button"
            disabled={isTransferring}
            onClick={onClose}
            style={{
              minHeight: 48,

              border: "1px solid #d1d5db",

              borderRadius: 12,

              background: "#ffffff",

              color: "#374151",

              fontWeight: 800,

              cursor: isTransferring ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedTableId || isTransferring}
            onClick={onConfirm}
            style={{
              minHeight: 48,

              border: "none",

              borderRadius: 12,

              background: "#FA994F",

              color: "#ffffff",

              fontWeight: 900,

              cursor:
                !selectedTableId || isTransferring ? "not-allowed" : "pointer",

              opacity: !selectedTableId || isTransferring ? 0.55 : 1,
            }}
          >
            {isTransferring ? "MOVING..." : "MOVE TABLE"}
          </button>
        </div>
      </div>
    </div>
  );
}
