import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type StatusInput = {
  status: "PREPARING" | "READY" | "COMPLETED";
};

export async function action({
  request,
  params,
}: {
  request: Request;
  params: {
    itemId?: string;
  };
}) {
  try {
    const itemId = params.itemId;

    if (!itemId) {
      return Response.json(
        {
          success: false,
          error: "Missing item ID",
        },
        { status: 400 },
      );
    }

    const { profile } = await requireStaff(request, ["BAR", "KITCHEN"]);

    const input: StatusInput = await request.json();

    if (!["PREPARING", "READY", "COMPLETED"].includes(input.status)) {
      return Response.json(
        {
          success: false,
          error: "Invalid status",
        },
        { status: 400 },
      );
    }

    // First find the item so we know which station it belongs to.
    const { data: existingItem, error: itemError } = await supabase
      .from("order_items")
      .select("id, station, status")
      .eq("id", itemId)
      .single();

    if (itemError || !existingItem) {
      console.error("Order item lookup error:", itemError);

      return Response.json(
        {
          success: false,
          error: "Order item not found",
        },
        { status: 404 },
      );
    }

    // BAR users may only update BAR items.
    // KITCHEN users may only update KITCHEN items.
    // ADMIN may update both.
    if (profile.role !== "ADMIN" && profile.role !== existingItem.station) {
      return Response.json(
        {
          success: false,
          error: "You cannot update items from this station",
        },
        { status: 403 },
      );
    }

    const updateData: {
      status: "PREPARING" | "READY" | "COMPLETED";
      started_at?: string;
      ready_at?: string;
      completed_at?: string;
    } = {
      status: input.status,
    };

    if (input.status === "PREPARING") {
      updateData.started_at = new Date().toISOString();
    }

    if (input.status === "READY") {
      updateData.ready_at = new Date().toISOString();
    }

    if (input.status === "COMPLETED") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("order_items")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Item status update error:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      item: data,
    });
  } catch (error) {
    // requireStaff() may throw a Response with 401 or 403.
    if (error instanceof Response) {
      return error;
    }

    console.error("Update item error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 400 },
    );
  }
}
