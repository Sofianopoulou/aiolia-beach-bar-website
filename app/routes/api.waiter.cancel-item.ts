import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

type CancelItemInput = {
  itemId?: string;
  quantity?: number;
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

    const body = (await request.json()) as CancelItemInput;

    const itemId = body.itemId;
    const requestedQuantity = body.quantity;

    if (!itemId) {
      return Response.json(
        {
          success: false,
          error: "Item ID is required",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 1. Load the item
    // --------------------------------------------------

    const { data: item, error: itemError } = await supabase
      .from("order_items")
      .select(
        `
          id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      notes,
      station,
      status
        `,
      )
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return Response.json(
        {
          success: false,
          error: "Order item not found",
        },
        { status: 404 },
      );
    }

    const cancelQuantity =
      requestedQuantity === undefined
        ? Number(item.quantity)
        : Number(requestedQuantity);

    // QUANTITY VALIDATION
    if (
      !Number.isInteger(cancelQuantity) ||
      cancelQuantity <= 0 ||
      cancelQuantity > Number(item.quantity)
    ) {
      return Response.json(
        {
          success: false,
          error: `Cancellation quantity must be between 1 and ${item.quantity}.`,
        },
        { status: 400 },
      );
    }

    if (item.status === "CANCELLED") {
      return Response.json(
        {
          success: false,
          error: "This item is already cancelled",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 2. Load its order
    // --------------------------------------------------

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
          id,
          table_session_id,
          subtotal,
          total
        `,
      )
      .eq("id", item.order_id)
      .single();

    if (orderError || !order) {
      return Response.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    if (!order.table_session_id) {
      return Response.json(
        {
          success: false,
          error: "This order is not connected to an open table",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 3. Make sure the table session is still OPEN
    // --------------------------------------------------

    const { data: tableSession, error: sessionError } = await supabase
      .from("table_sessions")
      .select(
        `
          id,
          status
        `,
      )
      .eq("id", order.table_session_id)
      .single();

    if (sessionError || !tableSession) {
      return Response.json(
        {
          success: false,
          error: "Table session not found",
        },
        { status: 404 },
      );
    }

    if (tableSession.status !== "OPEN") {
      return Response.json(
        {
          success: false,
          error: "This table is already closed",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 4. Calculate the new total for this order
    // --------------------------------------------------

    const cancelledValue = Number(item.unit_price) * cancelQuantity;

    const currentOrderTotal = Number(order.total ?? 0);

    const newOrderTotal = Number(
      Math.max(0, currentOrderTotal - cancelledValue).toFixed(2),
    );

    // --------------------------------------------------
    // 5. Calculate what the whole table total would become
    // --------------------------------------------------

    const { data: sessionOrders, error: sessionOrdersError } = await supabase
      .from("orders")
      .select(
        `
          id,
          total
        `,
      )
      .eq("table_session_id", tableSession.id);

    if (sessionOrdersError) {
      throw new Error(sessionOrdersError.message);
    }

    const currentTableTotal = Number(
      (sessionOrders ?? [])
        .reduce((sum, sessionOrder) => sum + Number(sessionOrder.total ?? 0), 0)
        .toFixed(2),
    );

    const newTableTotal = Number(
      Math.max(
        0,
        currentTableTotal - currentOrderTotal + newOrderTotal,
      ).toFixed(2),
    );

    // --------------------------------------------------
    // 6. Check payments
    // --------------------------------------------------

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("table_session_id", tableSession.id);

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    const paid = Number(
      (payments ?? [])
        .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        .toFixed(2),
    );

    if (paid > newTableTotal) {
      return Response.json(
        {
          success: false,
          error:
            "This item cannot be cancelled because the table has already received payments exceeding the new total.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 7. Cancel the item
    // --------------------------------------------------

    const now = new Date().toISOString();

    if (cancelQuantity === Number(item.quantity)) {
      // Entire item row is cancelled.
      const { error: cancelError } = await supabase
        .from("order_items")
        .update({
          status: "CANCELLED",
          cancelled_at: now,
          cancelled_by: user.id,
        })
        .eq("id", item.id);

      if (cancelError) {
        throw new Error(cancelError.message);
      }
    } else {
      // Only part of the quantity is cancelled.
      const remainingQuantity = Number(item.quantity) - cancelQuantity;

      // Keep the original active item with the remaining quantity.
      const { error: quantityError } = await supabase
        .from("order_items")
        .update({
          quantity: remainingQuantity,
        })
        .eq("id", item.id);

      if (quantityError) {
        throw new Error(quantityError.message);
      }

      // Create a separate CANCELLED row for audit/history.
      const { error: cancelledRowError } = await supabase
        .from("order_items")
        .insert({
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: cancelQuantity,
          unit_price: item.unit_price,
          notes: item.notes,
          station: item.station,

          status: "CANCELLED",

          cancelled_at: now,
          cancelled_by: user.id,
        });

      if (cancelledRowError) {
        throw new Error(cancelledRowError.message);
      }
    }

    // --------------------------------------------------
    // 8. Update the order total
    // --------------------------------------------------

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        subtotal: newOrderTotal,
        total: newOrderTotal,
      })
      .eq("id", order.id);

    if (updateOrderError) {
      /*
       * Important:
       * The item has already been cancelled at this point.
       * Log loudly because this would need manual correction.
       */
      console.error(
        "Item cancelled but order total update failed:",
        updateOrderError,
      );

      return Response.json(
        {
          success: false,
          error:
            "The item was cancelled, but the order total could not be updated.",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,

      item: {
        id: item.id,
        product_name: item.product_name,
        status: "CANCELLED",
      },

      orderTotal: newOrderTotal,
      tableTotal: newTableTotal,
      paid,
      remaining: Number(Math.max(0, newTableTotal - paid).toFixed(2)),
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Cancel waiter item error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not cancel item",
      },
      { status: 500 },
    );
  }
}
