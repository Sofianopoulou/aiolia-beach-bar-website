import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type CloseTableInput = {
  tableId: string;
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

    const input: CloseTableInput = await request.json();

    if (!input.tableId) {
      return Response.json(
        {
          success: false,
          error: "Table is required",
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
      .select("id, status")
      .eq("table_id", table.id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (sessionError) {
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

    const { data: payments, error: paymentsError } = await supabase
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

    const paid = Number(
      (payments ?? [])
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    );

    const remaining = Number(Math.max(0, total - paid).toFixed(2));

    if (remaining > 0) {
      return Response.json(
        {
          success: false,
          error: `Table still has €${remaining.toFixed(2)} remaining`,
        },
        { status: 409 },
      );
    }

    const { data: closedSession, error: closeError } = await supabase
      .from("table_sessions")
      .update({
        status: "CLOSED",
        closed_at: new Date().toISOString(),
        closed_by: user.id,
      })
      .eq("id", session.id)
      .eq("status", "OPEN")
      .select(
        `
        id,
        status,
        opened_at,
        closed_at
      `,
      )
      .single();

    if (closeError || !closedSession) {
      return Response.json(
        {
          success: false,
          error: closeError?.message ?? "Could not close table",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      session: closedSession,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Close table error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
