import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { createReturnSchema } from "../validators/schemas.js";

interface OrderItemRow {
  product_handle: string;
  title: string;
  size: string;
  fit: string;
  price: number;
  quantity: number;
}

/**
 * POST /api/returns — creates a return/replacement request for an order.
 * Validates the requested items against the order (they must exist and not
 * exceed the purchased quantity) and snapshots authoritative title/price.
 */
export async function createReturn(req: Request, res: Response) {
  const input = createReturnSchema.parse(req.body);

  // Load the order with its line items.
  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", input.orderId)
    .maybeSingle();
  if (oErr) throw new ApiError(500, oErr.message);
  if (!order) throw new ApiError(404, "Order not found.");

  const orderItems = (order.items ?? []) as OrderItemRow[];

  // Match each requested item to an order line and validate quantity.
  const returnItems = input.items.map((ri) => {
    const line = orderItems.find(
      (oi) => oi.product_handle === ri.productHandle && oi.size === ri.size,
    );
    if (!line) {
      throw new ApiError(400, `Item ${ri.productHandle} (size ${ri.size}) is not in this order.`);
    }
    if (ri.quantity > line.quantity) {
      throw new ApiError(
        400,
        `You can return at most ${line.quantity} of ${line.title} (size ${ri.size}).`,
      );
    }
    return {
      product_handle: line.product_handle,
      title: line.title,
      size: line.size,
      price: line.price,
      quantity: ri.quantity,
    };
  });

  // Create the return header (customer details snapshotted from the order).
  const { data: ret, error: rErr } = await supabaseAdmin
    .from("returns")
    .insert({
      order_id: order.id,
      email: order.email,
      full_name: order.full_name ?? null,
      phone: order.phone ?? null,
      reason: input.reason,
      resolution: input.resolution,
      status: "requested",
    })
    .select()
    .single();
  if (rErr) throw new ApiError(500, rErr.message);

  const { error: iErr } = await supabaseAdmin
    .from("return_items")
    .insert(returnItems.map((it) => ({ ...it, return_id: ret.id })));
  if (iErr) {
    await supabaseAdmin.from("returns").delete().eq("id", ret.id);
    throw new ApiError(500, iErr.message);
  }

  res.status(201).json({
    ok: true,
    message: "Return request submitted.",
    data: { ...ret, items: returnItems },
  });
}

/** GET /api/returns?phone=+91… — a customer's return requests. */
export async function listReturnsByPhone(req: Request, res: Response) {
  const phone = String(req.query.phone ?? "").trim();
  if (!phone) throw new ApiError(400, "A phone query parameter is required.");

  const { data, error } = await supabaseAdmin
    .from("returns")
    .select("*, items:return_items(*)")
    .eq("phone", phone)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);

  res.json({ ok: true, count: data?.length ?? 0, data: data ?? [] });
}
