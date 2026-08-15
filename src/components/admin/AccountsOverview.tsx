"use client";

import { useEffect, useState } from "react";
import { adminGetAccounts, type AdminAccounts } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { UserIcon, ReturnIcon, ReceiptIcon, ChartIcon } from "@/components/ui/Icons";
import { ReturnStageBadge } from "./ui";

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

/**
 * Payment state → colour, in the console's language: green settled, amber
 * awaiting, violet reversed, red cancelled. Keyed on the label the API sends,
 * so an unrecognised one degrades to neutral rather than inventing a colour.
 */
const PAY_TONE: Record<string, string> = {
  Paid: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20",
  "Unpaid (COD)": "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20",
  Refunded: "bg-[#7C3AED]/10 text-[#7C3AED] ring-[#7C3AED]/20",
  Cancelled: "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20",
};

function PayBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.6875rem] font-medium ring-1 ring-inset",
        PAY_TONE[status] ?? "bg-[#F5F5F4] text-[#737373] ring-[#E5E5E5]",
      )}
    >
      {status}
    </span>
  );
}

/* ── Shared section chrome ───────────────────────────────────────────────── */

function Panel({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-5 py-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.0625rem] leading-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[0.75rem] text-[#737373]">{subtitle}</p>}
        </div>
        {meta && <span className="shrink-0 text-[0.75rem] text-[#737373]">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** Empty states were py-16 bands of nothing; a single line carries it. */
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-9 text-center text-[0.8125rem] text-stone">{children}</p>;
}

/** Narrow screens scroll a table sideways rather than breaking its columns. */
function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
      {children}
    </div>
  );
}

const TH = "px-3 py-2.5 text-left font-medium";
const THR = "px-3 py-2.5 text-right font-medium";
const headRow =
  "border-b border-[#E5E5E5] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]";

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
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Accounts</h1>
      <p className="mt-1 text-sm text-stone">
        How many people bought, the total bill, returns, and the net margin after refunds.
      </p>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl border border-[#E5E5E5] bg-white" />
          ))}
        </div>
      ) : (
        data &&
        s && (
          <div className="mt-5 space-y-4">
            {/* ── Summary ─────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="min-w-0 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(16,16,16,0.04)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#F5F5F4] text-[#525252]">
                      <c.Icon className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 truncate text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                      {c.label}
                    </p>
                  </div>
                  <p className="mt-2.5 font-display text-[1.75rem] leading-none tabular-nums text-ink">
                    {c.value}
                  </p>
                  <p className="mt-1.5 truncate text-[0.75rem] text-[#737373]" title={c.sub}>
                    {c.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Billing & margin ────────────────────────────────────────── */}
            <Panel title="Billing &amp; margin">
              <dl className="px-5 py-1 text-[0.8125rem]">
                {[
                  { l: "Gross sales", v: formatCurrency(s.grossSales, currency) },
                  { l: "Discounts given", v: `−${formatCurrency(s.totalDiscount, currency)}`, neg: true },
                  { l: "Total bill (net revenue)", v: formatCurrency(s.netRevenue, currency) },
                  { l: "Refunds paid out", v: `−${formatCurrency(s.refundedAmount, currency)}`, neg: true },
                ].map((row) => (
                  <div
                    key={row.l}
                    className="flex items-center justify-between gap-4 border-b border-[#F0F0EE] py-2.5"
                  >
                    <dt className="text-ink-soft">{row.l}</dt>
                    <dd
                      className={cn(
                        "shrink-0 tabular-nums font-medium",
                        row.neg ? "text-accent" : "text-ink",
                      )}
                    >
                      {row.v}
                    </dd>
                  </div>
                ))}
                {/* The line the page exists for — set apart from the workings
                    above it rather than being one more row in the list. */}
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="font-medium text-ink">Net margin</dt>
                  <dd className="shrink-0 font-display text-xl tabular-nums text-ink">
                    {formatCurrency(s.netMargin, currency)}
                  </dd>
                </div>
              </dl>
              {s.pendingRefunds > 0 && (
                <p className="mx-5 mb-4 rounded-md bg-[#D97706]/10 px-3 py-2 text-[0.75rem] text-[#B45309]">
                  {formatCurrency(s.pendingRefunds, currency)} in refunds still pending — not yet
                  deducted from margin.
                </p>
              )}
            </Panel>

            {/* ── Payments ────────────────────────────────────────────────── */}
            <Panel
              title="Payments"
              subtitle="Per order — payment method and whether it's been paid."
              meta={`${s.paidCount} paid · ${s.codCount} COD`}
            >
              {data.payments.length === 0 ? (
                <Empty>No orders yet.</Empty>
              ) : (
                <TableScroll>
                  <table className="w-full min-w-[820px] table-fixed border-collapse text-[0.8125rem]">
                    <colgroup>
                      <col />
                      <col className="w-[190px]" />
                      <col className="w-[120px]" />
                      <col className="w-[140px]" />
                      <col className="w-[120px]" />
                    </colgroup>
                    <thead>
                      <tr className={headRow}>
                        <th className={cn(TH, "pl-5")}>Customer</th>
                        <th className={TH}>Payment method</th>
                        <th className={THR}>Amount</th>
                        <th className={TH}>Status</th>
                        <th className={cn(THR, "pr-5")}>Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EE]">
                      {data.payments.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-[#FAFAF9]">
                          <td className="px-3 py-2.5 pl-5">
                            <span className="block truncate font-medium text-ink">
                              {p.name || p.email || p.phone || "Guest"}
                            </span>
                            <span className="block truncate text-[0.75rem] text-[#737373]">
                              #{p.orderRef} · {p.email || p.phone || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="block truncate text-ink-soft">{p.method}</span>
                            {p.razorpayPaymentId && (
                              <span className="block truncate text-[0.75rem] text-[#A3A3A3]">
                                {p.razorpayPaymentId}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                            {formatCurrency(p.amount, currency)}
                          </td>
                          <td className="px-3 py-2.5">
                            <PayBadge status={p.status} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-stone">
                            {formatDate(p.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </Panel>

            {/* ── Return orders ───────────────────────────────────────────── */}
            <Panel
              title="Return orders"
              meta={`${data.returns.length} return${data.returns.length === 1 ? "" : "s"}`}
            >
              {data.returns.length === 0 ? (
                <Empty>No returns yet.</Empty>
              ) : (
                <TableScroll>
                  <table className="w-full min-w-[820px] table-fixed border-collapse text-[0.8125rem]">
                    <colgroup>
                      <col className="w-[110px]" />
                      <col />
                      <col className="w-[130px]" />
                      <col className="w-[130px]" />
                      <col className="w-[120px]" />
                      <col className="w-[120px]" />
                    </colgroup>
                    <thead>
                      <tr className={headRow}>
                        <th className={cn(TH, "pl-5")}>Order</th>
                        <th className={TH}>Customer</th>
                        <th className={TH}>Type</th>
                        <th className={TH}>Status</th>
                        <th className={THR}>Value</th>
                        <th className={cn(THR, "pr-5")}>Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EE]">
                      {data.returns.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-[#FAFAF9]">
                          <td className="px-3 py-2.5 pl-5 font-medium text-ink">#{r.orderRef}</td>
                          <td className="px-3 py-2.5">
                            <span className="block truncate text-ink-soft">
                              {r.name || r.email || r.phone || "Guest"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 capitalize text-ink-soft">{r.resolution}</td>
                          <td className="px-3 py-2.5">
                            {/* The same badge the Returns page uses. */}
                            <ReturnStageBadge status={r.status} />
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                            {formatCurrency(r.value, currency)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-stone">
                            {formatDate(r.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </Panel>

            {/* ── Customer-wise ───────────────────────────────────────────── */}
            <Panel
              title="Customer-wise billing &amp; margin"
              meta={`${data.customers.length} buyer${data.customers.length === 1 ? "" : "s"}`}
            >
              {data.customers.length === 0 ? (
                <Empty>No purchases yet.</Empty>
              ) : (
                <TableScroll>
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-[0.8125rem]">
                    <colgroup>
                      <col />
                      <col className="w-[90px]" />
                      <col className="w-[130px]" />
                      <col className="w-[130px]" />
                      <col className="w-[140px]" />
                      <col className="w-[130px]" />
                    </colgroup>
                    <thead>
                      <tr className={headRow}>
                        <th className={cn(TH, "pl-5")}>Customer</th>
                        <th className={THR}>Orders</th>
                        <th className={THR}>Total bill</th>
                        <th className={THR}>Refunded</th>
                        <th className={THR}>Net margin</th>
                        <th className={cn(THR, "pr-5")}>Last order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EE]">
                      {data.customers.map((c, i) => (
                        /* The index is part of the key on purpose: two separate
                           buyers can share an email (different phones, different
                           margins), and email-only keys collided — React warns
                           such rows may be "duplicated and/or omitted", which on
                           a billing table means a customer silently missing. */
                        <tr
                          key={`${c.email || c.phone || c.name || "guest"}-${i}`}
                          className="transition-colors hover:bg-[#FAFAF9]"
                        >
                          <td className="px-3 py-2.5 pl-5">
                            {/* Name carries the weight, contact sits under it
                                muted — they used to read at similar strength. */}
                            <span className="block truncate font-medium text-ink">
                              {c.name || c.email || c.phone || "Guest"}
                            </span>
                            <span className="block truncate text-[0.75rem] text-[#737373]">
                              {c.email || c.phone || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                            {c.orderCount}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                            {formatCurrency(c.netSpent, currency)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {c.refunded > 0 ? (
                              <span className="text-accent">
                                −{formatCurrency(c.refunded, currency)}
                              </span>
                            ) : (
                              <span className="text-[#D4D4D4]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums text-ink">
                            {formatCurrency(c.netMargin, currency)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 pr-5 text-right text-stone">
                            {formatDate(c.lastOrderAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </Panel>
          </div>
        )
      )}
    </div>
  );
}
