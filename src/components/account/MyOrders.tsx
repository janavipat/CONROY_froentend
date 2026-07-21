"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/services/orders";
import { canCancel, fetchMyOrders, fulfillmentBadge, fulfillmentOf } from "@/services/orders";
import { fetchMyReturns, returnStatusBadge, type ReturnRecord } from "@/services/returns";
import { ReturnDialog } from "@/components/account/ReturnDialog";
import { CancelOrderDialog } from "@/components/account/CancelOrderDialog";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { BagIcon, ReturnIcon, TruckIcon, ShieldIcon, CloseIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Outline actions — 44px tall, 12px radius, no filled/heavy colour. */
const ACTION_BASE =
  "inline-flex h-11 items-center gap-2 rounded-[12px] border px-5 text-sm font-medium transition-colors";
const PRIMARY_ACTION = `${ACTION_BASE} border-ink/25 text-ink hover:border-ink hover:bg-ink/[0.04]`;
const DANGER_ACTION = `${ACTION_BASE} border-[#F0C9C9] text-[#C23B3B] hover:border-[#DC2626]/40 hover:bg-[#FEF2F2]`;

export function MyOrders({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnFor, setReturnFor] = useState<Order | null>(null);
  const [cancelFor, setCancelFor] = useState<Order | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [o, r] = await Promise.all([fetchMyOrders(phone), fetchMyReturns(phone)]);
    setOrders(o);
    setReturns(r);
    setLoading(false);
  }, [phone]);

  useEffect(() => {
    let active = true;
    async function run() {
      const [o, r] = await Promise.all([fetchMyOrders(phone), fetchMyReturns(phone)]);
      if (!active) return;
      setOrders(o);
      setReturns(r);
      setLoading(false);
    }
    void run();
    return () => {
      active = false;
    };
  }, [phone]);

  // Latest return per order (most recent request wins for the badge).
  const returnByOrder = new Map<string, ReturnRecord>();
  for (const r of returns) {
    if (!returnByOrder.has(r.order_id)) returnByOrder.set(r.order_id, r);
  }

  return (
    <section id="orders" className="scroll-mt-24">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl text-ink">My orders</h2>
        {!loading && orders.length > 0 && (
          <span className="text-xs text-stone">
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {!loading && orders.length > 0 && (
        <p className="mt-1 text-xs text-stone">
          Cancel an order while it&apos;s still being prepared, or request a{" "}
          <span className="font-medium text-ink-soft">return or replacement</span> once it&apos;s
          delivered.
        </p>
      )}

      {loading ? (
        <div className="mt-4 grid place-items-center rounded-media border border-line bg-white py-14">
          <Loader label="Loading orders" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-media border border-line bg-white py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-mist">
            <BagIcon className="h-7 w-7 text-stone" />
          </span>
          <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
          <Button href="/collections/all" variant="outline" size="sm">
            Start shopping
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-5">
          {orders.map((order) => {
            const fulfillment = fulfillmentOf(order);
            const badge = fulfillmentBadge(fulfillment);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const discount = order.discount ?? 0;
            const total = order.subtotal - discount;
            const ret = returnByOrder.get(order.id);
            const isCancelled = fulfillment === "Cancelled";
            // Cancelling overwrites `status` with "cancelled", so the payment
            // method is recovered from the refund state — COD never refunds.
            const isCod = isCancelled
              ? (order.refund_status ?? "None") === "None"
              : order.status === "cod_pending";

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-media border border-line bg-white shadow-sm"
              >
                {/* Header strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECEC] bg-[#FAFAFA] px-6 py-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                    <span>
                      <span className="text-stone">Order </span>
                      <span className="font-medium text-ink">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </span>
                    <span className="text-stone">{formatDate(order.created_at)}</span>
                    <span className="text-stone">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                      badge.cls,
                    )}
                  >
                    {badge.text}
                  </span>
                </div>

                {/* Items */}
                <ul className="px-6 py-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-5 py-4">
                      <span className="grid h-20 w-16 shrink-0 place-items-center rounded-[12px] bg-[#F8F8F8] text-stone">
                        <BagIcon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product_handle}`}
                          className="block truncate text-[18px] font-semibold leading-snug text-ink hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-stone">
                          {item.fit} · Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 text-[22px] font-bold text-ink">
                        {formatCurrency(item.price * item.quantity, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Meta: delivery + payment */}
                <div className="grid gap-4 border-t border-[#ECECEC] bg-[#FAFAFA] px-6 py-4 text-sm text-ink-soft sm:grid-cols-2 sm:gap-10">
                  <span className="flex items-start gap-2.5">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                    {isCod ? "Cash on delivery" : "Paid online"}
                  </span>
                  {order.shipping_address && (
                    <span className="flex items-start gap-2.5">
                      <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                      <span className="line-clamp-2">{order.shipping_address}</span>
                    </span>
                  )}
                </div>

                {/* Totals */}
                <div className="px-6 py-6">
                  {discount > 0 && (
                    <div className="mb-2 flex justify-between text-sm text-stone">
                      <span>Discount</span>
                      <span className="text-[#15803D]">
                        − {formatCurrency(discount, order.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-ink-soft">Total</span>
                    <span className="text-[30px] font-bold leading-none text-ink">
                      {formatCurrency(total, order.currency)}
                    </span>
                  </div>
                </div>

                {/* Cancellation summary — shown once an order is cancelled */}
                {isCancelled && (
                  <div className="border-t border-[#F9D6D6] bg-[#FFF8F8] px-6 py-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-3 sm:gap-6">
                      {order.cancelled_at && (
                        <div className="flex items-start gap-2.5">
                          <CloseIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]/70" />
                          <div>
                            <dt className="text-xs text-stone">Cancelled on</dt>
                            <dd className="mt-0.5 font-medium text-ink">
                              {formatDate(order.cancelled_at)}
                            </dd>
                          </div>
                        </div>
                      )}
                      {order.cancel_reason && (
                        <div className="flex items-start gap-2.5">
                          <ReturnIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]/70" />
                          <div className="min-w-0">
                            <dt className="text-xs text-stone">Reason</dt>
                            <dd className="mt-0.5 font-medium text-ink">{order.cancel_reason}</dd>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2.5">
                        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]/70" />
                        <div>
                          <dt className="text-xs text-stone">Payment status</dt>
                          <dd className="mt-0.5 font-medium text-ink">
                            {isCod
                              ? "No payment collected"
                              : `Refund ${(order.refund_status ?? "Initiated").toLowerCase()}`}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Actions — one per lifecycle state */}
                <div className="border-t border-[#ECECEC] px-6 py-4">
                  {ret ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn("rounded-full px-2.5 py-1 font-medium", returnStatusBadge(ret.status).cls)}>
                        {returnStatusBadge(ret.status).text}
                      </span>
                      <span className="text-stone">
                        {ret.resolution === "replacement" ? "Replacement" : "Refund"} ·{" "}
                        {ret.items.reduce((s, i) => s + i.quantity, 0)} item(s) · {ret.reason}
                      </span>
                    </div>
                  ) : canCancel(order) ? (
                    <button onClick={() => setCancelFor(order)} className={DANGER_ACTION}>
                      <CloseIcon className="h-4 w-4" /> Cancel order
                    </button>
                  ) : fulfillment === "Delivered" ? (
                    <button onClick={() => setReturnFor(order)} className={PRIMARY_ACTION}>
                      <ReturnIcon className="h-4 w-4" /> Return or replace
                    </button>
                  ) : fulfillment === "Shipped" || fulfillment === "Out For Delivery" ? (
                    // No tracking page or carrier tracking number exists yet, so
                    // this routes to support rather than a dead URL.
                    <Link href="/contact" className={PRIMARY_ACTION}>
                      <TruckIcon className="h-4 w-4" /> Track order
                    </Link>
                  ) : isCancelled ? (
                    <Link href="/collections/all" className={PRIMARY_ACTION}>
                      <BagIcon className="h-4 w-4" /> Buy again
                    </Link>
                  ) : (
                    <span className="text-sm text-stone">No actions available.</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {returnFor && (
        <ReturnDialog
          order={returnFor}
          open={Boolean(returnFor)}
          onClose={() => setReturnFor(null)}
          onSubmitted={load}
        />
      )}

      {cancelFor && (
        <CancelOrderDialog
          order={cancelFor}
          phone={phone}
          open={Boolean(cancelFor)}
          onClose={() => setCancelFor(null)}
          onCancelled={(message) => {
            toast(message, "success");
            void load();
          }}
        />
      )}
    </section>
  );
}
