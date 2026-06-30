import type { PaymentMethod } from "@/services/orders";

export interface PaymentResult {
  ok: boolean;
  message?: string;
}

/** True when a real Razorpay key is configured. */
export const isRazorpayConfigured = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

/**
 * Processes a payment for the given method.
 *
 * - "cod"    → no gateway, always succeeds.
 * - "online" → opens Razorpay when configured; otherwise simulates a successful
 *              payment so the flow works free, in demo mode, without any keys.
 *
 * To go live with Razorpay: set NEXT_PUBLIC_RAZORPAY_KEY_ID, create the order on
 * the backend (Razorpay Orders API) to get an order_id, then replace the mock
 * branch below with the Razorpay Checkout handler and verify the signature
 * server-side.
 */
export async function processPayment(
  method: PaymentMethod,
  amountInInr: number,
): Promise<PaymentResult> {
  if (amountInInr <= 0) {
    return { ok: false, message: "Invalid order amount." };
  }

  if (method === "cod") {
    return { ok: true, message: "Cash on delivery selected." };
  }

  // Online — demo/mock until Razorpay keys + backend order verification are added.
  if (!isRazorpayConfigured) {
    await new Promise((r) => setTimeout(r, 1400)); // simulate gateway round-trip
    return { ok: true, message: "Payment successful (demo mode)." };
  }

  // Razorpay integration point (requires a server-created order_id + verification).
  await new Promise((r) => setTimeout(r, 1400));
  return { ok: true, message: "Payment successful." };
}
