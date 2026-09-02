import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function action({ request }: { request: Request }) {
  try {
    const { user } = await requireStaff(request, ["WAITER", "ADMIN"]);

    const { tableId } = await request.json();

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table is required",
        },
        { status: 400 },
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("table_sessions")
      .select("id")
      .eq("table_id", tableId)
      .eq("status", "OPEN")
      .maybeSingle();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return Response.json({
        success: true,
      });
    }

    const { count, error: ordersError } = await supabase
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("table_session_id", session.id);

    if (ordersError) {
      throw ordersError;
    }

    // Only release truly empty tables.
    if ((count ?? 0) > 0) {
      return Response.json({
        success: true,
        released: false,
      });
    }

    const { error: closeError } = await supabase
      .from("table_sessions")
      .update({
        status: "CLOSED",
        closed_at: new Date().toISOString(),
        closed_by: user.id,
      })
      .eq("id", session.id)
      .eq("status", "OPEN");

    if (closeError) {
      throw closeError;
    }

    return Response.json({
      success: true,
      released: true,
    });
  } catch (error) {
    console.error("Release empty table error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
