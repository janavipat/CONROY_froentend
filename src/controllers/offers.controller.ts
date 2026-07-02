import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { resolveCart } from "../lib/pricing.js";
import { computeDiscount, getActiveOffer } from "../lib/offers.js";
import { applyOfferSchema, offerSchema } from "../validators/schemas.js";

/* ─────────────────────────── Public ─────────────────────────────────────── */

/**
 * POST /api/offers/apply — previews the discount for a cart (and optional code)
 * against the active offer. Used by the checkout page before payment.
 */
export async function applyOffer(req: Request, res: Response) {
  const { items, code } = applyOfferSchema.parse(req.body);
  const cart = await resolveCart(items);
  const result = await computeDiscount(cart.lineItems, cart.subtotal, code);
  res.json({ ok: true, subtotal: cart.subtotal, ...result });
}

/**
 * GET /api/offers/active — the current active offer's public details (or null).
 * Powers the storefront announcement bar + promo popup. The coupon code is
 * intentionally exposed here so the promo can advertise it.
 */
export async function getActiveOfferPublic(_req: Request, res: Response) {
  const offer = await getActiveOffer();
  if (!offer) return res.json({ ok: true, active: null });
  res.json({
    ok: true,
    active: {
      id: offer.id,
      title: offer.title,
      type: offer.type,
      discountType: offer.discount_type,
      discountValue: offer.discount_value,
      code: offer.code,
      minOrderAmount: offer.min_order_amount,
      productHandle: offer.product_handle,
    },
  });
}

/* ─────────────────────────── Admin ──────────────────────────────────────── */

function toRow(input: ReturnType<typeof offerSchema.parse>) {
  return {
    title: input.title,
    type: input.type,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    product_handle: input.type === "product" ? input.productHandle ?? null : null,
    min_order_amount: input.type === "order_above" ? input.minOrderAmount ?? null : null,
    code: input.type === "code" ? input.code?.trim() ?? null : null,
    active: input.active,
  };
}

/** Only one offer may be active — deactivate all others when one is turned on. */
async function enforceSingleActive(exceptId?: string): Promise<void> {
  let q = supabaseAdmin.from("offers").update({ active: false }).eq("active", true);
  if (exceptId) q = q.neq("id", exceptId);
  const { error } = await q;
  if (error) throw new ApiError(500, error.message);
}

/** GET /api/admin/offers — all offers, newest first. */
export async function listOffers(_req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);
  res.json({ ok: true, count: data?.length ?? 0, data: data ?? [] });
}

/** POST /api/admin/offers — creates an offer. */
export async function createOffer(req: Request, res: Response) {
  const input = offerSchema.parse(req.body);
  const row = toRow(input);

  const { data, error } = await supabaseAdmin.from("offers").insert(row).select().single();
  if (error) throw new ApiError(500, error.message);
  if (data.active) await enforceSingleActive(data.id as string);

  res.status(201).json({ ok: true, message: "Offer created.", data });
}

/** PUT /api/admin/offers/:id — updates an offer. */
export async function updateOffer(req: Request, res: Response) {
  const { id } = req.params;
  const input = offerSchema.parse(req.body);
  const row = toRow(input);

  const { data, error } = await supabaseAdmin
    .from("offers")
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, `Offer not found: ${id}`);
  if (data.active) await enforceSingleActive(data.id as string);

  res.json({ ok: true, message: "Offer updated.", data });
}

/** PATCH /api/admin/offers/:id/active — toggles active (single-active enforced). */
export async function setOfferActive(req: Request, res: Response) {
  const { id } = req.params;
  const active = Boolean((req.body as { active?: boolean }).active);

  const { data, error } = await supabaseAdmin
    .from("offers")
    .update({ active })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, `Offer not found: ${id}`);
  if (active) await enforceSingleActive(id);

  res.json({ ok: true, message: active ? "Offer activated." : "Offer deactivated.", data });
}

/** DELETE /api/admin/offers/:id */
export async function deleteOffer(req: Request, res: Response) {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("offers").delete().eq("id", id);
  if (error) throw new ApiError(500, error.message);
  res.json({ ok: true, message: "Offer deleted." });
}
