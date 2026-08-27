import { supabase } from "../services/supabase.server";

export async function action() {
  // 1. Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: "React Test Customer",
      table_number: 5,
      order_type: "TABLE",
      notes: "Created from React Router backend",
      subtotal: 27.5,
      total: 27.5,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order error:", orderError);

    return Response.json(
      {
        success: false,
        error: orderError.message,
      },
      { status: 500 },
    );
  }

  // 2. Create the order items
  const { error: itemsError } = await supabase.from("order_items").insert([
    {
      order_id: order.id,
      product_id: "burger-aiolia",
      product_name: "Aiolia Burger",
      quantity: 2,
      unit_price: 9.5,
      notes: "No onion",
    },
    {
      order_id: order.id,
      product_id: "aperol",
      product_name: "Aperol Spritz",
      quantity: 1,
      unit_price: 8.5,
      notes: null,
    },
  ]);

  if (itemsError) {
    console.error("Items error:", itemsError);

    return Response.json(
      {
        success: false,
        error: itemsError.message,
      },
      { status: 500 },
    );
  }

  // 3. Create the pending print job
  const { data: printJob, error: printJobError } = await supabase
    .from("print_jobs")
    .insert({
      order_id: order.id,
      status: "PENDING",
    })
    .select()
    .single();

  if (printJobError) {
    console.error("Print job error:", printJobError);

    return Response.json(
      {
        success: false,
        error: printJobError.message,
      },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    order,
    printJob,
  });
}
