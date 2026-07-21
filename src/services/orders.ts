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

/**
 * Customer-facing label + pill classes for a delivery status. Soft tints keep
 * the badge scannable without shouting — a coloured dot on white read as flat.
 */
export function fulfillmentBadge(status: FulfillmentStatus): { text: string; cls: string } {
  switch (status) {
    case "Pending":
      return { text: "Pending", cls: "bg-[#FFF8E8] text-[#C97A00]" };
    case "Confirmed":
      return { text: "Confirmed", cls: "bg-[#EFF6FF] text-[#2563EB]" };
    case "Processing":
      return { text: "Processing", cls: "bg-[#EEF2FF] text-[#4F46E5]" };
    case "Packed":
      return { text: "Packed", cls: "bg-[#F3F4F6] text-[#4B5563]" };
    case "Shipped":
      return { text: "Shipped", cls: "bg-[#F3F4F6] text-[#4B5563]" };
    case "Out For Delivery":
      return { text: "Out for delivery", cls: "bg-[#FFF7ED] text-[#C2410C]" };
    case "Delivered":
      return { text: "Delivered", cls: "bg-[#ECFDF5] text-[#15803D]" };
    case "Cancelled":
      return { text: "Cancelled", cls: "bg-[#FEF2F2] text-[#DC2626]" };
    default:
      return { text: status, cls: "bg-[#F3F4F6] text-[#4B5563]" };
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
