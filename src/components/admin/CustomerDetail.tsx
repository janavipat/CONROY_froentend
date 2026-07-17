"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminListCustomers,
  adminListOrders,
  adminListReturns,
  type AdminCustomer,
  type AdminOrder,
  type AdminReturn,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { ChevronLeftIcon } from "@/components/ui/Icons";
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

function orderBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", cls: "bg-emerald-100 text-emerald-700" };
    case "cod_pending":
      return { text: "COD · unpaid", cls: "bg-amber-100 text-amber-700" };
    case "cancelled":
      return { text: "Cancelled", cls: "bg-rose-100 text-rose-700" };
    case "refunded":
      return { text: "Refunded", cls: "bg-violet-100 text-violet-700" };
    default:
      return { text: status, cls: "bg-stone-100 text-stone-600" };
  }
}

export function CustomerDetail({ phone }: { phone: string }) {
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const [custs, allOrders, allReturns] = await Promise.all([
          adminListCustomers(),
          adminListOrders(),
          adminListReturns(),
        ]);
        if (!active) return;
        setCustomer(custs.find((c) => c.phone === phone) ?? null);
        setOrders(allOrders.filter((o) => o.phone === phone));
        setReturns(allReturns.filter((r) => r.phone === phone));
      } catch {
        if (active) setError("Could not load this customer. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [phone]);

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.total ?? o.subtotal - (o.discount ?? 0)), 0);
  const name = customer?.email || orders[0]?.customerName || null;
  const email = customer?.email || orders[0]?.email || "";

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Back to customers
      </Link>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {/* Header */}
          <div className="rounded-media border border-line bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-lg font-medium text-white">
                {(name || phone).trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-2xl text-ink">{phone}</h1>
                <p className="truncate text-sm text-stone">{email || "No email on file"}</p>
                {customer && (
                  <p className="text-xs text-stone">Joined {formatDate(customer.joinedAt)}</p>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { l: "Orders", v: String(orders.length) },
                { l: "Total spent", v: formatCurrency(totalSpent) },
                { l: "Returns", v: String(returns.length) },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-line px-3 py-2.5 text-center">
                  <p className="font-display text-xl text-ink">{s.v}</p>
                  <p className="text-xs text-stone">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orders */}
          <section className="overflow-hidden rounded-media border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Orders</h2>
            </div>
            {orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-stone">No orders from this customer.</p>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((o) => {
                  const b = orderBadge(o.status);
                  const total = o.total ?? o.subtotal - (o.discount ?? 0);
                  const itemCount = o.items.reduce((s, it) => s + it.quantity, 0);
                  return (
                    <li key={o.id}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-mist"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-stone">
                            {formatDate(o.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                            {o.paymentMethod === "cod" ? "COD" : "Online"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                              b.cls,
                            )}
                          >
                            {b.text}
                          </span>
                          <span className="text-sm font-medium text-ink">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Returns */}
          {returns.length > 0 && (
            <section className="overflow-hidden rounded-media border border-line bg-white">
              <div className="border-b border-line px-5 py-4">
                <h2 className="font-display text-lg text-ink">Returns</h2>
              </div>
              <ul className="divide-y divide-line">
                {returns.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">#{r.orderRef}</p>
                      <p className="truncate text-xs text-stone">
                        {r.resolution} · {r.reason} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-mist px-2 py-0.5 text-xs capitalize text-ink-soft">
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
