import { api } from "./api";

/** One line item as the backend's cart mirror expects it. */
export interface SyncCartItem {
  productHandle: string;
  title: string;
  image?: string;
  size: string;
  quantity: number;
  price: number;
  currency: string;
}

/**
 * Replaces the signed-in customer's stored cart with exactly what they have now.
 *
 * The full cart is sent every time rather than add/remove deltas: a dropped
 * request can't leave a phantom item in the admin, and the next change repairs
 * it. An empty array clears the cart, which is how a removal propagates.
 *
 * Best-effort — the shopper's cart must never break because this call failed.
 */
export async function syncCart(phone: string, items: SyncCartItem[]): Promise<void> {
  try {
    await api.post("/cart/sync", { phone, items });
  } catch {
    /* ignore — the next cart change re-sends the full state */
  }
}
