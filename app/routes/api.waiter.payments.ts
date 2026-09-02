import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type PaymentMethod = "CASH" | "CARD";

type PaymentInput = {
  tableId: string;
  amount: number;
  method: PaymentMethod;
};

export async function action({ request }: { request: Request }) {
  try {
    const { user, profile } = await requireStaff(request, ["WAITER", "ADMIN"]);

    if (profile.role !== "WAITER" && profile.role !== "ADMIN") {
      return Response.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const input: PaymentInput = await request.json();

    if (!input.tableId) {
      return Response.json(
        {
          success: false,
          error: "Table is required",
        },
        { status: 400 },
      );
    }

    if (input.method !== "CASH" && input.method !== "CARD") {
      return Response.json(
        {
          success: false,
          error: "Invalid payment method",
        },
        { status: 400 },
      );
    }

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        {
          success: false,
          error: "Invalid payment amount",
        },
        { status: 400 },
      );
    }

    const { data: table, error: tableError } = await supabase
      .from("restaurant_tables")
      .select("id, number, active")
      .eq("id", input.tableId)
      .single();

    if (tableError || !table) {
      return Response.json(
        {
          success: false,
          error: "Table not found",
        },
        { status: 404 },
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("table_sessions")
      .select("id, table_id, status")
      .eq("table_id", table.id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (sessionError) {
      console.error("Payment session lookup error:", sessionError);

      return Response.json(
        {
          success: false,
          error: sessionError.message,
        },
        { status: 500 },
      );
    }

    if (!session) {
      return Response.json(
        {
          success: false,
          error: "No open table session found",
        },
        { status: 409 },
      );
    }

    // Calculate current table total.
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total")
      .eq("table_session_id", session.id);

    if (ordersError) {
      return Response.json(
        {
          success: false,
          error: ordersError.message,
        },
        { status: 500 },
      );
    }

    const total = Number(
      (orders ?? [])
        .reduce((sum, order) => sum + Number(order.total ?? 0), 0)
        .toFixed(2),
    );

    // Calculate payments already made.
    const { data: existingPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("table_session_id", session.id);

    if (paymentsError) {
      return Response.json(
        {
          success: false,
          error: paymentsError.message,
        },
        { status: 500 },
      );
    }

    const alreadyPaid = Number(
      (existingPayments ?? [])
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    );

    const remaining = Number(Math.max(0, total - alreadyPaid).toFixed(2));

    if (remaining <= 0) {
      return Response.json(
        {
          success: false,
          error: "This table is already fully paid",
        },
        { status: 409 },
      );
    }

    if (amount > remaining) {
      return Response.json(
        {
          success: false,
          error: `Payment cannot exceed remaining balance of €${remaining.toFixed(
            2,
          )}`,
        },
        { status: 400 },
      );
    }

    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        table_session_id: session.id,
        amount: Number(amount.toFixed(2)),
        method: input.method,
        created_by: user.id,
      })
      .select(
        `
        id,
        table_session_id,
        amount,
        method,
        created_by,
        created_at
      `,
      )
      .single();

    if (insertError || !payment) {
      console.error("Create payment error:", insertError);

      return Response.json(
        {
          success: false,
          error: insertError?.message ?? "Could not create payment",
        },
        { status: 500 },
      );
    }

    const newPaid = Number((alreadyPaid + amount).toFixed(2));

    const newRemaining = Number(Math.max(0, total - newPaid).toFixed(2));

    return Response.json({
      success: true,
      payment,
      total,
      paid: newPaid,
      remaining: newRemaining,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Register payment error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
