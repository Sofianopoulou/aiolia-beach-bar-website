import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import CancelItemModal from "../components/waiter/CancelItemModal";
import PaymentModal from "../components/waiter/PaymentModal";
import WaiterBillBar from "../components/waiter/WaiterBillBar";
import WaiterOrderCard from "../components/waiter/WaiterOrderCard";
import WaiterTableHeader from "../components/waiter/WaiterTableHeader";

import { supabaseClient } from "../services/supabase.client";

import type {
  RestaurantTable,
  TableOrder,
  TableOrderItem,
  TablePayment,
  TableSession,
  WaiterTableListItem,
} from "../types/waiter";
import TransferTableModal from "~/components/waiter/TranferTableModal";

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

  const [total, setTotal] = useState(0);

  const [, setPayments] = useState<TablePayment[]>([]);
  const [, setPaid] = useState(0);

  const [remaining, setRemaining] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // PAYMENT
  // --------------------------------------------------

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

  const [paymentAmount, setPaymentAmount] = useState("");

  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [paymentError, setPaymentError] = useState<string | null>(null);

  // --------------------------------------------------
  // CLOSE TABLE
  // --------------------------------------------------

  const [isClosingTable, setIsClosingTable] = useState(false);

  const [closeTableError, setCloseTableError] = useState<string | null>(null);

  // --------------------------------------------------
  // CANCEL ITEM
  // --------------------------------------------------

  const [cancellingItemId, setCancellingItemId] = useState<string | null>(null);

  const [cancelItemError, setCancelItemError] = useState<string | null>(null);

  const [cancelModalItem, setCancelModalItem] = useState<TableOrderItem | null>(
    null,
  );

  const [cancelQuantity, setCancelQuantity] = useState(1);

  // --------------------------------------------------
  // LOAD TABLE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // REGISTER PAYMENT
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CLOSE TABLE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CANCEL ITEM
  // --------------------------------------------------

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

  // --------------------------------------------------
  // TRANSFER TABLE
  // --------------------------------------------------

  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [availableTables, setAvailableTables] = useState<WaiterTableListItem[]>(
    [],
  );

  const [selectedTargetTableId, setSelectedTargetTableId] = useState<
    string | null
  >(null);

  const [isLoadingTransferTables, setIsLoadingTransferTables] = useState(false);

  const [isTransferringTable, setIsTransferringTable] = useState(false);

  const [transferTableError, setTransferTableError] = useState<string | null>(
    null,
  );

  async function openTransferModal() {
    if (!table || !session) {
      return;
    }

    try {
      setIsTransferOpen(true);

      setIsLoadingTransferTables(true);

      setTransferTableError(null);

      setSelectedTargetTableId(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/tables", {
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not load available tables");
      }

      const freeTables = (
        Array.isArray(result.tables) ? result.tables : []
      ).filter(
        (candidate: WaiterTableListItem) =>
          candidate.status === "FREE" && candidate.id !== table.id,
      );

      setAvailableTables(freeTables);
    } catch (error) {
      setTransferTableError(
        error instanceof Error
          ? error.message
          : "Could not load available tables",
      );
    } finally {
      setIsLoadingTransferTables(false);
    }
  }

  async function transferTable() {
    if (!session || !selectedTargetTableId) {
      return;
    }

    try {
      setIsTransferringTable(true);

      setTransferTableError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/transfer-table", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...headers,
        },

        body: JSON.stringify({
          sessionId: session.id,

          targetTableId: selectedTargetTableId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not transfer table");
      }

      const newTableId = result.transfer.newTableId;

      setIsTransferOpen(false);

      setSelectedTargetTableId(null);

      /*
       * The session now belongs to another table,
       * so navigate to that table's waiter page.
       */
      navigate(`/waiter/table/${newTableId}`, {
        replace: true,
      });
    } catch (error) {
      setTransferTableError(
        error instanceof Error ? error.message : "Could not transfer table",
      );
    } finally {
      setIsTransferringTable(false);
    }
  }

  // --------------------------------------------------
  // BACK TO TABLES
  // --------------------------------------------------

  async function handleBackToTables() {
    if (!tableId) {
      navigate("/waiter");

      return;
    }

    /*
     * If there are no orders,
     * release an accidentally opened
     * empty table before leaving.
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

  // --------------------------------------------------
  // REALTIME
  // --------------------------------------------------

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

  // --------------------------------------------------
  // FORMATTERS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOADING / ERROR
  // --------------------------------------------------

  if (isLoading) {
    return (
      <main
        style={{
          padding: 32,
        }}
      >
        Loading table...
      </main>
    );
  }

  if (!table) {
    return (
      <main
        style={{
          padding: 32,
        }}
      >
        Table not found.
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

        padding: "8px 10px 145px",

        color: "#111827",
      }}
    >
      {/* HEADER */}

      <WaiterTableHeader
        table={table}
        session={session}
        onBack={handleBackToTables}
        onMoveTable={openTransferModal}
        formatTime={formatTime}
      />

      {/* PAGE ERROR */}

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

      {/* CURRENT BILL */}

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
              <WaiterOrderCard
                key={order.id}
                order={order}
                cancellingItemId={cancellingItemId}
                onCancelItem={openCancelModal}
                formatMoney={formatMoney}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </section>

      {/* FIXED BILL BAR */}

      <WaiterBillBar
        total={total}
        remaining={remaining}
        hasOrders={orders.length > 0}
        isClosingTable={isClosingTable}
        closeTableError={closeTableError}
        onNewOrder={() => navigate(`/waiter/table/${table.id}/order`)}
        onPayment={() => {
          setPaymentError(null);

          setPaymentAmount(remaining.toFixed(2));

          setIsPaymentOpen(true);
        }}
        onCloseTable={closeTable}
        formatMoney={formatMoney}
      />

      {/* PAYMENT MODAL */}

      <PaymentModal
        isOpen={isPaymentOpen}
        tableNumber={table.number}
        remaining={remaining}
        paymentMethod={paymentMethod}
        paymentAmount={paymentAmount}
        isSubmitting={isSubmittingPayment}
        error={paymentError}
        onClose={() => {
          setIsPaymentOpen(false);

          setPaymentError(null);
        }}
        onMethodChange={setPaymentMethod}
        onAmountChange={setPaymentAmount}
        onSubmit={registerPayment}
        formatMoney={formatMoney}
      />

      {/* CANCEL ITEM MODAL */}

      <CancelItemModal
        item={cancelModalItem}
        quantity={cancelQuantity}
        isCancelling={cancellingItemId === cancelModalItem?.id}
        error={cancelItemError}
        onQuantityChange={setCancelQuantity}
        onClose={() => {
          setCancelModalItem(null);
          setCancelQuantity(1);
          setCancelItemError(null);
        }}
        onConfirm={confirmCancelItem}
      />

      {/* TRANSFER TABLE MODAL */}

      <TransferTableModal
        isOpen={isTransferOpen}
        currentTableNumber={table.number}
        tables={availableTables}
        selectedTableId={selectedTargetTableId}
        isLoadingTables={isLoadingTransferTables}
        isTransferring={isTransferringTable}
        error={transferTableError}
        onSelectTable={setSelectedTargetTableId}
        onClose={() => {
          if (isTransferringTable) {
            return;
          }

          setIsTransferOpen(false);
          setSelectedTargetTableId(null);
          setTransferTableError(null);
        }}
        onConfirm={transferTable}
      />
    </main>
  );
}
