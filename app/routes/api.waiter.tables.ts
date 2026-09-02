import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function loader({ request }: { request: Request }) {
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

    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select(
        `
          id,
          number,
          name,
          active
        `,
      )
      .eq("active", true)
      .order("number", {
        ascending: true,
      });

    if (tablesError) {
      console.error("Waiter tables fetch error:", tablesError);

      return Response.json(
        {
          success: false,
          error: tablesError.message,
        },
        { status: 500 },
      );
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("table_sessions")
      .select(
        `
          id,
          table_id,
          status,
          opened_at
        `,
      )
      .eq("status", "OPEN");

    if (sessionsError) {
      console.error("Open table sessions fetch error:", sessionsError);

      return Response.json(
        {
          success: false,
          error: sessionsError.message,
        },
        { status: 500 },
      );
    }

    const openSessions = sessions ?? [];

    const sessionIds = openSessions.map((session) => session.id);

    let sessionOrders: {
      table_session_id: string | null;
      total: number | string | null;
    }[] = [];

    if (sessionIds.length > 0) {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
            table_session_id,
            total
          `,
        )
        .in("table_session_id", sessionIds);

      if (ordersError) {
        console.error("Table session orders fetch error:", ordersError);

        return Response.json(
          {
            success: false,
            error: ordersError.message,
          },
          { status: 500 },
        );
      }

      sessionOrders = orders ?? [];
    }

    const sessionByTable = new Map(
      openSessions.map((session) => [session.table_id, session]),
    );

    const totalBySession = new Map<string, number>();

    for (const order of sessionOrders) {
      if (!order.table_session_id) {
        continue;
      }

      const current = totalBySession.get(order.table_session_id) ?? 0;

      totalBySession.set(
        order.table_session_id,
        current + Number(order.total ?? 0),
      );
    }

    const result = (tables ?? []).map((table) => {
      const session = sessionByTable.get(table.id) ?? null;

      return {
        id: table.id,
        number: table.number,
        name: table.name,
        status: session ? "OPEN" : "FREE",
        session: session
          ? {
              id: session.id,
              opened_at: session.opened_at,
              total: totalBySession.get(session.id) ?? 0,
            }
          : null,
      };
    });

    return Response.json({
      success: true,
      tables: result,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Waiter tables API error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

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

    const body = await request.json();

    const action = body.action;
    const tableId = body.tableId;

    if (action !== "OPEN") {
      return Response.json(
        {
          success: false,
          error: "Invalid action",
        },
        { status: 400 },
      );
    }

    if (!tableId) {
      return Response.json(
        {
          success: false,
          error: "Table is required",
        },
        { status: 400 },
      );
    }

    // Make sure the table exists and is active.
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

    if (!table.active) {
      return Response.json(
        {
          success: false,
          error: "This table is inactive",
        },
        { status: 400 },
      );
    }

    // If another waiter has already opened it,
    // simply return that existing session.
    const { data: existingSession, error: existingSessionError } =
      await supabase
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
        .eq("table_id", tableId)
        .eq("status", "OPEN")
        .maybeSingle();

    if (existingSessionError) {
      console.error(
        "Check existing table session error:",
        existingSessionError,
      );

      return Response.json(
        {
          success: false,
          error: existingSessionError.message,
        },
        { status: 500 },
      );
    }

    if (existingSession) {
      return Response.json({
        success: true,
        session: existingSession,
        alreadyOpen: true,
      });
    }

    const { data: session, error: createError } = await supabase
      .from("table_sessions")
      .insert({
        table_id: tableId,
        status: "OPEN",
        opened_by: user.id,
      })
      .select(
        `
        id,
        table_id,
        status,
        opened_at,
        opened_by
      `,
      )
      .single();

    if (createError) {
      console.error("Open table session error:", createError);

      return Response.json(
        {
          success: false,
          error: createError.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      session,
      alreadyOpen: false,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Waiter open table error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
