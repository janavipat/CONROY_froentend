import { api } from "./api";
import type { CartItem } from "@/types";

export type OfferType = "all_products" | "product" | "order_above" | "code";
export type DiscountType = "percent" | "flat";

export interface Offer {
  id: string;
  title: string;
  type: OfferType;
  discount_type: DiscountType;
  discount_value: number;
  product_handle: string | null;
  min_order_amount: number | null;
  code: string | null;
  active: boolean;
  created_at: string;
}

export interface ApplyOfferResult {
  ok: boolean;
  subtotal: number;
  discount: number;
  total: number;
  offer: { id: string; title: string; type: OfferType } | null;
  applied: boolean;
  requiresCode: boolean;
  message: string;
  code: string | null;
}

function toApiItems(items: CartItem[]) {
  return items.map((i) => ({ productHandle: i.productHandle, size: i.size, quantity: i.quantity }));
}

/** Previews the active offer against a cart (and optional coupon code). */
export async function applyOffer(items: CartItem[], code?: string): Promise<ApplyOfferResult | null> {
  try {
    const { data } = await api.post<ApplyOfferResult>("/offers/apply", {
      items: toApiItems(items),
      code: code?.trim() || undefined,
    });
    return data;
  } catch {
    return null;
  }
}

export interface ActiveOffer {
  id: string;
  title: string;
  type: OfferType;
  discountType: DiscountType;
  discountValue: number;
  code: string | null;
  minOrderAmount: number | null;
  productHandle: string | null;
}

/** The current active offer (or null) — powers the announcement bar + popup. */
export async function getActiveOffer(): Promise<ActiveOffer | null> {
  try {
    const { data } = await api.get<{ ok: boolean; active: ActiveOffer | null }>("/offers/active");
    return data.active ?? null;
  } catch {
    return null;
  }
}

/** Short discount label, e.g. "20% OFF" or "₹500 OFF". */
export function offerDiscountLabel(o: ActiveOffer): string {
  return o.discountType === "percent" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`;
}

/** One-line headline used in the announcement bar. */
export function offerHeadline(o: ActiveOffer): string {
  const label = offerDiscountLabel(o);
  switch (o.type) {
    case "code":
      return `${label} — use code ${o.code}`;
    case "order_above":
      return `${label} on orders above ₹${o.minOrderAmount}`;
    case "product":
      return `${label} on selected styles`;
    default:
      return `${label} on everything`;
  }
}

/* ─────────────────────────── Admin ──────────────────────────────────────── */

export interface OfferPayload {
  title: string;
  type: OfferType;
  discountType: DiscountType;
  discountValue: number;
  productHandle?: string | null;
  minOrderAmount?: number | null;
  code?: string | null;
  active: boolean;
}

export async function adminListOffers(): Promise<Offer[]> {
  const { data } = await api.get<{ ok: boolean; data: Offer[] }>("/admin/offers");
  return data.data ?? [];
}

export async function adminCreateOffer(payload: OfferPayload) {
  const { data } = await api.post("/admin/offers", payload);
  return data as { ok: boolean; message: string; data: Offer };
}

export async function adminUpdateOffer(id: string, payload: OfferPayload) {
  const { data } = await api.put(`/admin/offers/${id}`, payload);
  return data as { ok: boolean; message: string; data: Offer };
}

export async function adminSetOfferActive(id: string, active: boolean) {
  const { data } = await api.patch(`/admin/offers/${id}/active`, { active });
  return data as { ok: boolean; message: string; data: Offer };
}

export async function adminDeleteOffer(id: string) {
  const { data } = await api.delete(`/admin/offers/${id}`);
  return data as { ok: boolean; message: string };
}
