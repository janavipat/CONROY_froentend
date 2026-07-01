"use client";

import { useEffect, useState } from "react";
import type { AdminOrder } from "@/services/admin";
import { adminListOrders } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function statusBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", cls: "bg-green-600 text-white" };
    case "cod_pending":
      return { text: "COD pending", cls: "bg-amber-500 text-white" };
    case "cancelled":
      return { text: "Cancelled", cls: "bg-accent text-white" };
    default:
      return { text: "Processing", cls: "bg-mist text-ink-soft" };
  }
}

export function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminListOrders()
      .then((o) => active && (setOrders(o), setLoading(false)))
      .catch(() => active && (setError("Could not load orders. Is the backend running?"), setLoading(false)));
    return () => {
      active = false;
    };
  }, []);

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.subtotal, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-stone">
            {loading ? "Loading…" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
            {!loading && orders.length > 0 && ` · ${formatCurrency(revenue)} revenue`}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-stone">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((o) => {
              const badge = statusBadge(o.status);
              return (
                <li key={o.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Order + customer */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        {o.customerName || o.email}
                      </p>
                      <p className="text-xs text-stone">
                        {o.email}
                        {o.phone ? ` · ${o.phone}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-stone">{formatDate(o.createdAt)}</p>
                    </div>

                    {/* Payment + status + total */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-display text-lg text-ink">
                        {formatCurrency(o.subtotal, o.currency)}
                      </span>
                      <span className="text-xs text-stone">{o.paymentMethod}</span>
                      <span
                        className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", badge.cls)}
                      >
                        {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="mt-3 space-y-1 border-t border-line pt-3">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm text-ink-soft">
                        <span className="truncate">
                          {it.title}
                          <span className="text-stone">
                            {" "}
                            · {it.fit} · Size {it.size} × {it.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 text-ink">
                          {formatCurrency(it.price * it.quantity, o.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
