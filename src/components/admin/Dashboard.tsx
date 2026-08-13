"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminGetStats,
  adminGetAnalytics,
  adminListInventory,
  adminListOrders,
  type AdminStats,
  type AdminAnalytics,
  type InventoryItem,
  type AdminOrder,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Card, CardHeader, StatusBadge, Delta, Sparkline, BrandLoader } from "./ui";
import {
  BagIcon,
  TruckIcon,
  UserIcon,
  ReturnIcon,
  BoxIcon,
  TagIcon,
  LayersIcon,
  PlusIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

/* ─────────────────────────────── helpers ────────────────────────────────── */

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
] as const;

function shortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Percentage change between the selected window and the equally long window
 * immediately before it. Returns null when there isn't a full previous window
 * to compare against, so the UI can say "—" instead of inventing a number.
 *
 * Works off explicit indices so a preset and a hand-picked range are compared
 * the same way.
 */
function windowDelta(series: number[], start: number, end: number): number | null {
  const len = end - start + 1;
  if (len <= 0) return null;
  const prevStart = start - len;
  if (prevStart < 0) return null;
  const sum = (a: number, b: number) => a + b;
  const cur = series.slice(start, end + 1).reduce(sum, 0);
  const prev = series.slice(prevStart, start).reduce(sum, 0);
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

/** "2026-08-12" → "12 Aug". */
function labelDay(day: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
      new Date(`${day}T00:00:00`),
    );
  } catch {
    return day;
  }
}

/* ──────────────────────────── sales overview ────────────────────────────── */

function SalesChart({
  revenue,
  orders,
  labels,
}: {
  revenue: number[];
  orders: number[];
  labels: string[];
}) {
  const w = 720;
  const h = 220;
  const padX = 44;
  const padTop = 16;
  const padBottom = 26;
  const maxRev = Math.max(1, ...revenue);
  const maxOrd = Math.max(1, ...orders);
  const n = revenue.length;

  const x = (i: number) => (n <= 1 ? padX : padX + (i * (w - padX - 12)) / (n - 1));
  const yRev = (v: number) => padTop + (1 - v / maxRev) * (h - padTop - padBottom);
  const yOrd = (v: number) => padTop + (1 - v / maxOrd) * (h - padTop - padBottom);

  const revLine = revenue.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yRev(v).toFixed(1)}`).join(" ");
  const ordLine = orders.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yOrd(v).toFixed(1)}`).join(" ");
  const area = `${revLine} L ${x(n - 1).toFixed(1)} ${h - padBottom} L ${x(0).toFixed(1)} ${h - padBottom} Z`;

  // Four gridlines is enough to read a value without becoming graph paper.
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const tickIdx = n <= 1 ? [0] : [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full" role="img" aria-label="Revenue and orders over time">
      {grid.map((g) => {
        const gy = padTop + g * (h - padTop - padBottom);
        return (
          <g key={g}>
            <line x1={padX} x2={w - 12} y1={gy} y2={gy} stroke="#EFEFED" strokeWidth={1} />
            <text x={padX - 8} y={gy + 3} textAnchor="end" fill="#A3A3A3" style={{ fontSize: 9 }}>
              {Math.round(maxRev * (1 - g)).toLocaleString("en-IN")}
            </text>
          </g>
        );
      })}
      <path d={area} fill="#171717" fillOpacity={0.06} />
      <path d={revLine} fill="none" stroke="#171717" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={ordLine}
        fill="none"
        stroke="#2563EB"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {tickIdx.map((i) => (
        <text key={i} x={x(i)} y={h - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fill="#A3A3A3" style={{ fontSize: 9 }}>
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────── dashboard ──────────────────────────────── */

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Either one of the presets, or a hand-picked pair of dates.
  const [range, setRange] = useState<number>(30);
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [pickerError, setPickerError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const s = await adminGetStats();
        if (!active) return;
        setStats(s);
      } catch {
        if (active) setError("Could not load the dashboard. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
      // Secondary sources enrich the page; a failure here leaves the panels in
      // their empty state rather than breaking the dashboard.
      const [a, inv, ord] = await Promise.all([
        adminGetAnalytics().catch(() => null),
        adminListInventory().catch(() => [] as InventoryItem[]),
        adminListOrders().catch(() => [] as AdminOrder[]),
      ]);
      if (!active) return;
      setAnalytics(a);
      setInventory(inv);
      setOrders(ord);
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const revSeries = useMemo(() => (analytics?.revenueByDay ?? []).map((p) => p.value), [analytics]);
  const ordSeries = useMemo(() => (analytics?.ordersByDay ?? []).map((p) => p.count), [analytics]);
  const dayLabels = useMemo(() => (analytics?.revenueByDay ?? []).map((p) => shortDate(p.date)), [analytics]);

  /** Calendar days present in the series, as plain YYYY-MM-DD, for the picker. */
  const dayKeys = useMemo(
    () => (analytics?.revenueByDay ?? []).map((p) => p.date.slice(0, 10)),
    [analytics],
  );

  /**
   * The selected window as [start, end] indices into the daily series. A preset
   * takes the last N days; a custom range takes everything between the two
   * chosen dates. Everything downstream — chart, deltas, sparklines — reads
   * these indices, so both modes behave identically.
   */
  const sel = useMemo(() => {
    const n = revSeries.length;
    if (n === 0) return { start: 0, end: -1 };
    if (custom) {
      let start = dayKeys.findIndex((d) => d >= custom.from);
      if (start === -1) start = n; // range begins after the data ends
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
  }, [revSeries, dayKeys, custom, range]);

  const windowed = useMemo(() => {
    const cut = <T,>(arr: T[]) => (sel.end < sel.start ? [] : arr.slice(sel.start, sel.end + 1));
    return {
      revenue: cut(revSeries),
      orders: cut(ordSeries),
      labels: cut(dayLabels),
    };
  }, [revSeries, ordSeries, dayLabels, sel]);

  /** Stock buckets, straight from the inventory endpoint. */
  const stock = useMemo(() => {
    const live = inventory.filter((i) => i.status === "active").length;
    const low = inventory.filter((i) => i.stock > 0 && i.stock <= 5).length;
    const out = inventory.filter((i) => i.stock === 0).length;
    return { live, low, out };
  }, [inventory]);

  /**
   * Units sold per product, summed from the real order lines in the analytics
   * payload. Stock and price are joined from inventory by title. Line-level
   * revenue isn't exposed by the API, so this deliberately reports units and
   * stock rather than a per-product revenue figure it would have to guess at.
   */
  const topProducts = useMemo(() => {
    const units = new Map<string, number>();
    for (const c of analytics?.customers ?? []) {
      for (const o of c.orderList ?? []) {
        for (const p of o.products ?? []) {
          units.set(p.title, (units.get(p.title) ?? 0) + (p.quantity || 0));
        }
      }
    }
    const byTitle = new Map(inventory.map((i) => [i.title, i]));
    return [...units.entries()]
      .map(([title, sold]) => ({ title, sold, item: byTitle.get(title) }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [analytics, inventory]);

  /** Order id → line-item count, for the Items column. */
  const itemCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) m.set(o.id, o.items.reduce((n, i) => n + i.quantity, 0));
    return m;
  }, [orders]);

  const newCustomers = analytics?.customers.filter((c) => c.orders === 1).length ?? null;
  const returningCustomers = analytics?.customers.filter((c) => c.orders > 1).length ?? null;

  const kpis = stats
    ? [
        {
          label: "Total revenue",
          value: formatCurrency(stats.revenue),
          delta: windowDelta(revSeries, sel.start, sel.end),
          series: windowed.revenue,
          sub: `${stats.orderCount} order${stats.orderCount === 1 ? "" : "s"}`,
          Icon: BagIcon,
          href: "/admin/orders",
        },
        {
          label: "Orders",
          value: String(stats.orderCount),
          delta: windowDelta(ordSeries, sel.start, sel.end),
          series: windowed.orders,
          sub: `${stats.paidCount} paid · ${stats.codCount} COD`,
          Icon: TruckIcon,
          href: "/admin/orders",
        },
        {
          label: "Customers",
          value: String(stats.customerCount),
          delta: null,
          series: [],
          sub: returningCustomers !== null ? `${returningCustomers} returning` : "Signed up",
          Icon: UserIcon,
          href: "/admin/customers",
        },
        {
          label: "Returns",
          value: String(stats.returnCount),
          delta: null,
          series: [],
          sub: `${stats.pendingReturns} pending`,
          Icon: ReturnIcon,
          href: "/admin/returns",
        },
      ]
    : [];

  /* ───────────────────────────── loading ────────────────────────────────── */

  // Shown while the first stats call is in flight — the branded mark rather
  // than anonymous grey blocks.
  if (loading) return <BrandLoader label="Loading your dashboard" />;

  if (error) {
    return (
      <div className="rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 px-4 py-3 text-[0.8125rem] text-[#DC2626]">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-w-0 space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[1.75rem]">
            Dashboard
          </h1>
          <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
            {greeting()} — overview of your store performance.
          </p>
        </div>

        {/* No shrink-0 here: the five pills are wider than a 320px screen, and
            refusing to shrink pushed the whole control — and the picker
            anchored to it — past the viewport edge. It wraps instead. */}
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
              aria-expanded={pickerOpen}
              disabled={dayKeys.length === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                custom
                  ? "bg-[#171717] text-white"
                  : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
              )}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              {custom ? `${labelDay(custom.from)} – ${labelDay(custom.to)}` : "Date range"}
            </button>
          </div>

          {pickerOpen && (
            <>
              {/* Click-away layer, beneath the panel but above the page. */}
              <button
                aria-label="Close date picker"
                onClick={() => setPickerOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              {/* Anchored right on wide screens; on a phone it spans the
                  content width instead, so it can't hang off either edge. */}
              <div className="absolute left-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-lg sm:left-auto sm:right-0">
                <p className="text-[0.8125rem] font-semibold text-[#171717]">Date range</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                      From
                    </span>
                    <input
                      type="date"
                      value={draft.from}
                      min={dayKeys[0]}
                      max={dayKeys[dayKeys.length - 1]}
                      onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                      className="h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[0.8125rem] text-[#171717] focus:border-[#171717] focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                      To
                    </span>
                    <input
                      type="date"
                      value={draft.to}
                      min={dayKeys[0]}
                      max={dayKeys[dayKeys.length - 1]}
                      onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                      className="h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[0.8125rem] text-[#171717] focus:border-[#171717] focus:outline-none"
                    />
                  </label>
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

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-[0_1px_2px_rgba(16,16,16,0.04)] transition-colors hover:border-[#D4D4D4]"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#F5F5F4] text-[#525252]">
                <k.Icon className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-[0.75rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                {k.label}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="truncate text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-[#171717]">
                {k.value}
              </p>
              <Delta value={k.delta} />
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="truncate text-[0.75rem] text-[#737373]">{k.sub}</p>
              {k.series.length > 1 && (
                <div className="w-20 shrink-0">
                  <Sparkline points={k.series} tone={(k.delta ?? 0) >= 0 ? "up" : "down"} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Sales overview + business summary */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <CardHeader
            title="Sales overview"
            action={
              <div className="flex items-center gap-3 text-[0.6875rem] text-[#737373]">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-[#171717]" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-[#2563EB]" /> Orders
                </span>
              </div>
            }
          />
          {windowed.revenue.length === 0 ? (
            <p className="py-16 text-center text-[0.8125rem] text-[#737373]">
              No sales data for this period yet.
            </p>
          ) : (
            <div className="mt-4 min-w-0">
              <SalesChart revenue={windowed.revenue} orders={windowed.orders} labels={windowed.labels} />
            </div>
          )}
        </Card>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Customers" />
            <dl className="mt-3 space-y-2.5 text-[0.8125rem]">
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">Total customers</dt>
                <dd className="font-medium text-[#171717]">{stats.customerCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">One-time buyers</dt>
                <dd className="font-medium text-[#171717]">{newCustomers ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">Returning</dt>
                <dd className="font-medium text-[#171717]">{returningCustomers ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Inventory" />
            <dl className="mt-3 space-y-2.5 text-[0.8125rem]">
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">Products live</dt>
                <dd className="font-medium text-[#171717]">{stock.live || stats.productCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">Low stock</dt>
                <dd className={cn("font-medium", stock.low ? "text-[#D97706]" : "text-[#171717]")}>
                  {stock.low}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#737373]">Out of stock</dt>
                <dd className={cn("font-medium", stock.out ? "text-[#DC2626]" : "text-[#171717]")}>
                  {stock.out}
                </dd>
              </div>
            </dl>
            <Link
              href="/admin/inventory"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E5E5] py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
            >
              Manage inventory <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card>
            <CardHeader title="Active promotion" />
            <p className="mt-2 text-[0.8125rem] text-[#171717]">
              {stats.activeOffer ?? <span className="text-[#737373]">No active offer</span>}
            </p>
            <Link
              href="/admin/offers"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-[#171717] py-2 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90"
            >
              {stats.activeOffer ? "Manage offers" : "Create offer"}
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent orders */}
      <Card padded={false} className="min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-[0.8125rem] font-medium text-[#171717] hover:text-[#2563EB]"
          >
            View all <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="py-14 text-center text-[0.8125rem] text-[#737373]">No orders yet.</p>
        ) : (
          /* The table scrolls inside its card rather than widening the page. */
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left">
                  {["Order", "Customer", "Date", "Items", "Payment", "Status", "Total", ""].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]",
                        h === "Total" && "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[#F0F0EE] last:border-0 transition-colors hover:bg-[#FAFAF9]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#171717]">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#171717]" title={o.customerName || o.email}>
                      {o.customerName || o.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#737373]">{shortDate(o.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#737373]">
                      {itemCount.has(o.id) ? `${itemCount.get(o.id)} item${itemCount.get(o.id) === 1 ? "" : "s"}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#737373]">
                      {o.status === "cod_pending" ? "COD" : "Online"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-[#171717]">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-[#2563EB] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top products + quick actions */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card padded={false} className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5">
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">Top products</h2>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-[0.8125rem] font-medium text-[#171717] hover:text-[#2563EB]"
            >
              All products <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="py-14 text-center text-[0.8125rem] text-[#737373]">
              No sales recorded yet.
            </p>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left">
                    {["Product", "Units sold", "Price", "Stock"].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]",
                          h !== "Product" && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.title} className="border-b border-[#F0F0EE] last:border-0 transition-colors hover:bg-[#FAFAF9]">
                      <td className="max-w-[260px] truncate px-4 py-3 text-[#171717]" title={p.title}>
                        {p.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-[#171717]">
                        {p.sold}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#737373]">
                        {p.item ? formatCurrency(p.item.price, p.item.currency) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {p.item ? (
                          <span
                            className={cn(
                              "tabular-nums",
                              p.item.stock === 0
                                ? "font-medium text-[#DC2626]"
                                : p.item.stock <= 5
                                  ? "font-medium text-[#D97706]"
                                  : "text-[#737373]",
                            )}
                          >
                            {p.item.stock} left
                          </span>
                        ) : (
                          <span className="text-[#A3A3A3]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Quick actions" />
          <div className="mt-3 grid gap-2">
            {[
              { label: "Add product", href: "/admin/products/new", Icon: PlusIcon, primary: true },
              { label: "Create collection", href: "/admin/collections", Icon: LayersIcon },
              { label: "Create offer", href: "/admin/offers", Icon: TagIcon },
              { label: "View orders", href: "/admin/orders", Icon: TruckIcon },
              { label: "Manage inventory", href: "/admin/inventory", Icon: BoxIcon },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors",
                  a.primary
                    ? "bg-[#171717] text-white hover:opacity-90"
                    : "border border-[#E5E5E5] text-[#171717] hover:bg-[#F5F5F4]",
                )}
              >
                <a.Icon className="h-4 w-4 shrink-0" />
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
