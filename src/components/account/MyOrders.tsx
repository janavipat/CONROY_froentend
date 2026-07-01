"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Order } from "@/services/orders";
import { fetchMyOrders } from "@/services/orders";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { BagIcon } from "@/components/ui/Icons";
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

function statusLabel(status: string): { text: string; cls: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", cls: "bg-green-600 text-white" };
    case "cod_pending":
      return { text: "Cash on delivery", cls: "bg-amber-500 text-white" };
    case "cancelled":
      return { text: "Cancelled", cls: "bg-accent text-white" };
    default:
      return { text: "Processing", cls: "bg-mist text-ink-soft" };
  }
}

export function MyOrders({ phone }: { phone: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMyOrders(phone).then((o) => {
      if (!active) return;
      setOrders(o);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [phone]);

  return (
    <section id="orders" className="scroll-mt-24">
      <h2 className="font-display text-xl text-ink">My orders</h2>

      {loading ? (
        <div className="mt-4 grid place-items-center rounded-media border border-line bg-white py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-media border border-line bg-white py-12 text-center">
          <BagIcon className="h-9 w-9 text-stone" />
          <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
          <Button href="/collections/all" variant="outline" size="sm">
            Start shopping
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => {
            const badge = statusLabel(order.status);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <li key={order.id} className="rounded-media border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <p className="text-sm text-ink">
                      Order{" "}
                      <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-stone">
                      {formatDate(order.created_at)} · {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", badge.cls)}>
                      {badge.text}
                    </span>
                    <span className="font-display text-lg text-ink">
                      {formatCurrency(order.subtotal, order.currency)}
                    </span>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/products/${item.product_handle}`}
                        className="truncate text-ink-soft hover:text-ink"
                      >
                        {item.title}
                        <span className="text-stone">
                          {" "}
                          · {item.fit} · Size {item.size} × {item.quantity}
                        </span>
                      </Link>
                      <span className="shrink-0 text-ink">
                        {formatCurrency(item.price * item.quantity, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
