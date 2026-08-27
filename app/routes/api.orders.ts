import menuJson from "../../public/menu.json";

import { supabase } from "../services/supabase.server";
import { createProductId } from "../utils/productId";

import type { MenuData } from "../types/types";

type OrderItemInput = {
  productId: string;
  quantity: number;
  notes?: string;
};

type OrderInput = {
  customerName?: string;
  phone?: string;
  tableNumber?: number;
  orderType: "TABLE" | "TAKEAWAY";
  items: OrderItemInput[];
  notes?: string;
};

const menu = menuJson as MenuData;

const products = new Map<
  string,
  {
    name: string;
    price: number;
  }
>();

for (const section of menu.sections) {
  for (const item of section.items) {
    if (!item.name || !item.price) {
      continue;
    }

    const productId = createProductId(section.name, item.name);

    const price = Number(item.price.replace("€", "").trim());

    if (!Number.isFinite(price)) {
      continue;
    }

    products.set(productId, {
      name: item.name,
      price,
    });
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const input: OrderInput = await request.json();

    if (input.orderType !== "TABLE" && input.orderType !== "TAKEAWAY") {
      return Response.json(
        {
          success: false,
          error: "Invalid order type",
        },
        { status: 400 },
      );
    }

    if (!input.items?.length) {
      return Response.json(
        {
          success: false,
          error: "Order must contain at least one item",
        },
        { status: 400 },
      );
    }

    if (input.orderType === "TABLE" && !input.tableNumber) {
      return Response.json(
        {
          success: false,
          error: "Table number is required",
        },
        { status: 400 },
      );
    }

    if (
      input.orderType === "TAKEAWAY" &&
      (!input.customerName || !input.phone)
    ) {
      return Response.json(
        {
          success: false,
          error: "Customer name and phone are required for pickup",
        },
        { status: 400 },
      );
    }

    const processedItems = input.items.map((item) => {
      const product = products.get(item.productId);

      if (!product) {
        throw new Error(`Unknown product: ${item.productId}`);
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }

      return {
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        notes: item.notes?.trim() || null,
      };
    });

    const total = Number(
      processedItems
        .reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
        .toFixed(2),
    );

    const { data: result, error: createError } = await supabase.rpc(
      "create_order_with_items",
      {
        p_customer_name:
          input.orderType === "TAKEAWAY"
            ? input.customerName?.trim() || null
            : null,

        p_phone:
          input.orderType === "TAKEAWAY" ? input.phone?.trim() || null : null,

        p_table_number: input.orderType === "TABLE" ? input.tableNumber : null,

        p_order_type: input.orderType,

        p_notes: input.notes?.trim() || null,

        p_subtotal: total,

        p_total: total,

        p_items: processedItems,
      },
    );

    if (createError) {
      console.error("Create order transaction error:", createError);

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
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      total: result.total,
      printJobId: result.printJobId,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 400 },
    );
  }
}
