import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errors.js";

/** True once both Razorpay keys are present — otherwise checkout runs in demo mode. */
export const razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const RAZORPAY_API = "https://api.razorpay.com/v1";

export interface RazorpayOrder {
  id: string;
  amount: number; // in the smallest currency unit (paise)
  currency: string;
  status: string;
  receipt?: string;
}

/**
 * Creates a Razorpay order via the REST API. The amount is authoritative — it
 * is computed server-side from the DB, never taken from the client.
 *
 * @param amountInInr whole-rupee amount (converted to paise here)
 * @param currency    ISO currency (INR)
 * @param receipt     our internal reference (shown in the Razorpay dashboard)
 */
export async function createRazorpayOrder(
  amountInInr: number,
  currency: string,
  receipt: string,
): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInInr * 100), // rupees → paise
      currency,
      receipt,
      payment_capture: 1, // auto-capture on success
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(502, `Razorpay order creation failed: ${res.status} ${detail}`.trim());
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verifies the payment signature returned by Razorpay Checkout. The signature is
 * an HMAC-SHA256 of `${order_id}|${payment_id}` keyed with the secret. Uses a
 * constant-time comparison to avoid timing leaks.
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(params.razorpaySignature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
