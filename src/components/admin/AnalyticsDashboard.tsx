"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminGetAnalytics,
  type AdminAnalytics,
  type AnalyticsCustomer,
} from "@/services/admin";
import { LiveVisitors } from "@/components/admin/LiveVisitors";
import { AreaChart, BarChart, DonutChart } from "@/components/admin/charts";
import { Loader } from "@/components/ui/Loader";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

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
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/* ───────────────────────────── KPI cards ────────────────────────────────── */

function KpiCard({
  label,
  value,
  hint,
  accent,
  index,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "green" | "red" | "ink";
  index: number;
}) {
  const valueColor =
    accent === "green" ? "text-green-600" : accent === "red" ? "text-accent" : "text-ink";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-media border border-line bg-white p-4"
    >
      <p className="text-xs text-stone">{label}</p>
      <p className={cn("mt-1 font-display text-xl sm:text-2xl", valueColor)}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-stone">{hint}</p>}
    </motion.div>
  );
}

/* ───────────────────────────── badges ───────────────────────────────────── */

function paymentBadge(label: string): string {
  if (label === "Paid") return "bg-emerald-100 text-emerald-700";
  if (label.startsWith("COD")) return "bg-amber-100 text-amber-700";
  if (label === "Cancelled") return "bg-rose-100 text-rose-700";
  if (label === "Refunded") return "bg-violet-100 text-violet-700";
  return "bg-stone-100 text-stone-600";
}
function refundBadge(status: string): string {
  switch (status) {
    case "approved":
    case "completed":
    case "refunded":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

/* ───────────────────────────── Panel wrapper ────────────────────────────── */

function Panel({
  title,
  subtitle,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-media border border-line bg-white p-5", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </div>
      {subtitle && <p className="mt-0.5 text-xs text-stone">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 text-stone transition-transform", open && "rotate-180")}
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
    <div className="border-t border-line bg-mist/30 px-4 py-4 sm:px-6">
      {/* Mini stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Gross order value", v: formatCurrency(customer.grossValue) },
          { l: "Returned", v: formatCurrency(customer.returnedAmount), red: customer.returnedAmount > 0 },
          { l: "Net purchase", v: formatCurrency(customer.netPurchase), green: true },
          { l: "Avg order", v: formatCurrency(customer.avgOrder) },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-line bg-white px-3 py-2">
            <p className="text-[11px] text-stone">{s.l}</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-medium",
                s.red ? "text-accent" : s.green ? "text-green-600" : "text-ink",
              )}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white p-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              tab === t.key ? "text-ink" : "text-stone hover:text-ink",
            )}
          >
            {tab === t.key && (
              <motion.span
                layoutId={`tab-${customer.key}`}
                className="absolute inset-0 rounded-md bg-mist"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">
              {t.label}
              {t.count > 0 && <span className="ml-1.5 text-xs text-stone">({t.count})</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "orders" &&
          (customer.orderList.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone">No orders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone">
                    <th className="py-2 pr-3 font-medium">Order</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Products</th>
                    <th className="py-2 pr-3 text-right font-medium">Qty</th>
                    <th className="py-2 pr-3 text-right font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Payment</th>
                    <th className="py-2 font-medium">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {customer.orderList.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 pr-3 font-medium text-ink">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 pr-3 text-stone">{fmtDate(o.date)}</td>
                      <td className="max-w-[220px] py-2.5 pr-3 text-ink-soft">
                        {o.products.map((p) => `${p.title} ×${p.quantity}`).join(", ")}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-ink-soft">{o.quantity}</td>
                      <td className="py-2.5 pr-3 text-right font-medium text-ink">
                        {formatCurrency(o.amount)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", paymentBadge(o.paymentStatus))}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-soft">{o.deliveryStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "returns" &&
          (customer.returnList.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone">No returns — this customer kept everything.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-rose-200 bg-rose-50/60">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-rose-200 text-left text-xs uppercase tracking-wide text-rose-500">
                    <th className="py-2 pl-3 pr-3 font-medium">Return</th>
                    <th className="py-2 pr-3 font-medium">Order</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Products</th>
                    <th className="py-2 pr-3 font-medium">Reason</th>
                    <th className="py-2 pr-3 text-right font-medium">Refund</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-200/70">
                  {customer.returnList.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 pl-3 pr-3 font-medium text-rose-700">#{r.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 pr-3 text-rose-600">#{r.orderId.slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 pr-3 text-rose-600">{fmtDate(r.date)}</td>
                      <td className="max-w-[200px] py-2.5 pr-3 text-rose-700">
                        {r.products.map((p) => `${p.title} ×${p.quantity}`).join(", ")}
                      </td>
                      <td className="max-w-[160px] py-2.5 pr-3 text-rose-700">{r.reason}</td>
                      <td className="py-2.5 pr-3 text-right font-medium text-rose-700">
                        − {formatCurrency(r.refundAmount)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", refundBadge(r.refundStatus))}>
                          {r.refundStatus}
                        </span>
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
    return (
      <th className={cn("py-2.5 px-3 font-medium", align === "right" && "text-right")}>
        <button
          onClick={() => sortBy(k)}
          className={cn("inline-flex items-center gap-1 hover:text-ink", sortKey === k ? "text-ink" : "text-stone")}
        >
          {label}
          <span className={cn("text-[10px]", sortKey === k ? "opacity-100" : "opacity-30")}>
            {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-media border border-line bg-white"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div>
          <h2 className="font-display text-lg text-ink">Customers</h2>
          <p className="text-xs text-stone">{filtered.length} of {customers.length} · click a row for full history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search name, email, phone"
              className="w-56 rounded-md border border-line bg-white py-1.5 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-stone focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide">
              {sortHead("Customer", "name")}
              {sortHead("Orders", "orders", "right")}
              {sortHead("Gross value", "grossValue", "right")}
              {sortHead("Returned", "returnedAmount", "right")}
              {sortHead("Net purchase", "netPurchase", "right")}
              {sortHead("Last order", "lastOrder")}
              <th className="w-10 py-2.5 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-stone">
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
                    className={cn("cursor-pointer transition-colors hover:bg-mist/50", open && "bg-mist/50")}
                  >
                    <td className="py-3 px-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-medium text-white">
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{c.name}</span>
                          <span className="block truncate text-xs text-stone">{c.email || c.phone}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-ink-soft">{c.orders}</td>
                    <td className="py-3 px-3 text-right text-ink">{formatCurrency(c.grossValue)}</td>
                    <td className={cn("py-3 px-3 text-right", c.returnedAmount > 0 ? "text-accent" : "text-stone")}>
                      {c.returnedAmount > 0 ? `− ${formatCurrency(c.returnedAmount)}` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-green-600">
                      {formatCurrency(c.netPurchase)}
                    </td>
                    <td className="py-3 px-3 text-stone">{fmtDate(c.lastOrder)}</td>
                    <td className="py-3 px-3">
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
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <span className="text-stone">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-line px-3 py-1.5 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-md border border-line px-3 py-1.5 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

/* ──────────────────────────── Dashboard root ────────────────────────────── */

export function AnalyticsDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const s = data?.summary;
  const kpis = s
    ? [
        { label: "Total customers", value: String(s.totalCustomers) },
        { label: "Total orders", value: String(s.totalOrders) },
        { label: "Total revenue", value: formatCurrency(s.totalRevenue) },
        { label: "Returned amount", value: formatCurrency(s.totalReturned), accent: "red" as const },
        { label: "Net revenue", value: formatCurrency(s.netRevenue), accent: "green" as const, hint: "Revenue − returns" },
        { label: "Avg order value", value: formatCurrency(s.avgOrderValue) },
        { label: "Website visitors", value: String(s.totalVisitors) },
        { label: "Page views", value: String(s.totalPageViews) },
        { label: "Time on site", value: fmtTime(s.totalTimeSec) },
        { label: "Avg session", value: fmtTime(s.avgSessionSec), hint: `${s.bounceRate}% bounce` },
      ]
    : [];

  const pageActivityNote = data && (
    <div>
      <p className="mb-3 rounded-md border border-line bg-white px-3 py-2 text-xs text-stone">
        Website browsing is tracked anonymously per session, so it can&apos;t be tied to one customer. Below is
        store-wide page activity.
      </p>
      {data.pageActivity.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone">No activity tracked yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone">
                <th className="py-2 px-3 font-medium">Page</th>
                <th className="py-2 px-3 text-right font-medium">Visits</th>
                <th className="py-2 px-3 text-right font-medium">Visitors</th>
                <th className="py-2 px-3 text-right font-medium">Time</th>
                <th className="py-2 px-3 font-medium">Last visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.pageActivity.map((p) => (
                <tr key={p.path}>
                  <td className="py-2 px-3 text-ink">{prettyPath(p.path)}</td>
                  <td className="py-2 px-3 text-right text-ink-soft">{p.visits}</td>
                  <td className="py-2 px-3 text-right text-ink-soft">{p.uniqueVisitors}</td>
                  <td className="py-2 px-3 text-right text-ink-soft">{fmtTime(p.totalSec)}</td>
                  <td className="py-2 px-3 text-stone">{fmtDate(p.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-stone">
        Revenue, customers, returns, and how people browse your store.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-20">
          <Loader label="Loading analytics" />
        </div>
      ) : (
        data &&
        s && (
          <div className="mt-6 space-y-5">
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {kpis.map((k, i) => (
                <KpiCard key={k.label} index={i} {...k} />
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Revenue" subtitle="Net revenue · last 14 days" delay={0.05} className="lg:col-span-2">
                <AreaChart
                  points={data.revenueByDay.map((d) => d.value)}
                  labels={data.revenueByDay.map((d) => fmtDay(d.date))}
                  valueFormat={(n) => formatCurrency(n)}
                  height={170}
                />
              </Panel>
              <Panel title="Order status" subtitle="All-time breakdown" delay={0.1}>
                <DonutChart
                  slices={data.statusBreakdown.map((x) => ({ label: x.status, value: x.count }))}
                />
              </Panel>
            </div>

            <Panel title="Orders" subtitle="Orders per day · last 14 days" delay={0.12}>
              <BarChart
                points={data.ordersByDay.map((d) => d.count)}
                labels={data.ordersByDay.map((d) => fmtDay(d.date))}
                height={140}
              />
            </Panel>

            {/* Live visitors */}
            <LiveVisitors />

            {/* Customer table with expandable history */}
            <CustomerTable customers={data.customers} pageActivityNote={pageActivityNote} />

            {/* Product signals */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Added to cart, not bought" subtitle="Interest that didn't convert" delay={0.2}>
                {data.abandoned.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone">Nothing abandoned yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.abandoned.map((a) => (
                      <li key={a.handle} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="truncate text-ink">{a.title}</span>
                        <span className="shrink-0 text-xs text-stone">
                          <span className="font-medium text-accent">{a.notBought}</span> not bought · {a.added} added
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Most liked" subtitle="Products added to wishlists" delay={0.25}>
                {data.mostLiked.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone">No likes yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.mostLiked.map((m) => (
                      <li key={m.handle} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="truncate text-ink">{m.title}</span>
                        <span className="shrink-0 text-xs font-medium text-ink">♥ {m.likes}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        )
      )}
    </div>
  );
}
