import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function loader({ request }: { request: Request }) {
  try {
    await requireStaff(request, ["ADMIN"]);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        order_type,
        table_number,
        customer_name,
        phone,
        notes,
        created_at,

        items:order_items (
          id,
          product_name,
          quantity,
          notes,
          station,
          status,
          created_at,
          started_at,
          ready_at,
          completed_at
        )
      `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Admin orders fetch error:", error);

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
      orders: data,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Admin orders error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
