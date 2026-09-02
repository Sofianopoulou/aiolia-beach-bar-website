import menuJson from "../../public/menu.json";

import { supabase } from "../services/supabase.server";
import { requireStaff } from "../services/staffAuth.server";

import { createProductId } from "../utils/productId";
import { getProductModifierGroups } from "../utils/modifiers";

import type {
  MenuData,
  MenuItem,
  ModifierGroup,
  Section,
} from "../types/types";

type ModifierSelectionInput = {
  groupId: string;
  optionIds: string[];
};

type WaiterOrderItemInput = {
  productId: string;
  quantity: number;

  modifiers?: ModifierSelectionInput[];

  note?: string;
};

type WaiterOrderInput = {
  tableId: string;

  items: WaiterOrderItemInput[];

  notes?: string;
};

type ProductDefinition = {
  productId: string;

  section: Section;
  item: MenuItem;

  name: string;

  price: number;

  station: "BAR" | "KITCHEN";

  modifierGroups: ModifierGroup[];
};

const menu = menuJson as MenuData;

const products = new Map<string, ProductDefinition>();

function parsePrice(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace("€", "").replace(",", ".").trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

/*
 * Build authoritative server-side product map.
 *
 * Informational menu entries without name/price
 * are automatically ignored.
 */
for (const section of menu.sections) {
  if (!section.station) {
    continue;
  }

  for (const item of section.items) {
    if (!item.name?.trim()) {
      continue;
    }

    const price = parsePrice(item.price);

    if (price === null) {
      continue;
    }

    const productId = createProductId(section.name, item.name);

    products.set(productId, {
      productId,

      section,
      item,

      name: item.name,

      price,

      station: section.station,

      modifierGroups: getProductModifierGroups(section, item),
    });
  }
}

function processModifiers(
  product: ProductDefinition,
  selections: ModifierSelectionInput[] | undefined,
) {
  const groups = product.modifierGroups;

  const selectionMap = new Map<string, string[]>();

  for (const selection of selections ?? []) {
    if (!selection.groupId || !Array.isArray(selection.optionIds)) {
      throw new Error(`Invalid modifiers for ${product.name}`);
    }

    if (selectionMap.has(selection.groupId)) {
      throw new Error(`Duplicate modifier group for ${product.name}`);
    }

    selectionMap.set(selection.groupId, [...new Set(selection.optionIds)]);
  }

  /*
   * Reject groups that don't actually belong
   * to this product.
   */
  for (const groupId of selectionMap.keys()) {
    const exists = groups.some((group) => group.id === groupId);

    if (!exists) {
      throw new Error(
        `Unknown modifier group "${groupId}" for ${product.name}`,
      );
    }
  }

  let extraPrice = 0;

  const noteLines: string[] = [];

  for (const group of groups) {
    const selectedOptionIds = selectionMap.get(group.id) ?? [];

    /*
     * Required modifier.
     */
    if (group.required && selectedOptionIds.length === 0) {
      throw new Error(`${group.name} is required for ${product.name}`);
    }

    /*
     * Single-choice group.
     */
    if (!group.multiple && selectedOptionIds.length > 1) {
      throw new Error(
        `Only one ${group.name} option can be selected for ${product.name}`,
      );
    }

    const selectedOptions = selectedOptionIds.map((optionId) => {
      const option = group.options.find(
        (candidate) => candidate.id === optionId,
      );

      if (!option) {
        throw new Error(`Unknown ${group.name} option for ${product.name}`);
      }

      return option;
    });

    if (selectedOptions.length === 0) {
      continue;
    }

    for (const option of selectedOptions) {
      extraPrice += Number(option.price ?? 0);
    }

    noteLines.push(
      `${group.name}: ${selectedOptions
        .map((option) => option.name)
        .join(", ")}`,
    );
  }

  return {
    extraPrice: Number(extraPrice.toFixed(2)),

    noteLines,
  };
}

export async function action({ request }: { request: Request }) {
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

    const input: WaiterOrderInput = await request.json();

    if (!input.tableId) {
      return Response.json(
        {
          success: false,
          error: "Table is required",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Order must contain at least one item",
        },
        { status: 400 },
      );
    }

    /*
     * Verify restaurant table.
     */
    const { data: table, error: tableError } = await supabase
      .from("restaurant_tables")
      .select(
        `
        id,
        number,
        active
      `,
      )
      .eq("id", input.tableId)
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

    /*
     * Find current open session.
     */
    const { data: tableSession, error: sessionError } = await supabase
      .from("table_sessions")
      .select(
        `
        id,
        table_id,
        status
      `,
      )
      .eq("table_id", table.id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (sessionError) {
      console.error("Waiter session lookup error:", sessionError);

      return Response.json(
        {
          success: false,
          error: sessionError.message,
        },
        { status: 500 },
      );
    }

    if (!tableSession) {
      return Response.json(
        {
          success: false,
          error: "This table does not have an open session",
        },
        { status: 409 },
      );
    }

    /*
     * Validate every product and modifier.
     */
    const processedItems = input.items.map((submittedItem) => {
      const product = products.get(submittedItem.productId);

      if (!product) {
        throw new Error(`Unknown product: ${submittedItem.productId}`);
      }

      if (
        !Number.isInteger(submittedItem.quantity) ||
        submittedItem.quantity <= 0
      ) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }

      const { extraPrice, noteLines } = processModifiers(
        product,
        submittedItem.modifiers,
      );

      const customNote = submittedItem.note?.trim();

      if (customNote) {
        noteLines.push(`Note: ${customNote}`);
      }

      const unitPrice = Number((product.price + extraPrice).toFixed(2));

      return {
        product_id: submittedItem.productId,

        product_name: product.name,

        quantity: submittedItem.quantity,

        unit_price: unitPrice,

        notes: noteLines.length > 0 ? noteLines.join("\n") : null,

        station: product.station,
      };
    });

    const total = Number(
      processedItems
        .reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
        .toFixed(2),
    );

    /*
     * Create the order.
     */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: null,
        phone: null,

        table_number: table.number,

        table_session_id: tableSession.id,

        order_type: "TABLE",

        notes: input.notes?.trim() || null,

        subtotal: total,
        total,
      })
      .select(
        `
        id,
        order_number,
        total,
        table_session_id
      `,
      )
      .single();

    if (orderError || !order) {
      console.error("Waiter create order error:", orderError);

      return Response.json(
        {
          success: false,
          error: orderError?.message ?? "Could not create order",
        },
        { status: 500 },
      );
    }

    /*
     * Create BAR / KITCHEN items.
     */
    const orderItems = processedItems.map((item) => ({
      order_id: order.id,

      product_id: item.product_id,

      product_name: item.product_name,

      quantity: item.quantity,

      unit_price: item.unit_price,

      notes: item.notes,

      station: item.station,

      status: "ARRIVED",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Waiter order items error:", itemsError);

      /*
       * Prevent an empty/orphan order if item
       * insertion fails.
       */
      await supabase.from("orders").delete().eq("id", order.id);

      return Response.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,

      orderId: order.id,

      orderNumber: order.order_number,

      tableSessionId: tableSession.id,

      total,
    });
  } catch (error) {
    console.error("Waiter order error:", error);

    return Response.json(
      {
        success: false,

        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 400 },
    );
  }
}
