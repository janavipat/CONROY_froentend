import { api } from "./api";
import type { CartItem } from "@/types";

export interface CreateOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
}

/**
 * Places an order via the backend API. The server resolves authoritative prices
 * from Supabase, so we only send handle/size/quantity. Falls back to a local
 * confirmation when the backend is unavailable (demo mode).
 */
export async function createOrder(
  email: string,
  items: CartItem[],
): Promise<CreateOrderResult> {
  const payload = {
    email,
    items: items.map((i) => ({
      productHandle: i.productHandle,
      size: i.size,
      quantity: i.quantity,
    })),
  };

  try {
    const { data } = await api.post<{ ok: boolean; message: string; data?: { id: string } }>(
      "/orders",
      payload,
    );
    return { ok: data.ok, message: data.message, orderId: data.data?.id };
  } catch {
    // Backend offline — acknowledge locally so the demo checkout still completes.
    return {
      ok: true,
      message: "Order placed (demo mode — backend not connected).",
    };
  }
}
