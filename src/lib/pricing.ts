import { supabaseAdmin } from "./supabase.js";
import { ApiError } from "../middleware/errors.js";

export interface OrderLineItem {
  product_handle: string;
  title: string;
  size: string;
  fit: string;
  price: number;
  quantity: number;
}

export interface ResolvedCart {
  lineItems: OrderLineItem[];
  subtotal: number;
  currency: string;
}

interface CartInput {
  productHandle: string;
  size: string;
  quantity: number;
}

/**
 * Resolves cart items against authoritative product data in Supabase and
 * computes the subtotal. Prices, titles and fit are ALWAYS taken from the DB —
 * the client only supplies handle/size/quantity so it can never tamper with
 * what is charged.
 */
export async function resolveCart(items: CartInput[]): Promise<ResolvedCart> {
  const handles = [...new Set(items.map((i) => i.productHandle))];
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("handle, title, fit, price, currency, sizes")
    .in("handle", handles);
  if (error) throw new ApiError(500, error.message);

  const byHandle = new Map((products ?? []).map((p) => [p.handle as string, p]));

  const lineItems: OrderLineItem[] = items.map((item) => {
    const product = byHandle.get(item.productHandle);
    if (!product) throw new ApiError(400, `Unknown product: ${item.productHandle}`);
    if (!(product.sizes as string[]).includes(item.size)) {
      throw new ApiError(400, `Size ${item.size} is unavailable for ${product.title}`);
    }
    return {
      product_handle: item.productHandle,
      title: product.title as string,
      size: item.size,
      fit: product.fit as string,
      price: product.price as number,
      quantity: item.quantity,
    };
  });

  const currency = (products?.[0]?.currency as string) ?? "INR";
  const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);

  return { lineItems, subtotal, currency };
}

/**
 * Persists an order header + line items. Used by both COD checkout and the
 * post-payment Razorpay verification path. Rolls back the header if the item
 * insert fails.
 *
 * Payment references (Razorpay order/payment id) are stored best-effort in a
 * separate update so the core insert never depends on the payment columns
 * existing — the flow keeps working even before payments.sql has been run.
 */
export async function persistOrder(params: {
  email: string;
  fullName?: string | null;
  phone?: string | null;
  shippingAddress?: string | null;
  status: string;
  cart: ResolvedCart;
  payment?: {
    provider: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
  } | null;
}) {
  const { cart } = params;

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .insert({
      email: params.email,
      full_name: params.fullName ?? null,
      phone: params.phone ?? null,
      shipping_address: params.shippingAddress ?? null,
      subtotal: cart.subtotal,
      currency: cart.currency,
      status: params.status,
    })
    .select()
    .single();
  if (oErr) throw new ApiError(500, oErr.message);

  const { error: iErr } = await supabaseAdmin
    .from("order_items")
    .insert(cart.lineItems.map((li) => ({ ...li, order_id: order.id })));
  if (iErr) {
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    throw new ApiError(500, iErr.message);
  }

  // Best-effort: store the payment reference. Silently ignored if the payment
  // columns don't exist yet (user hasn't run payments.sql).
  if (params.payment) {
    const { error: payErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_provider: params.payment.provider,
        razorpay_order_id: params.payment.razorpay_order_id ?? null,
        razorpay_payment_id: params.payment.razorpay_payment_id ?? null,
      })
      .eq("id", order.id);
    if (payErr) {
      console.warn("Payment reference not stored (run payments.sql):", payErr.message);
    }
  }

  return { ...order, items: cart.lineItems };
}
