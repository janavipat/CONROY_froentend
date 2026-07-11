import { api } from "./api";
import type { CartItem } from "@/types";

export type PaymentMethod = "online" | "cod";

export interface CreateOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
}

export interface OrderItem {
  product_handle: string;
  title: string;
  size: string;
  fit: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  email: string;
  phone: string | null;
  full_name?: string | null;
  shipping_address?: string | null;
  subtotal: number;
  discount?: number;
  currency: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderInput {
  email: string;
  items: CartItem[];
  paymentMethod?: PaymentMethod;
  phone?: string | null;
  fullName?: string;
  shippingAddress?: string;
  code?: string;
}

/**
 * Places an order via the backend API. The server resolves authoritative prices
 * from Supabase, so we only send handle/size/quantity plus the delivery details.
 */
export async function createOrder(input: OrderInput): Promise<CreateOrderResult> {
  const payload = {
    email: input.email,
    paymentMethod: input.paymentMethod ?? "online",
    phone: input.phone ?? undefined,
    fullName: input.fullName?.trim() || undefined,
    shippingAddress: input.shippingAddress?.trim() || undefined,
    code: input.code?.trim() || undefined,
    items: input.items.map((i) => ({
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
    return { ok: true, message: "Order placed (demo mode — backend not connected)." };
  }
}

/** Fetches the signed-in user's order history (by phone). */
export async function fetchMyOrders(phone: string): Promise<Order[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: Order[] }>("/orders", {
      params: { phone },
    });
    return data.data ?? [];
  } catch {
    return [];
  }
}
