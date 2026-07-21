"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminOrder } from "@/services/admin";
import { adminListOrders } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { printPackingSlips } from "@/lib/packing-slip";
import { cn } from "@/utils/cn";
import { SearchIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { Loader } from "@/components/ui/Loader";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Maps an order status to a Shopify-style subtle pill + colored dot. */
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

function methodLabel(m: string): string {
  const k = (m || "").toLowerCase();
  if (k.includes("cod") || k.includes("cash")) return "Cash on Delivery";
  if (k.includes("razor")) return "Razorpay";
  if (!m) return "—";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

const itemCount = (o: AdminOrder) => o.items.reduce((s, it) => s + it.quantity, 0);

function Badge({ dot, text }: { dot: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-mist px-2 py-0.5 text-xs text-ink-soft">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {text}
    </span>
  );
}

type Filter = "all" | "paid" | "cod_pending" | "cancelled";

export function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    let active = true;
    adminListOrders()
      .then((o) => active && (setOrders(o), setLoading(false)))
      .catch(
        () =>
          active &&
          (setError("Could not load orders. Is the backend running?"), setLoading(false)),
      );
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      orders: orders.length,
      items: orders.reduce((s, o) => s + itemCount(o), 0),
      sales: live.reduce((s, o) => s + o.subtotal, 0),
      paid: orders.filter((o) => o.status === "paid").length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [o.id, o.customerName, o.email, o.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, query, filter]);

  const allChecked = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((o) => o.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "cod_pending", label: "Payment pending" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>
      </div>

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-2 divide-line rounded-media border border-line bg-white sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Orders", value: String(stats.orders) },
          { label: "Items ordered", value: String(stats.items) },
          { label: "Total sales", value: formatCurrency(stats.sales) },
          { label: "Paid orders", value: String(stats.paid) },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-xs text-stone">{s.label}</p>
            <p className="mt-1 font-display text-xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Toolbar: tabs + search */}
      <div className="mt-6 rounded-media border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  filter === t.key
                    ? "bg-mist font-medium text-ink"
                    : "text-ink-soft hover:bg-mist hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex min-w-[180px] flex-1 items-center gap-2 rounded-md border border-line px-3 sm:max-w-xs">
            <SearchIcon className="h-4 w-4 text-stone" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, email…"
              className="h-9 w-full bg-transparent text-sm text-ink outline-none placeholder:text-stone"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-mist/60 px-4 py-2">
            <span className="text-xs text-ink-soft">{selected.size} selected</span>
            <button
              onClick={() => printPackingSlips(orders.filter((o) => selected.has(o.id)))}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Print packing slips
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader size="sm" label="" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-stone">
              {orders.length === 0 ? "No orders yet." : "No orders match your search."}
            </p>
          ) : (
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-ink"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Payment status</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => {
                  const p = payment(o.status);
                  const cancelled = o.status === "cancelled";
                  return (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-mist/50",
                        selected.has(o.id) && "bg-mist/40",
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggle(o.id)}
                          className="h-4 w-4 accent-ink"
                          aria-label={`Select order ${o.id}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "font-medium text-ink",
                            cancelled && "text-stone line-through",
                          )}
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-ink">{o.customerName || o.email}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-ink">
                        {formatCurrency(o.subtotal, o.currency)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge dot={p.dot} text={p.text} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                        {methodLabel(o.paymentMethod)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                        {itemCount(o)} item{itemCount(o) === 1 ? "" : "s"}
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRightIcon className="h-4 w-4 text-stone" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
