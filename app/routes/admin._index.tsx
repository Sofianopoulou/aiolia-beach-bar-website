import { useNavigate } from "react-router";

function AdminDashboardContent() {
  const navigate = useNavigate();

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
          marginBottom: 32,
        }}
      >
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
            margin: "4px 0 6px",
            fontSize: 32,
          }}
        >
          Admin Dashboard
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
          }}
        >
          Manage orders, shifts, and restaurant performance.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          maxWidth: 900,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          style={{
            minHeight: 180,
            padding: 24,
            textAlign: "left",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: 28,
              marginBottom: 14,
            }}
          >
            📋
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 6,
            }}
          >
            Orders
          </div>

          <div
            style={{
              color: "#6b7280",
            }}
          >
            Monitor BAR and KITCHEN production and manage order statuses.
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/analytics")}
          style={{
            minHeight: 180,
            padding: 24,
            textAlign: "left",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 14, color: "#FA994F" }}>A</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Analytics</div>
          <div style={{ color: "#6b7280" }}>Review sales, products, payments, and waiter activity.</div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/shifts")}
          style={{
            minHeight: 180,
            padding: 24,
            textAlign: "left",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: 28,
              marginBottom: 14,
            }}
          >
            👥
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 6,
            }}
          >
            Shifts
          </div>

          <div
            style={{
              color: "#6b7280",
            }}
          >
            Assign and manage shifts for BAR and KITCHEN staff.
          </div>
        </button>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
