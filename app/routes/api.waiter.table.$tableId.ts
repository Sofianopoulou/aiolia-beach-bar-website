import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: {
    tableId?: string;
  };
}) {
  try {
    const { profile } = await requireStaff(request, ["WAITER", "ADMIN"]);

    if (profile.role !== "WAITER" && profile.role !== "ADMIN") {
      return Response.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const tableId = params.tableId;

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table ID is required",
        },
        { status: 400 },
      );
    }

    const { data: table, error: tableError } = await supabase
      .from("restaurant_tables")
      .select(
        `
          id,
          number,
          name,
          active
        `,
      )
      .eq("id", tableId)
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
      .select(
        `
        id,
        table_id,
        status,
        opened_at,
        opened_by
      `,
      )
      .eq("table_id", table.id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (sessionError) {
      console.error("Table session fetch error:", sessionError);

      return Response.json(
        {
          success: false,
          error: sessionError.message,
        },
        { status: 500 },
      );
    }

    if (!session) {
      return Response.json({
        success: true,
        table,
        session: null,
        orders: [],
        payments: [],
        subtotal: 0,
        total: 0,
        paid: 0,
        remaining: 0,
      });
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          subtotal,
          total,
          notes,
          created_at,

          items:order_items (
            id,
            product_name,
            quantity,
            unit_price,
            notes,
            station,
            status,
            created_at
          )
        `,
      )
      .eq("table_session_id", session.id)
      .order("created_at", {
        ascending: true,
      });

    if (ordersError) {
      console.error("Table orders fetch error:", ordersError);

      return Response.json(
        {
          success: false,
          error: ordersError.message,
        },
        { status: 500 },
      );
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select(
        `
          id,
          amount,
          method,
          created_by,
          created_at
        `,
      )
      .eq("table_session_id", session.id)
      .order("created_at", {
        ascending: true,
      });

    if (paymentsError) {
      console.error("Table payments fetch error:", paymentsError);

      return Response.json(
        {
          success: false,
          error: paymentsError.message,
        },
        { status: 500 },
      );
    }

    const safeOrders = orders ?? [];
    const safePayments = payments ?? [];

    const subtotal = Number(
      safeOrders
        .reduce((sum, order) => sum + Number(order.subtotal ?? 0), 0)
        .toFixed(2),
    );

    const total = Number(
      safeOrders
        .reduce((sum, order) => sum + Number(order.total ?? 0), 0)
        .toFixed(2),
    );

    const paid = Number(
      safePayments
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    );

    const remaining = Number(Math.max(0, total - paid).toFixed(2));

    return Response.json({
      success: true,
      table,
      session,
      orders: safeOrders,
      payments: safePayments,
      subtotal,
      total,
      paid,
      remaining,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Waiter table API error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
