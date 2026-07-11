"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/services/orders";
import { fetchMyOrders } from "@/services/orders";
import { fetchMyReturns, returnStatusBadge, type ReturnRecord } from "@/services/returns";
import { ReturnDialog } from "@/components/account/ReturnDialog";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { BagIcon, ReturnIcon, TruckIcon, ShieldIcon } from "@/components/ui/Icons";
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

function statusLabel(status: string): { text: string; dot: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", dot: "bg-green-500" };
    case "cod_pending":
      return { text: "Cash on delivery", dot: "bg-amber-500" };
    case "cancelled":
      return { text: "Cancelled", dot: "bg-accent" };
    default:
      return { text: "Processing", dot: "bg-stone/50" };
  }
}

// Orders eligible for a return request (delivered/paid — not cancelled).
const RETURNABLE = new Set(["paid", "cod_pending"]);

export function MyOrders({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnFor, setReturnFor] = useState<Order | null>(null);

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
          To return or replace an item, use the{" "}
          <span className="font-medium text-ink-soft">Return or replace</span> button on the order below.
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
            const badge = statusLabel(order.status);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const discount = order.discount ?? 0;
            const total = order.subtotal - discount;
            const ret = returnByOrder.get(order.id);
            const isCod = order.status === "cod_pending";

            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-media border border-line bg-white shadow-sm"
              >
                {/* Header strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist/40 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
                    <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                    {badge.text}
                  </span>
                </div>

                {/* Items */}
                <ul className="divide-y divide-line px-5">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 py-3.5">
                      <span className="grid h-14 w-12 shrink-0 place-items-center rounded-md bg-mist text-stone">
                        <BagIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product_handle}`}
                          className="block truncate text-sm font-medium text-ink hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-stone">
                          {item.fit} · Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-ink">
                        {formatCurrency(item.price * item.quantity, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Meta: delivery + payment */}
                <div className="grid gap-3 border-t border-line px-5 py-3 text-xs text-ink-soft sm:grid-cols-2">
                  <span className="flex items-start gap-2">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                    {isCod ? "Cash on delivery" : "Paid online"}
                  </span>
                  {order.shipping_address && (
                    <span className="flex items-start gap-2">
                      <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                      <span className="line-clamp-2">{order.shipping_address}</span>
                    </span>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-line px-5 py-3">
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-stone">
                      <span>Discount</span>
                      <span className="text-green-700">− {formatCurrency(discount, order.currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone">Total</span>
                    <span className="font-display text-lg text-ink">
                      {formatCurrency(total, order.currency)}
                    </span>
                  </div>
                </div>

                {/* Return / replacement */}
                <div className="border-t border-line px-5 py-3">
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
                  ) : RETURNABLE.has(order.status) ? (
                    <button
                      onClick={() => setReturnFor(order)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink"
                    >
                      <ReturnIcon className="h-4 w-4" /> Return or replace
                    </button>
                  ) : (
                    <span className="text-xs text-stone">No actions available.</span>
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
    </section>
  );
}
