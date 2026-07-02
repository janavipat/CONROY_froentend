import { api } from "./api";
import type { CartItem } from "@/types";

export interface RazorpayOrderResponse {
  ok: boolean;
  mock: boolean;
  keyId?: string;
  orderId?: string;
  amount?: number; // paise
  currency?: string;
  message?: string;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
  orderId?: string;
}

function toApiItems(items: CartItem[]) {
  return items.map((i) => ({
    productHandle: i.productHandle,
    size: i.size,
    quantity: i.quantity,
  }));
}

/**
 * Asks the backend to create a Razorpay order. The amount is computed
 * server-side, so we only send the cart contents. Returns { mock: true } when
 * the backend has no Razorpay keys (demo mode).
 */
export async function createRazorpayOrder(
  items: CartItem[],
  code?: string,
): Promise<RazorpayOrderResponse> {
  const { data } = await api.post<RazorpayOrderResponse>("/payments/razorpay/order", {
    items: toApiItems(items),
    code: code?.trim() || undefined,
  });
  return data;
}

/** Verifies the Razorpay payment and places the order (server writes it as paid). */
export async function verifyRazorpayPayment(payload: {
  email: string;
  items: CartItem[];
  phone?: string | null;
  code?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<VerifyResult> {
  const { data } = await api.post<{ ok: boolean; message: string; data?: { id: string } }>(
    "/payments/razorpay/verify",
    {
      email: payload.email,
      phone: payload.phone ?? undefined,
      code: payload.code?.trim() || undefined,
      items: toApiItems(payload.items),
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
      razorpaySignature: payload.razorpaySignature,
    },
  );
  return { ok: data.ok, message: data.message, orderId: data.data?.id };
}

/* ─────────────────────────── Checkout widget ──────────────────────────────── */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayCheckout;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

/** Loads the Razorpay Checkout script once and resolves when it's ready. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CheckoutSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Opens the Razorpay Checkout modal and resolves with the payment response on
 * success, or null if the shopper dismisses it.
 */
export function openRazorpayCheckout(params: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { email?: string; contact?: string };
}): Promise<CheckoutSuccess | null> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay Checkout is not available."));
      return;
    }

    const rzp = new window.Razorpay({
      key: params.keyId,
      order_id: params.orderId,
      amount: params.amount,
      currency: params.currency,
      name: params.name,
      description: params.description,
      prefill: params.prefill ?? {},
      theme: { color: "#1d1d1d" },
      handler: (response: unknown) => {
        const r = response as CheckoutSuccess;
        resolve({
          razorpay_order_id: r.razorpay_order_id,
          razorpay_payment_id: r.razorpay_payment_id,
          razorpay_signature: r.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => resolve(null),
      },
    });

    rzp.on("payment.failed", (response: unknown) => {
      const err = response as { error?: { description?: string } };
      reject(new Error(err.error?.description ?? "Payment failed. Please try again."));
    });

    rzp.open();
  });
}
