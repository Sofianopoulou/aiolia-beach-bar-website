import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

export async function loader({ request }: { request: Request }) {
  await requireStaff(request, ["KITCHEN"]);
  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      id,
      product_name,
      quantity,
      notes,
      status,
      station,
      created_at,
      order:orders (
        id,
        order_number,
        order_type,
        table_number,
        customer_name,
        created_at
      )
    `,
    )
    .eq("station", "KITCHEN")
    .neq("status", "COMPLETED")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("KITCHEN orders fetch error:", error);

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
    items: data,
  });
}
