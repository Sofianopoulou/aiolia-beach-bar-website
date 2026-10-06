import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router";

import { supabaseClient } from "../services/supabase.client";

import type { WaiterTableListItem } from "../types/waiter";
import { getCachedTables, setCachedTables } from "../utils/waiterDataCache";

// --------------------------------------------------
// AUTH
// --------------------------------------------------

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

// --------------------------------------------------
// PAGE
// --------------------------------------------------

export default function WaiterDashboardPage() {
  const navigate = useNavigate();

  const [tables, setTables] = useState<WaiterTableListItem[]>(
    () => getCachedTables() ?? [],
  );

  const [isLoading, setIsLoading] = useState(() => getCachedTables() === null);

  const [openingTableId, setOpeningTableId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // LOAD TABLES
  // --------------------------------------------------

  const loadTables = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/tables", {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load tables");
      }

      const nextTables = Array.isArray(result.tables) ? result.tables : [];
      setCachedTables(nextTables);
      setTables(nextTables);

      setError(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load tables",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL LOAD + REALTIME
  // --------------------------------------------------

  useEffect(() => {
    loadTables();

    const channel = supabaseClient
      .channel("waiter-dashboard-realtime")

      // ------------------------------------------------
      // TABLE SESSIONS
      //
      // Covers:
      // - table opened
      // - table closed
      // - table transferred
      // - empty table released
      // ------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_sessions",
        },
        (payload) => {
          loadTables();
        },
      )

      // ------------------------------------------------
      // ORDERS
      //
      // Covers:
      // - new order
      // - order total changed after cancellation
      // - table number updated after transfer
      // ------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadTables();
        },
      )

      // ------------------------------------------------
      // RESTAURANT TABLES
      //
      // Covers future admin changes such as:
      // - table activated/deactivated
      // - name changed
      // ------------------------------------------------

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
        },
        () => {
          loadTables();
        },
      )

      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [loadTables]);

  // --------------------------------------------------
  // TABLE CLICK
  // --------------------------------------------------

  async function handleTableClick(table: WaiterTableListItem) {
    /*
     * If the table already has an open session,
     * simply enter it.
     */
    if (table.status === "OPEN" && table.session) {
      navigate(`/waiter/table/${table.id}`);

      return;
    }

    /*
     * Otherwise create/open the table session.
     */
    try {
      setOpeningTableId(table.id);

      setError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/tables", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...headers,
        },

        body: JSON.stringify({
          action: "OPEN",
          tableId: table.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not open table");
      }

      navigate(`/waiter/table/${table.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not open table");
    } finally {
      setOpeningTableId(null);
    }
  }

  // --------------------------------------------------
  // FORMATTERS
  // --------------------------------------------------

  function formatMoney(value: number) {
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (isLoading) {
    return (
      <main
        style={{
          padding: 32,
        }}
      >
        Loading tables...
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main
      style={{
        minHeight: "100vh",

        background: "#f3f4f6",

        padding: "10px 12px",

        color: "#111827",
      }}
    >
      {/* ERROR */}

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

      {/* TABLES */}

      {tables.length === 0 ? (
        <div
          style={{
            padding: 50,

            background: "#ffffff",

            borderRadius: 16,

            border: "2px dashed #e5e7eb",

            textAlign: "center",

            color: "#9ca3af",

            fontWeight: 700,
          }}
        >
          No restaurant tables configured.
        </div>
      ) : (
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(110px, 100%), 1fr))",

            gap: 10,
          }}
        >
          {tables.map((table) => {
            const isOpen = table.status === "OPEN";

            const isOpening = openingTableId === table.id;

            return (
              <button
                key={table.id}
                type="button"
                disabled={isOpening}
                onClick={() => handleTableClick(table)}
                style={{
                  minHeight: 120,

                  padding: 9,

                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",

                  border: isOpen ? "2px solid #5AD7D9" : "1px solid #e5e7eb",

                  borderRadius: 12,

                  background: isOpen ? "#f0ffff" : "#ffffff",

                  cursor: isOpening ? "wait" : "pointer",

                  opacity: isOpening ? 0.6 : 1,

                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* STATUS */}

                <div
                  style={{
                    display: "flex",

                    justifyContent: "flex-end",

                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      padding: "3px 6px",

                      borderRadius: 6,

                      background: isOpen ? "#5AD7D9" : "#f3f4f6",

                      color: isOpen ? "#ffffff" : "#9ca3af",

                      fontSize: 9,

                      fontWeight: 900,

                      letterSpacing: 0.5,
                    }}
                  >
                    {isOpen ? "OPEN" : "FREE"}
                  </div>
                </div>

                {/* TABLE NUMBER */}

                <div
                  style={{
                    flex: 1,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    width: "100%",

                    fontSize: 36,

                    lineHeight: 1,

                    fontWeight: 900,

                    color: "#111827",
                  }}
                >
                  {table.number}
                </div>

                {/* OPEN TABLE INFO */}

                {isOpen && table.session ? (
                  <div
                    style={{
                      width: "100%",

                      display: "grid",

                      gridTemplateColumns: "minmax(0, 1fr) auto",

                      alignItems: "end",

                      gap: 4,
                    }}
                  >
                    {/* TOTAL */}

                    <div
                      style={{
                        minWidth: 0,

                        flex: 1,

                        fontSize: "clamp(11px, 3vw, 14px)",

                        lineHeight: 1,

                        fontWeight: 900,

                        color: "#111827",

                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(Number(table.session.total ?? 0))}
                    </div>

                    {/* OPEN TIME */}

                    <div
                      style={{
                        flexShrink: 0,

                        fontSize: "clamp(8px, 2.4vw, 10px)",

                        lineHeight: 1,

                        color: "#6b7280",

                        fontWeight: 700,

                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(table.session.opened_at)}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",

                      minHeight: 14,

                      display: "flex",

                      justifyContent: "center",

                      color: "#FA994F",

                      fontSize: 10,

                      fontWeight: 900,
                    }}
                  >
                    {isOpening ? "OPENING..." : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
