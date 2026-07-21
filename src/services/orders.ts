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

/** Delivery lifecycle. Separate from `status`, which holds the payment state. */
export type FulfillmentStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled";

export type RefundStatus = "None" | "Initiated" | "Processing" | "Completed" | "Failed";

export interface Order {
  id: string;
  email: string;
  phone: string | null;
  full_name?: string | null;
  shipping_address?: string | null;
  subtotal: number;
  discount?: number;
  currency: string;
  /** Payment state: "paid" | "cod_pending" | "cancelled". */
  status: string;
  /** Delivery lifecycle; older rows predate the column, so default to Pending. */
  fulfillment_status?: FulfillmentStatus | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  refund_status?: RefundStatus | null;
  created_at: string;
  items: OrderItem[];
}

/** Only these early states may still be cancelled by the customer. */
const CANCELLABLE = new Set<FulfillmentStatus>(["Pending", "Confirmed", "Processing"]);

/** Lifecycle state of an order, tolerating rows written before the column existed. */
export function fulfillmentOf(order: Order): FulfillmentStatus {
  if (order.fulfillment_status) return order.fulfillment_status;
  return order.status === "cancelled" ? "Cancelled" : "Pending";
}

/** True when the customer may still cancel this order. */
export function canCancel(order: Order): boolean {
  return CANCELLABLE.has(fulfillmentOf(order));
}

/** Customer-facing label + dot colour for a delivery status. */
export function fulfillmentBadge(status: FulfillmentStatus): { text: string; dot: string } {
  switch (status) {
    case "Pending":
      return { text: "Pending", dot: "bg-stone/50" };
    case "Confirmed":
      return { text: "Confirmed", dot: "bg-blue-500" };
    case "Processing":
      return { text: "Processing", dot: "bg-blue-500" };
    case "Packed":
      return { text: "Packed", dot: "bg-amber-500" };
    case "Shipped":
      return { text: "Shipped", dot: "bg-amber-500" };
    case "Out For Delivery":
      return { text: "Out for delivery", dot: "bg-amber-500" };
    case "Delivered":
      return { text: "Delivered", dot: "bg-green-500" };
    case "Cancelled":
      return { text: "Cancelled", dot: "bg-accent" };
    default:
      return { text: status, dot: "bg-stone/50" };
  }
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

export interface CancelOrderInput {
  orderId: string;
  reason: string;
  customReason?: string;
  /** Identifies the requester — the same model the history endpoint uses. */
  phone: string;
}

export interface CancelOrderResult {
  ok: boolean;
  message: string;
  order?: Order;
}

/** Cancels an eligible order. Surfaces the server's reason when it refuses. */
export async function cancelOrder(input: CancelOrderInput): Promise<CancelOrderResult> {
  try {
    const { data } = await api.patch<{ success: boolean; message: string; order: Order }>(
      `/orders/${input.orderId}/cancel`,
      {
        reason: input.reason,
        customReason: input.customReason?.trim() || "",
        phone: input.phone,
      },
    );
    return { ok: data.success, message: data.message, order: data.order };
  } catch (err) {
    const message =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      "Unable to cancel your order. Please try again.";
    return { ok: false, message };
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
