"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGetOrder, type AdminOrder } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { ChevronLeftIcon } from "@/components/ui/Icons";

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function payment(status: string): { text: string; dot: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", dot: "bg-green-500" };
    case "cod_pending":
      return { text: "Payment pending", dot: "bg-amber-500" };
    case "cancelled":
      return { text: "Cancelled", dot: "bg-rose-500" };
    case "refunded":
      return { text: "Refunded", dot: "bg-stone/50" };
    default:
      return { text: "Processing", dot: "bg-stone/50" };
  }
}

function Badge({ dot, text }: { dot: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-mist px-2 py-0.5 text-xs text-ink-soft">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {text}
    </span>
  );
}

function methodLabel(m: string): string {
  const k = (m || "").toLowerCase();
  if (k.includes("cod") || k.includes("cash")) return "Cash on Delivery";
  if (k.includes("razor")) return "Razorpay";
  if (!m) return "—";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminGetOrder(id)
      .then((o) => active && (setOrder(o), setLoading(false)))
      .catch(() => active && (setError("Could not load this order."), setLoading(false)));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink">
          <ChevronLeftIcon className="h-4 w-4" /> Orders
        </Link>
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  const p = payment(order.status);
  const cancelled = order.status === "cancelled";
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className={cn("font-display text-2xl text-ink", cancelled && "text-stone line-through")}>
          #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <Badge dot={p.dot} text={p.text} />
        {cancelled && <Badge dot="bg-stone/50" text="Voided" />}
        <Badge dot="bg-stone/50" text="Fulfillment not required" />
      </div>
      <p className="mt-1 text-sm text-stone">
        {formatDateTime(order.createdAt)} · Online Store
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: items + payment summary */}
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-media border border-line bg-white p-5">
            <div className="mb-4">
              <Badge dot={cancelled ? "bg-stone/50" : "bg-green-500"} text={cancelled ? "Removed" : "Fulfilled"} />
            </div>
            <ul className="divide-y divide-line">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-line bg-mist text-xs text-stone">
                    {it.title.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                    <p className="text-xs text-stone">
                      Size {it.size} · {it.fit}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm text-ink-soft">
                    {formatCurrency(it.price, order.currency)} × {it.quantity}
                  </div>
                  <div className="w-24 shrink-0 text-right text-sm font-medium text-ink">
                    {formatCurrency(it.price * it.quantity, order.currency)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment summary */}
          <div className="rounded-media border border-line bg-white p-5">
            <div className="mb-4">
              <Badge dot={p.dot} text={p.text} />
            </div>
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-ink-soft">
                  Subtotal <span className="text-stone">· {itemCount} item{itemCount === 1 ? "" : "s"}</span>
                </dt>
                <dd className="text-ink">{formatCurrency(order.subtotal, order.currency)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-ink-soft">
                    Discount {order.offerCode && <span className="text-stone">· {order.offerCode}</span>}
                  </dt>
                  <dd className="text-green-600">− {formatCurrency(order.discount, order.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="text-ink">{methodLabel(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-medium text-ink">{formatCurrency(order.total, order.currency)}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-ink-soft">Paid</dt>
                <dd className="text-ink">
                  {order.status === "paid" ? formatCurrency(order.total, order.currency) : formatCurrency(0, order.currency)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right: notes + customer */}
        <div className="space-y-6">
          <div className="rounded-media border border-line bg-white p-5">
            <h3 className="text-sm font-medium text-ink">Notes</h3>
            <p className="mt-2 text-sm text-stone">No notes from customer</p>
          </div>

          <div className="rounded-media border border-line bg-white p-5">
            <h3 className="text-sm font-medium text-ink">Customer</h3>
            <p className="mt-2 text-sm text-ink">{order.customerName || "Guest"}</p>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone">Contact information</p>
              <a href={`mailto:${order.email}`} className="mt-1.5 block text-sm text-ink hover:underline">
                {order.email}
              </a>
              <p className="text-sm text-ink-soft">{order.phone || "No phone number"}</p>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone">Shipping address</p>
              {order.shippingAddress ? (
                <p className="mt-1.5 whitespace-pre-line text-sm text-ink-soft">{order.shippingAddress}</p>
              ) : (
                <p className="mt-1.5 text-sm text-stone">No shipping address on file</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
