import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { createOrderSchema } from "../validators/schemas.js";
import { resolveCart, persistOrder } from "../lib/pricing.js";

/**
 * POST /api/orders — creates an order; prices are resolved server-side.
 * Online payments now flow through /api/payments/razorpay (create → verify),
 * so this endpoint is primarily for Cash on Delivery. An "online" order that
 * reaches here (e.g. demo mode with no Razorpay keys) is recorded as paid.
 */
export async function createOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body);

  const cart = await resolveCart(input.items);

  const order = await persistOrder({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    shippingAddress: input.shippingAddress,
    // COD orders await collection on delivery; online orders are paid.
    status: input.paymentMethod === "cod" ? "cod_pending" : "paid",
    cart,
  });

  res.status(201).json({
    ok: true,
    message: "Order placed successfully.",
    data: order,
  });
}

/** GET /api/orders?phone=+91… — a signed-in user's order history. */
export async function listOrdersByPhone(req: Request, res: Response) {
  const phone = String(req.query.phone ?? "").trim();
  if (!phone) throw new ApiError(400, "A phone query parameter is required.");

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("phone", phone)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);

  res.json({ ok: true, count: data?.length ?? 0, data: data ?? [] });
}

/** GET /api/orders/:id */
export async function getOrder(req: Request, res: Response) {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, `Order not found: ${id}`);

  res.json({ ok: true, data });
}
