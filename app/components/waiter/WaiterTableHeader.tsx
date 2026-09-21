import type { RestaurantTable, TableSession } from "../../types/waiter";

type WaiterTableHeaderProps = {
  table: RestaurantTable;
  session: TableSession | null;

  onBack: () => void;

  formatTime: (date: string) => string;
};

export default function WaiterTableHeader({
  table,
  session,
  onBack,
  formatTime,
}: WaiterTableHeaderProps) {
  return (
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
      {/* BACK */}
      <button
        type="button"
        onClick={onBack}
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

      {/* TABLE INFO */}
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

      {/* SESSION STATUS */}
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
  );
}
