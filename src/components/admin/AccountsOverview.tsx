"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminGetAccounts, type AdminAccounts } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { UserIcon, ReturnIcon, ReceiptIcon, ChartIcon } from "@/components/ui/Icons";

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

function returnStatusCls(status: string): string {
  switch (status) {
    case "requested":
      return "bg-amber-500 text-white";
    case "approved":
      return "bg-blue-600 text-white";
    case "rejected":
      return "bg-accent text-white";
    default:
      return "bg-green-600 text-white"; // refunded / replaced / completed
  }
}

export function AccountsOverview() {
  const [data, setData] = useState<AdminAccounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const d = await adminGetAccounts();
        if (active) setData(d);
      } catch {
        if (active) setError("Could not load accounts. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const s = data?.summary;
  const currency = s?.currency ?? "INR";

  const cards = s
    ? [
        {
          label: "People purchased",
          value: String(s.buyerCount),
          sub: `${s.orderCount} order${s.orderCount === 1 ? "" : "s"} placed`,
          Icon: UserIcon,
        },
        {
          label: "Total bill",
          value: formatCurrency(s.netRevenue, currency),
          sub: `${formatCurrency(s.grossSales, currency)} before discounts`,
          Icon: ReceiptIcon,
        },
        {
          label: "Refunds",
          value: formatCurrency(s.refundedAmount, currency),
          sub: `${s.returnCount} return${s.returnCount === 1 ? "" : "s"} · ${formatCurrency(
            s.pendingRefunds,
            currency,
          )} pending`,
          Icon: ReturnIcon,
        },
        {
          label: "Net margin",
          value: formatCurrency(s.netMargin, currency),
          sub: "Total bill − refunds",
          Icon: ChartIcon,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Accounts</h1>
      <p className="mt-1 text-sm text-stone">
        How many people bought, the total bill, returns, and the net margin after refunds.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-media border border-line bg-white" />
          ))}
        </div>
      ) : (
        data &&
        s && (
          <div className="mt-6 space-y-6">
            {/* Summary stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-media border border-line bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-sage text-ink">
                      <c.Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 font-display text-3xl text-ink">{c.value}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{c.label}</p>
                  <p className="text-xs text-stone">{c.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Money breakdown */}
            <section className="rounded-media border border-line bg-white p-5">
              <h2 className="font-display text-lg text-ink">Billing &amp; margin</h2>
              <dl className="mt-4 divide-y divide-line text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-soft">Gross sales</dt>
                  <dd className="font-medium text-ink">{formatCurrency(s.grossSales, currency)}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-soft">Discounts given</dt>
                  <dd className="font-medium text-accent">
                    −{formatCurrency(s.totalDiscount, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-soft">Total bill (net revenue)</dt>
                  <dd className="font-medium text-ink">{formatCurrency(s.netRevenue, currency)}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-soft">Refunds paid out</dt>
                  <dd className="font-medium text-accent">
                    −{formatCurrency(s.refundedAmount, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="font-medium text-ink">Net margin</dt>
                  <dd className="font-display text-xl text-ink">
                    {formatCurrency(s.netMargin, currency)}
                  </dd>
                </div>
              </dl>
              {s.pendingRefunds > 0 && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {formatCurrency(s.pendingRefunds, currency)} in refunds still pending — not yet
                  deducted from margin.
                </p>
              )}
            </section>

            {/* All return orders */}
            <section className="overflow-hidden rounded-media border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-lg text-ink">Return orders</h2>
                <span className="text-xs text-stone">
                  {data.returns.length} return{data.returns.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Header (desktop) */}
              <div className="hidden grid-cols-[0.8fr_1.6fr_1fr_1fr_1fr_1fr] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
                <span>Order</span>
                <span>Customer</span>
                <span>Type</span>
                <span>Status</span>
                <span className="text-right">Value</span>
                <span className="text-right">Date</span>
              </div>

              {data.returns.length === 0 ? (
                <p className="py-16 text-center text-stone">No returns yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.returns.map((r) => (
                    <li
                      key={r.id}
                      className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-[0.8fr_1.6fr_1fr_1fr_1fr_1fr] sm:gap-4 sm:px-5"
                    >
                      <span className="font-medium text-ink">#{r.orderRef}</span>
                      <span className="min-w-0 truncate text-ink-soft">
                        {r.name || r.email || r.phone || "Guest"}
                      </span>
                      <span className="capitalize text-ink-soft">
                        <span className="text-stone sm:hidden">Type: </span>
                        {r.resolution}
                      </span>
                      <span>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-medium capitalize",
                            returnStatusCls(r.status),
                          )}
                        >
                          {r.status}
                        </span>
                      </span>
                      <span className="text-ink sm:text-right">
                        <span className="text-stone sm:hidden">Value: </span>
                        {formatCurrency(r.value, currency)}
                      </span>
                      <span className="text-stone sm:text-right">{formatDate(r.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* User-wise breakdown */}
            <section className="overflow-hidden rounded-media border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-lg text-ink">Customer-wise billing &amp; margin</h2>
                <span className="text-xs text-stone">
                  {data.customers.length} buyer{data.customers.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Header (desktop) */}
              <div className="hidden grid-cols-[1.8fr_0.6fr_1fr_1fr_1fr_1fr] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
                <span>Customer</span>
                <span className="text-right">Orders</span>
                <span className="text-right">Total bill</span>
                <span className="text-right">Refunded</span>
                <span className="text-right">Net margin</span>
                <span className="text-right">Last order</span>
              </div>

              {data.customers.length === 0 ? (
                <p className="py-16 text-center text-stone">No purchases yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.customers.map((c) => (
                    <li
                      key={c.email || c.phone || c.name || Math.random()}
                      className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-[1.8fr_0.6fr_1fr_1fr_1fr_1fr] sm:gap-4 sm:px-5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">
                          {c.name || c.email || c.phone || "Guest"}
                        </span>
                        <span className="block truncate text-xs text-stone">
                          {c.email || c.phone || "—"}
                        </span>
                      </span>
                      <span className="text-ink-soft sm:text-right">
                        <span className="text-stone sm:hidden">Orders: </span>
                        {c.orderCount}
                      </span>
                      <span className="text-ink-soft sm:text-right">
                        <span className="text-stone sm:hidden">Total: </span>
                        {formatCurrency(c.netSpent, currency)}
                      </span>
                      <span className="sm:text-right">
                        <span className="text-stone sm:hidden">Refunded: </span>
                        {c.refunded > 0 ? (
                          <span className="text-accent">−{formatCurrency(c.refunded, currency)}</span>
                        ) : (
                          <span className="text-stone">—</span>
                        )}
                      </span>
                      <span className="font-medium text-ink sm:text-right">
                        <span className="text-stone sm:hidden">Margin: </span>
                        {formatCurrency(c.netMargin, currency)}
                      </span>
                      <span className="text-stone sm:text-right">{formatDate(c.lastOrderAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )
      )}
    </div>
  );
}
