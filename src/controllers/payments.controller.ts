import type { Request, Response } from "express";
import { ApiError } from "../middleware/errors.js";
import { resolveCart, persistOrder } from "../lib/pricing.js";
import {
  razorpayConfigured,
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../lib/razorpay.js";
import { env } from "../config/env.js";
import { razorpayOrderSchema, razorpayVerifySchema } from "../validators/schemas.js";

/**
 * POST /api/payments/razorpay/order
 * Creates a Razorpay order for the current cart. The payable amount is resolved
 * server-side from the DB so the client can never influence what is charged.
 * Returns the public key id + Razorpay order id for the Checkout widget.
 *
 * When Razorpay keys aren't configured, responds with { mock: true } so the
 * frontend can fall back to the free demo checkout.
 */
export async function createPaymentOrder(req: Request, res: Response) {
  const { items } = razorpayOrderSchema.parse(req.body);
  const cart = await resolveCart(items);

  if (cart.subtotal <= 0) throw new ApiError(400, "Order total must be greater than zero.");

  if (!razorpayConfigured) {
    return res.json({
      ok: true,
      mock: true,
      amount: cart.subtotal * 100,
      currency: cart.currency,
      message: "Razorpay not configured — demo checkout.",
    });
  }

  const receipt = `conroy_${Date.now()}`;
  const order = await createRazorpayOrder(cart.subtotal, cart.currency, receipt);

  res.json({
    ok: true,
    mock: false,
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  });
}

/**
 * POST /api/payments/razorpay/verify
 * Verifies the Razorpay signature and, only if valid, persists the order as
 * paid. Prices are re-resolved server-side here too — the order that gets
 * written never trusts client-sent amounts.
 */
export async function verifyPayment(req: Request, res: Response) {
  const input = razorpayVerifySchema.parse(req.body);

  if (!razorpayConfigured) {
    throw new ApiError(400, "Razorpay is not configured on the server.");
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySignature: input.razorpaySignature,
  });
  if (!valid) throw new ApiError(400, "Payment verification failed. Signature mismatch.");

  const cart = await resolveCart(input.items);

  const order = await persistOrder({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    shippingAddress: input.shippingAddress,
    status: "paid",
    cart,
    payment: {
      provider: "razorpay",
      razorpay_order_id: input.razorpayOrderId,
      razorpay_payment_id: input.razorpayPaymentId,
    },
  });

  res.status(201).json({
    ok: true,
    message: "Payment verified and order placed.",
    data: order,
  });
}
