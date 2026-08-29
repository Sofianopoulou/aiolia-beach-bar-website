import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../services/supabase.client";

type StaffMember = {
  id: string;
  name: string;
  role: "BAR" | "KITCHEN";
  active: boolean;
};

type ShiftStatus = "ASSIGNED" | "ACTIVE" | "CLOSED" | "CANCELLED";

type StaffShift = {
  id: string;
  user_id: string;
  station: "BAR" | "KITCHEN";
  status: ShiftStatus;

  scheduled_start: string;
  scheduled_end: string;

  started_at: string | null;
  ended_at: string | null;

  staff: {
    id: string;
    name: string;
    role: "BAR" | "KITCHEN";
  } | null;
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

function AdminShiftsContent() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadStaff() {
    const headers = await getAuthHeaders();

    const response = await fetch("/api/admin/staff", {
      headers,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Could not load staff");
    }

    setStaff(result.staff);
  }

  async function loadShifts() {
    const headers = await getAuthHeaders();

    const response = await fetch("/api/admin/shifts", {
      headers,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Could not load shifts");
    }

    setShifts(Array.isArray(result.shifts) ? result.shifts : []);
  }

  async function loadPage() {
    try {
      setError(null);

      await Promise.all([loadStaff(), loadShifts()]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function createShift(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsCreating(true);
      setError(null);

      if (!selectedUserId || !scheduledStart || !scheduledEnd) {
        throw new Error("Please complete all shift fields.");
      }

      const start = new Date(scheduledStart);
      const end = new Date(scheduledEnd);

      if (end <= start) {
        throw new Error("Shift end must be after shift start.");
      }

      const headers = await getAuthHeaders();

      const response = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not create shift");
      }

      setSelectedUserId("");
      setScheduledStart("");
      setScheduledEnd("");

      await loadShifts();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create shift",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusStyle(status: ShiftStatus) {
    if (status === "ACTIVE") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "ASSIGNED") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (status === "CANCELLED") {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#4b5563",
    };
  }

  if (isLoading) {
    return <main style={{ padding: 32 }}>Loading staff shifts...</main>;
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
      {/* HEADER */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
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
              margin: "3px 0",
              fontSize: 30,
            }}
          >
            Staff Shifts
          </h1>

          <div
            style={{
              color: "#6b7280",
            }}
          >
            Assign and monitor staff shifts.
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin")}
          style={{
            minHeight: 44,
            padding: "0 16px",
            borderRadius: 9,
            border: "1px solid #d1d5db",
            background: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* CREATE SHIFT */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 22,
          marginBottom: 28,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Assign New Shift
        </h2>

        <form
          onSubmit={createShift}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            alignItems: "end",
          }}
        >
          <label>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 7,
              }}
            >
              Staff member
            </div>

            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              required
              style={{
                width: "100%",
                minHeight: 46,
                borderRadius: 9,
                border: "1px solid #d1d5db",
                padding: "0 10px",
                fontSize: 16,
                background: "#ffffff",
              }}
            >
              <option value="">Select staff...</option>

              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 7,
              }}
            >
              Start
            </div>

            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(event) => setScheduledStart(event.target.value)}
              required
              style={{
                width: "100%",
                minHeight: 46,
                boxSizing: "border-box",
                borderRadius: 9,
                border: "1px solid #d1d5db",
                padding: "0 10px",
                fontSize: 16,
              }}
            />
          </label>

          <label>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 7,
              }}
            >
              End
            </div>

            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(event) => setScheduledEnd(event.target.value)}
              required
              style={{
                width: "100%",
                minHeight: 46,
                boxSizing: "border-box",
                borderRadius: 9,
                border: "1px solid #d1d5db",
                padding: "0 10px",
                fontSize: 16,
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isCreating}
            style={{
              minHeight: 46,
              padding: "0 18px",
              border: "none",
              borderRadius: 9,
              background: "#FA994F",
              color: "#ffffff",
              fontWeight: 900,
              cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.6 : 1,
            }}
          >
            {isCreating ? "CREATING..." : "ASSIGN SHIFT"}
          </button>
        </form>
      </section>

      {/* SHIFTS */}

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Shifts</h2>

          <div
            style={{
              color: "#6b7280",
            }}
          >
            {shifts.length} total
          </div>
        </div>

        {shifts.length === 0 ? (
          <div
            style={{
              padding: 36,
              background: "#ffffff",
              border: "2px dashed #e5e7eb",
              borderRadius: 14,
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            No shifts assigned yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {shifts.map((shift) => {
              const statusStyle = getStatusStyle(shift.status);

              return (
                <article
                  key={shift.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(180px, 1fr) minmax(190px, 1fr) auto",
                    gap: 20,
                    alignItems: "center",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      {shift.staff?.name || "Unknown staff"}
                    </div>

                    <div
                      style={{
                        color: "#6b7280",
                        marginTop: 3,
                      }}
                    >
                      {shift.station}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {formatDate(shift.scheduled_start)}
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        color: "#6b7280",
                      }}
                    >
                      {formatTime(shift.scheduled_start)}
                      {" → "}
                      {formatTime(shift.scheduled_end)}
                    </div>

                    {shift.status === "ACTIVE" && shift.started_at && (
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 13,
                          color: "#059669",
                        }}
                      >
                        Started {formatTime(shift.started_at)}
                      </div>
                    )}

                    {shift.status === "CLOSED" && shift.ended_at && (
                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        Ended {formatTime(shift.ended_at)}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 900,
                      ...statusStyle,
                    }}
                  >
                    {shift.status}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function AdminShiftsPage() {
  return <AdminShiftsContent />;
}
