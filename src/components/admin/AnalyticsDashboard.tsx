"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  adminGetAnalytics,
  type AdminAnalytics,
  type AnalyticsCustomer,
} from "@/services/admin";
import { RevenueChart, OrdersChart, StatusDonut } from "./analytics-charts";
import { LiveVisitorsPanel } from "./LiveVisitorsPanel";
import { Card, CardHeader, BrandLoader } from "./ui";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { BagIcon, TruckIcon, UserIcon, ClockIcon, ChartIcon } from "@/components/ui/Icons";

/* ───────────────────────────── formatting ───────────────────────────────── */

function fmtTime(seconds: number): string {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
function prettyPath(path: string): string {
  return path === "/" ? "Home" : path;
}
function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "—";
  }
}
function fmtDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}
function labelDay(day: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
      new Date(`${day}T00:00:00`),
    );
  } catch {
    return day;
  }
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
/** Compact currency for chart axes — ₹12,000 becomes ₹12k. */
function axisCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`;
  return `₹${n}`;
}

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
] as const;

/* ───────────────────────────── badges ───────────────────────────────────── */

function paymentBadge(label: string): string {
  if (label === "Paid") return "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20";
  if (label.startsWith("COD")) return "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20";
  if (label === "Cancelled") return "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20";
  if (label === "Refunded") return "bg-[#7C3AED]/10 text-[#7C3AED] ring-[#7C3AED]/20";
  return "bg-[#F5F5F4] text-[#737373] ring-[#E5E5E5]";
}
function refundBadge(status: string): string {
  switch (status) {
    case "approved":
    case "completed":
    case "refunded":
      return "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20";
    case "rejected":
      return "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20";
    default:
      return "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20";
  }
}
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.6875rem] font-medium capitalize ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 text-[#A3A3A3] transition-transform duration-200", open && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────── Expandable customer row ───────────────────────── */

type TabKey = "orders" | "returns" | "activity";

function CustomerDetail({
  customer,
  pageActivityNote,
}: {
  customer: AnalyticsCustomer;
  pageActivityNote: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("orders");
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "orders", label: "Order history", count: customer.orderList.length },
    { key: "returns", label: "Returns", count: customer.returnList.length },
    { key: "activity", label: "Website activity", count: 0 },
  ];

  return (
    <div className="border-t border-[#E5E5E5] bg-[#FAFAF9] px-4 py-4 sm:px-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { l: "Gross order value", v: formatCurrency(customer.grossValue), tone: "" },
          {
            l: "Returned",
            v: customer.returnedAmount > 0 ? `− ${formatCurrency(customer.returnedAmount)}` : "—",
            tone: customer.returnedAmount > 0 ? "text-[#DC2626]" : "text-[#A3A3A3]",
          },
          { l: "Net purchase", v: formatCurrency(customer.netPurchase), tone: "text-[#16803C]" },
          { l: "Avg order", v: formatCurrency(customer.avgOrder), tone: "" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5">
            <p className="text-[0.6875rem] text-[#737373]">{s.l}</p>
            <p className={cn("mt-1 text-[0.9375rem] font-semibold tabular-nums text-[#171717]", s.tone)}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-lg border border-[#E5E5E5] bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative min-w-0 flex-1 rounded-md px-2 py-1.5 text-[0.75rem] font-medium transition-colors sm:text-[0.8125rem]",
              tab === t.key ? "text-white" : "text-[#737373] hover:text-[#171717]",
            )}
          >
            {tab === t.key && (
              <motion.span
                layoutId={`tab-${customer.key}`}
                className="absolute inset-0 rounded-md bg-[#171717]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative truncate">
              {t.label}
              {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "orders" &&
          (customer.orderList.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-[#737373]">No orders.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#E5E5E5] bg-white">
              <table className="w-full min-w-[640px] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                    <th className="px-3 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Products</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">Payment</th>
                    <th className="px-3 py-2.5 font-semibold">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {customer.orderList.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-[#FAFAF9]">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#171717]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#737373]">{fmtDate(o.date)}</td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-[#525252]" title={o.products.map((p) => `${p.title} ×${p.quantity}`).join(", ")}>
                        {o.products.map((p) => `${p.title} ×${p.quantity}`).join(", ")}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#525252]">{o.quantity}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-[#171717]">
                        {formatCurrency(o.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={paymentBadge(o.paymentStatus)}>{o.paymentStatus}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#525252]">{o.deliveryStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "returns" &&
          (customer.returnList.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-[#737373]">
              No returns — this customer kept everything.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#E5E5E5] bg-white">
              <table className="w-full min-w-[640px] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                    <th className="px-3 py-2.5 font-semibold">Return</th>
                    <th className="px-3 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Products</th>
                    <th className="px-3 py-2.5 font-semibold">Reason</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Refund</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {customer.returnList.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-[#FAFAF9]">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#171717]">
                        #{r.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#737373]">
                        #{r.orderId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[#737373]">{fmtDate(r.date)}</td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-[#525252]">
                        {r.products.map((p) => `${p.title} ×${p.quantity}`).join(", ")}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 text-[#525252]" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-[#DC2626]">
                        − {formatCurrency(r.refundAmount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={refundBadge(r.refundStatus)}>{r.refundStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "activity" && <div>{pageActivityNote}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────── Customer table ─────────────────────────────── */

type SortKey = "name" | "orders" | "grossValue" | "returnedAmount" | "netPurchase" | "lastOrder";
const PAGE_SIZE = 8;

function CustomerTable({
  customers,
  pageActivityNote,
}: {
  customers: AnalyticsCustomer[];
  pageActivityNote: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("grossValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = customers.filter((c) => {
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      let cmp: number;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "lastOrder") cmp = a.lastOrder.localeCompare(b.lastOrder);
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [customers, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(0);
  }

  function sortHead(label: string, k: SortKey, align: "left" | "right" = "left") {
    const active = sortKey === k;
    return (
      <th className={cn("px-3 py-2.5", align === "right" && "text-right")}>
        <button
          onClick={() => sortBy(k)}
          className={cn(
            "inline-flex items-center gap-1 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] transition-colors",
            active ? "text-[#171717]" : "text-[#737373] hover:text-[#171717]",
          )}
        >
          {label}
          <svg
            viewBox="0 0 10 10"
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              active ? "opacity-100" : "opacity-25",
              active && sortDir === "asc" && "rotate-180",
            )}
            aria-hidden
          >
            <path d="M5 8L1.5 3.5h7z" fill="currentColor" />
          </svg>
        </button>
      </th>
    );
  }

  return (
    <Card padded={false} className="min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">Customers</h2>
          <p className="mt-0.5 text-[0.75rem] text-[#737373]">
            {filtered.length} of {customers.length} · select a row for full history
          </p>
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-[16rem] sm:flex-none">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search name, email, phone"
            className="h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white pl-8 pr-3 text-[0.8125rem] text-[#171717] outline-none placeholder:text-[#A3A3A3] focus:border-[#171717]"
          />
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[820px] text-[0.8125rem]">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left">
              {sortHead("Customer", "name")}
              {sortHead("Orders", "orders", "right")}
              {sortHead("Gross value", "grossValue", "right")}
              {sortHead("Returned", "returnedAmount", "right")}
              {sortHead("Net purchase", "netPurchase", "right")}
              {sortHead("Last order", "lastOrder")}
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0EE]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[0.8125rem] text-[#737373]">
                  No customers match your search.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const open = expanded === c.key;
              return (
                <Fragment key={c.key}>
                  <tr
                    onClick={() => setExpanded(open ? null : c.key)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-[#FAFAF9]",
                      open && "bg-[#FAFAF9]",
                    )}
                  >
                    <td className="px-3 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#171717] text-[0.6875rem] font-semibold text-white">
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-[#171717]">{c.name}</span>
                          <span className="block truncate text-[0.75rem] text-[#737373]">
                            {c.email || c.phone}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#525252]">{c.orders}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#171717]">
                      {formatCurrency(c.grossValue)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-3 text-right tabular-nums",
                        c.returnedAmount > 0 ? "text-[#DC2626]" : "text-[#A3A3A3]",
                      )}
                    >
                      {c.returnedAmount > 0 ? `− ${formatCurrency(c.returnedAmount)}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums text-[#16803C]">
                      {formatCurrency(c.netPurchase)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[#737373]">{fmtDate(c.lastOrder)}</td>
                    <td className="px-3 py-3">
                      <Chevron open={open} />
                    </td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {open && (
                      <tr key={`${c.key}-detail`}>
                        <td colSpan={7} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <CustomerDetail customer={c} pageActivityNote={pageActivityNote} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-[#E5E5E5] px-4 py-3 text-[0.8125rem] sm:px-5">
          <span className="text-[#737373]">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ──────────────────────────── Dashboard root ────────────────────────────── */

export function AnalyticsDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [range, setRange] = useState<number>(30);
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [pickerError, setPickerError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const d = await adminGetAnalytics();
        if (active) setData(d);
      } catch {
        if (active) setError("Could not load analytics. (Run analytics.sql and start the backend.)");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const dayKeys = useMemo(() => (data?.revenueByDay ?? []).map((p) => p.date.slice(0, 10)), [data]);

  /**
   * Selected window as [start, end] indices into the daily series. Presets take
   * the last N days; a picked range takes everything between the two dates.
   * The chart and the orders bars both read these, so the two always agree.
   */
  const sel = useMemo(() => {
    const n = data?.revenueByDay.length ?? 0;
    if (n === 0) return { start: 0, end: -1 };
    if (custom) {
      let start = dayKeys.findIndex((d) => d >= custom.from);
      if (start === -1) start = n;
      let end = -1;
      for (let i = n - 1; i >= 0; i -= 1) {
        if (dayKeys[i] <= custom.to) {
          end = i;
          break;
        }
      }
      return { start, end };
    }
    return { start: Math.max(0, n - range), end: n - 1 };
  }, [data, dayKeys, custom, range]);

  const series = useMemo(() => {
    const rev = data?.revenueByDay ?? [];
    const ord = data?.ordersByDay ?? [];
    const cut = <T,>(a: T[]) => (sel.end < sel.start ? [] : a.slice(sel.start, sel.end + 1));
    return {
      revenue: cut(rev).map((d) => d.value),
      orders: cut(ord).map((d) => d.count),
      labels: cut(rev).map((d) => fmtDay(d.date)),
    };
  }, [data, sel]);

  const s = data?.summary;

  /** The four headline figures get the larger treatment. */
  const primary = s
    ? [
        { label: "Total revenue", value: formatCurrency(s.totalRevenue), Icon: BagIcon, tone: "" },
        {
          label: "Net revenue",
          value: formatCurrency(s.netRevenue),
          Icon: ChartIcon,
          tone: "text-[#16803C]",
          hint: "Revenue − returns",
        },
        { label: "Orders", value: String(s.totalOrders), Icon: TruckIcon, tone: "" },
        { label: "Customers who ordered", value: String(s.totalCustomers), Icon: UserIcon, tone: "" },
      ]
    : [];

  const secondary = s
    ? [
        {
          label: "Returned amount",
          value: s.totalReturned > 0 ? `− ${formatCurrency(s.totalReturned)}` : formatCurrency(0),
          tone: s.totalReturned > 0 ? "text-[#DC2626]" : "",
        },
        { label: "Avg order value", value: formatCurrency(s.avgOrderValue), tone: "" },
        { label: "Website visitors", value: String(s.totalVisitors), tone: "" },
        { label: "Page views", value: String(s.totalPageViews), tone: "" },
        { label: "Time on site", value: fmtTime(s.totalTimeSec), tone: "" },
        { label: "Avg session", value: fmtTime(s.avgSessionSec), hint: `${s.bounceRate}% bounce`, tone: "" },
      ]
    : [];

  const pageActivityNote = data && (
    <div>
      <p className="mb-3 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-[0.75rem] text-[#737373]">
        Website browsing is tracked anonymously per session, so it can&apos;t be tied to one customer. Below
        is store-wide page activity.
      </p>
      {data.pageActivity.length === 0 ? (
        <p className="py-8 text-center text-[0.8125rem] text-[#737373]">No activity tracked yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E5E5E5] bg-white">
          <table className="w-full min-w-[520px] text-[0.8125rem]">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                <th className="px-3 py-2.5 font-semibold">Page</th>
                <th className="px-3 py-2.5 text-right font-semibold">Visits</th>
                <th className="px-3 py-2.5 text-right font-semibold">Visitors</th>
                <th className="px-3 py-2.5 text-right font-semibold">Time</th>
                <th className="px-3 py-2.5 font-semibold">Last visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EE]">
              {data.pageActivity.map((p) => (
                <tr key={p.path} className="transition-colors hover:bg-[#FAFAF9]">
                  <td className="px-3 py-2.5 text-[#171717]">{prettyPath(p.path)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#525252]">{p.visits}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#525252]">{p.uniqueVisitors}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#525252]">{fmtTime(p.totalSec)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-[#737373]">{fmtDate(p.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-w-0 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[1.75rem]">
            Analytics
          </h1>
          <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
            Revenue, customers, returns, and how people browse your store.
          </p>
        </div>

        <div className="relative flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center rounded-lg border border-[#E5E5E5] bg-white p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => {
                  setRange(r.days);
                  setCustom(null);
                  setPickerOpen(false);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors",
                  !custom && range === r.days
                    ? "bg-[#171717] text-white"
                    : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
                )}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => {
                setPickerError("");
                setDraft(
                  custom ?? {
                    from: dayKeys[Math.max(0, dayKeys.length - range)] ?? "",
                    to: dayKeys[dayKeys.length - 1] ?? "",
                  },
                );
                setPickerOpen((v) => !v);
              }}
              disabled={dayKeys.length === 0}
              aria-expanded={pickerOpen}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                custom ? "bg-[#171717] text-white" : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
              )}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              {custom ? `${labelDay(custom.from)} – ${labelDay(custom.to)}` : "Date range"}
            </button>
          </div>

          {pickerOpen && (
            <>
              <button
                aria-label="Close date picker"
                onClick={() => setPickerOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-lg sm:left-auto sm:right-0">
                <p className="text-[0.8125rem] font-semibold text-[#171717]">Date range</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["from", "to"] as const).map((k) => (
                    <label key={k} className="block">
                      <span className="mb-1 block text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                        {k}
                      </span>
                      <input
                        type="date"
                        value={draft[k]}
                        min={dayKeys[0]}
                        max={dayKeys[dayKeys.length - 1]}
                        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                        className="h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[0.8125rem] text-[#171717] focus:border-[#171717] focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[0.6875rem] text-[#A3A3A3]">
                  Data available {labelDay(dayKeys[0] ?? "")} – {labelDay(dayKeys[dayKeys.length - 1] ?? "")}
                </p>
                {pickerError && <p className="mt-1 text-[0.6875rem] text-[#DC2626]">{pickerError}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setCustom(null);
                      setPickerError("");
                      setPickerOpen(false);
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium text-[#737373] transition-colors hover:bg-[#F5F5F4] hover:text-[#171717]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      if (!draft.from || !draft.to) return setPickerError("Pick both dates.");
                      if (draft.from > draft.to) return setPickerError("From must be on or before To.");
                      setCustom({ from: draft.from, to: draft.to });
                      setPickerError("");
                      setPickerOpen(false);
                    }}
                    className="rounded-lg bg-[#171717] px-3 py-1.5 text-[0.75rem] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live visitors */}
      <section className="min-w-0">
        <div className="mb-2.5 flex items-center gap-2">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">Live visitors</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-[#16803C]/10 px-2 py-0.5 text-[0.625rem] font-medium text-[#16803C]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16803C] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#16803C]" />
            </span>
            Live
          </span>
        </div>
        <LiveVisitorsPanel />
      </section>

      {error && (
        <p className="rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 px-4 py-3 text-[0.8125rem] text-[#DC2626]">
          {error}
        </p>
      )}

      {loading ? (
        <BrandLoader label="Loading analytics" />
      ) : (
        data &&
        s && (
          <>
            {/* Primary KPIs */}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {primary.map((k) => (
                <Card key={k.label} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#F5F5F4] text-[#525252]">
                      <k.Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-[0.75rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                      {k.label}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-3 truncate text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-[#171717]",
                      k.tone,
                    )}
                  >
                    {k.value}
                  </p>
                  {k.hint && <p className="mt-2 text-[0.75rem] text-[#737373]">{k.hint}</p>}
                </Card>
              ))}
            </div>

            {/* Secondary KPIs — quieter, denser */}
            <div className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#E5E5E5] sm:grid-cols-3 xl:grid-cols-6">
              {secondary.map((k) => (
                <div key={k.label} className="min-w-0 bg-white px-4 py-3.5">
                  <p className="truncate text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                    {k.label}
                  </p>
                  <p className={cn("mt-1.5 truncate text-[1.0625rem] font-semibold tabular-nums text-[#171717]", k.tone)}>
                    {k.value}
                  </p>
                  {k.hint && <p className="mt-0.5 truncate text-[0.6875rem] text-[#A3A3A3]">{k.hint}</p>}
                </div>
              ))}
            </div>

            {/* Revenue + status */}
            <div className="grid min-w-0 gap-4 xl:grid-cols-[1.7fr_1fr]">
              <Card className="min-w-0">
                <CardHeader
                  title="Revenue"
                  action={
                    <span className="text-[0.75rem] tabular-nums text-[#737373]">
                      {formatCurrency(series.revenue.reduce((a, b) => a + b, 0))} in period
                    </span>
                  }
                />
                {series.revenue.length === 0 ? (
                  <p className="py-20 text-center text-[0.8125rem] text-[#737373]">
                    No revenue in this period.
                  </p>
                ) : (
                  <div className="mt-3">
                    <RevenueChart
                      points={series.revenue}
                      labels={series.labels}
                      format={axisCurrency}
                      height={320}
                    />
                  </div>
                )}
              </Card>

              <Card className="min-w-0">
                <CardHeader title="Order status" />
                {data.statusBreakdown.length === 0 ? (
                  <p className="py-20 text-center text-[0.8125rem] text-[#737373]">No orders yet.</p>
                ) : (
                  <div className="mt-4">
                    <StatusDonut
                      slices={data.statusBreakdown.map((x) => ({ label: x.status, value: x.count }))}
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Orders */}
            <Card className="min-w-0">
              <CardHeader
                title="Orders"
                action={
                  <span className="text-[0.75rem] tabular-nums text-[#737373]">
                    {series.orders.reduce((a, b) => a + b, 0)} in period
                  </span>
                }
              />
              {series.orders.length === 0 ? (
                <p className="py-16 text-center text-[0.8125rem] text-[#737373]">No orders in this period.</p>
              ) : (
                <div className="mt-3">
                  <OrdersChart points={series.orders} labels={series.labels} height={240} />
                </div>
              )}
            </Card>

            <CustomerTable customers={data.customers} pageActivityNote={pageActivityNote} />

            {/* Product signals */}
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <Card className="flex min-w-0 flex-col">
                <CardHeader title="Added to cart, not bought" />
                <p className="mt-0.5 text-[0.75rem] text-[#737373]">Interest that didn&apos;t convert</p>
                {data.abandoned.length === 0 ? (
                  <p className="flex-1 py-12 text-center text-[0.8125rem] text-[#737373]">
                    Nothing abandoned yet.
                  </p>
                ) : (
                  <ul className="mt-4 flex-1 space-y-3.5">
                    {data.abandoned.map((a) => {
                      const pct = a.added ? Math.round((a.notBought / a.added) * 100) : 0;
                      return (
                        <li key={a.handle} className="min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-[0.8125rem] text-[#171717]" title={a.title}>
                              {a.title}
                            </span>
                            <span className="shrink-0 text-[0.75rem] tabular-nums text-[#737373]">
                              {a.added} added · <span className="text-[#DC2626]">{a.notBought}</span> not bought
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F0F0EE]">
                              <div
                                className="h-full rounded-full bg-[#DC2626]/70"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-9 shrink-0 text-right text-[0.6875rem] tabular-nums text-[#A3A3A3]">
                              {pct}%
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card className="flex min-w-0 flex-col">
                <CardHeader title="Most liked" />
                <p className="mt-0.5 text-[0.75rem] text-[#737373]">Products added to wishlists</p>
                {data.mostLiked.length === 0 ? (
                  <p className="flex-1 py-12 text-center text-[0.8125rem] text-[#737373]">No likes yet.</p>
                ) : (
                  <ul className="mt-4 flex-1 space-y-2">
                    {data.mostLiked.map((m, i) => {
                      const top = data.mostLiked[0].likes || 1;
                      return (
                        <li
                          key={m.handle}
                          className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#FAFAF9]"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#F5F5F4] text-[0.6875rem] font-semibold tabular-nums text-[#737373]">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.8125rem] text-[#171717]" title={m.title}>
                              {m.title}
                            </span>
                            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#F0F0EE]">
                              <span
                                className="block h-full rounded-full bg-[#171717]/25"
                                style={{ width: `${Math.round((m.likes / top) * 100)}%` }}
                              />
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-[#171717]">
                            ♥ {m.likes}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
