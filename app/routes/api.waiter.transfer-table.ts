import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type TransferTableInput = {
  sessionId?: string;
  targetTableId?: string;
};

export async function action({ request }: { request: Request }) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    await requireStaff(request, ["WAITER", "ADMIN"]);

    // --------------------------------------------------
    // 2. Read request body
    // --------------------------------------------------

    const body = (await request.json()) as TransferTableInput;

    const sessionId = body.sessionId;
    const targetTableId = body.targetTableId;

    if (!sessionId) {
      return Response.json(
        {
          success: false,
          error: "Table session ID is required",
        },
        { status: 400 },
      );
    }

    if (!targetTableId) {
      return Response.json(
        {
          success: false,
          error: "Target table ID is required",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 3. Transfer the table session
    // --------------------------------------------------

    const { data, error } = await supabase.rpc("transfer_table_session", {
      p_session_id: sessionId,
      p_target_table_id: targetTableId,
    });

    if (error) {
      console.error("Transfer table RPC error:", error);

      return Response.json(
        {
          success: false,
          error: error.message || "Could not transfer table",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 4. Validate RPC response
    // --------------------------------------------------

    if (!data || data.success !== true) {
      return Response.json(
        {
          success: false,
          error: "Could not transfer table",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 5. Return transfer information
    // --------------------------------------------------

    return Response.json({
      success: true,

      transfer: {
        sessionId: data.session_id,
        oldTableId: data.old_table_id,
        newTableId: data.new_table_id,
        newTableNumber: data.new_table_number,
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Transfer waiter table error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not transfer table",
      },
      { status: 500 },
    );
  }
}
