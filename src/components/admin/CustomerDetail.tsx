"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminGetCustomerActivity,
  adminListCustomers,
  adminListOrders,
  adminListReturns,
  type AdminCustomer,
  type AdminOrder,
  type AdminReturn,
  type CustomerActivity,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { Loader } from "@/components/ui/Loader";
import { StatusBadge, ReturnStageBadge } from "./ui";

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

/** "03:25 PM" — the day is already the group heading, so the date is dropped. */
function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** "8 Aug 2026, 03:25 PM" — for rows that stand outside a day grouping. */
function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** "2 min 35 sec" — spelled out rather than mm:ss, which reads as a clock. */
function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  if (min === 0) return `${sec} sec`;
  return sec === 0 ? `${min} min` : `${min} min ${sec} sec`;
}

/** Groups records under a date heading, newest day first. */
function groupByDay<T extends { at: string }>(rows: T[]): [string, T[]][] {
  const buckets = new Map<string, T[]>();
  for (const r of rows) {
    const key = formatDate(r.at);
    const list = buckets.get(key);
    if (list) list.push(r);
    else buckets.set(key, [r]);
  }
  return [...buckets.entries()];
}

/* ── Shared panel chrome ─────────────────────────────────────────────────── */

function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-5 py-3">
        <h2 className="font-display text-[1.0625rem] leading-none text-ink">{title}</h2>
        {meta && <span className="shrink-0 text-[0.75rem] text-[#737373]">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** Empty states were a twelve-rem block of nothing; one quiet line is enough. */
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-[0.8125rem] text-stone">{children}</p>;
}

/** A day heading inside the activity feeds. */
function DayHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="sticky top-0 z-10 border-b border-[#F0F0EE] bg-[#FAFAF9] px-5 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
      {children}
    </p>
  );
}

/** Product thumbnail used by both the cart and the add-to-cart history. */
function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <span className="h-12 w-10 shrink-0 overflow-hidden rounded bg-mist">
      {src && (
        // A customer's cart image can come from any host the catalogue used, so
        // next/image (three allowed domains) would reject some of them.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      )}
    </span>
  );
}

/* The long feeds scroll inside themselves. Website activity alone ran to
   1,674px on a real customer, which pushed everything below it off the page. */
const feedScroll =
  "max-h-[380px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5";

export function CustomerDetail({ phone }: { phone: string }) {
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [activity, setActivity] = useState<CustomerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const [custs, allOrders, allReturns, act] = await Promise.all([
          adminListCustomers(),
          adminListOrders(),
          adminListReturns(),
          // Activity is best-effort: a customer with none must still render.
          adminGetCustomerActivity(phone).catch(() => null),
        ]);
        if (!active) return;
        setCustomer(custs.find((c) => c.phone === phone) ?? null);
        // Newest order first.
        setOrders(
          allOrders
            .filter((o) => o.phone === phone)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
        );
        setReturns(allReturns.filter((r) => r.phone === phone));
        setActivity(act);
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

  const cartUnits = activity?.cart.reduce((s, c) => s + c.quantity, 0) ?? 0;
  const cartValue = activity?.cart.reduce((s, c) => s + (c.price ?? 0) * c.quantity, 0) ?? 0;

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-[0.8125rem] text-stone transition-colors hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Customers
      </Link>

      {error && (
        <p className="mt-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-4 grid place-items-center rounded-xl border border-[#E5E5E5] bg-white py-20">
          <Loader size="sm" label="" />
        </div>
      ) : (
        <div className="mt-3 space-y-5">
          {/* ── Profile ─────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(16,16,16,0.04)]">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-base font-medium text-white">
                {(name || phone).trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-xl leading-tight text-ink sm:text-2xl">{phone}</h1>
                <p className="mt-0.5 truncate text-[0.8125rem] text-stone">
                  {email || "No email on file"}
                </p>
                {customer && (
                  <p className="text-[0.75rem] text-[#A3A3A3]">
                    Joined {formatDate(customer.joinedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Stats sit beside the identity on a wide screen and drop under it
                on a narrow one, rather than always taking a row of their own. */}
            <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:w-auto">
              {[
                { l: "Orders", v: String(orders.length) },
                { l: "Total spent", v: formatCurrency(totalSpent) },
                { l: "Returns", v: String(returns.length) },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-center sm:min-w-[116px]"
                >
                  <p className="font-display text-lg leading-tight tabular-nums text-ink">{s.v}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-[#737373]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Two columns on desktop: the page ran to 3,538px as one stack. */}
          <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
            <div className="min-w-0 space-y-5">
              {/* ── Orders ──────────────────────────────────────────────── */}
              <Panel
                title="Orders"
                meta={orders.length > 0 ? `${orders.length} total` : undefined}
              >
                {orders.length === 0 ? (
                  <Empty>No orders from this customer.</Empty>
                ) : (
                  <ul className={cn("divide-y divide-[#F0F0EE]", feedScroll)}>
                    {orders.map((o) => {
                      const total = o.total ?? o.subtotal - (o.discount ?? 0);
                      const itemCount = o.items.reduce((s, it) => s + it.quantity, 0);
                      return (
                        <li key={o.id}>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[#FAFAF9]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[0.8125rem] font-medium text-ink">
                                #{o.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="mt-0.5 truncate text-[0.75rem] text-[#737373]">
                                {formatDate(o.createdAt)} · {itemCount} item
                                {itemCount === 1 ? "" : "s"} ·{" "}
                                {o.paymentMethod === "cod" ? "COD" : "Online"}
                              </p>
                            </div>
                            {/* The same badge the Orders table and order detail
                                use, rather than a second colour scheme. */}
                            <StatusBadge status={o.status} />
                            <span className="w-[84px] shrink-0 text-right text-[0.8125rem] font-medium tabular-nums text-ink">
                              {formatCurrency(total)}
                            </span>
                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#D4D4D4] transition-colors group-hover:text-ink" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>

              {/* ── Returns ─────────────────────────────────────────────── */}
              {returns.length > 0 && (
                <Panel title="Returns" meta={`${returns.length} total`}>
                  <ul className="divide-y divide-[#F0F0EE]">
                    {returns.map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8125rem] font-medium text-ink">#{r.orderRef}</p>
                          <p className="mt-0.5 truncate text-[0.75rem] text-[#737373]">
                            {r.resolution} · {r.reason} · {formatDate(r.createdAt)}
                          </p>
                        </div>
                        <ReturnStageBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              {/* ── Cart ────────────────────────────────────────────────── */}
              <Panel
                title="Cart"
                meta={
                  cartUnits > 0
                    ? `${cartUnits} item${cartUnits === 1 ? "" : "s"} · ${formatCurrency(cartValue)}`
                    : "Live"
                }
              >
                {!activity || activity.cart.length === 0 ? (
                  <Empty>
                    {activity && !activity.cartTableReady
                      ? "Run supabase/customer-cart.sql to mirror the customer's live cart."
                      : "Cart is empty."}
                  </Empty>
                ) : (
                  <ul className={cn("divide-y divide-[#F0F0EE]", feedScroll)}>
                    {activity.cart.map((c, i) => (
                      <li
                        key={`${c.handle}-${c.size}-${i}`}
                        className="flex items-center gap-3 px-5 py-2.5"
                      >
                        <Thumb src={c.image} alt={c.title} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8125rem] text-ink">{c.title}</p>
                          <p className="mt-0.5 text-[0.75rem] text-[#737373]">
                            {c.size ? `Size ${c.size} · ` : ""}Qty {c.quantity}
                          </p>
                          <p className="text-[0.6875rem] text-[#A3A3A3]">
                            Updated {formatDateTime(c.at)}
                          </p>
                        </div>
                        {c.price != null && (
                          <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-ink">
                            {formatCurrency(c.price * c.quantity, c.currency)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="min-w-0 space-y-5">
              {/* ── Website activity ────────────────────────────────────── */}
              <Panel
                title="Website activity"
                meta={
                  activity && activity.pageViews.length > 0
                    ? `${activity.pageViews.length} page view${activity.pageViews.length === 1 ? "" : "s"}`
                    : undefined
                }
              >
                {!activity || activity.pageViews.length === 0 ? (
                  <Empty>
                    {activity && !activity.migrationApplied
                      ? "Run supabase/customer-activity.sql to start recording page activity."
                      : "No page activity yet. It is captured while the customer is signed in."}
                  </Empty>
                ) : (
                  <div className={feedScroll}>
                    {groupByDay(activity.pageViews).map(([day, rows]) => (
                      <div key={day}>
                        <DayHeading>{day}</DayHeading>
                        <ul className="divide-y divide-[#F0F0EE]">
                          {rows.map((v, i) => (
                            <li
                              key={`${v.at}-${i}`}
                              className="flex items-center gap-3 px-5 py-2"
                            >
                              <span className="w-[68px] shrink-0 tabular-nums text-[0.75rem] text-[#A3A3A3]">
                                {formatTime(v.at)}
                              </span>
                              <span
                                className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink"
                                title={v.label}
                              >
                                {v.label}
                              </span>
                              <span className="shrink-0 whitespace-nowrap tabular-nums text-[0.75rem] text-[#737373]">
                                {formatDuration(v.durationMs)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* ── Add-to-cart history ─────────────────────────────────── */}
              <Panel
                title="Add-to-cart history"
                meta={
                  activity && activity.cartAdds.length > 0
                    ? `${activity.cartAdds.length} add${activity.cartAdds.length === 1 ? "" : "s"}`
                    : undefined
                }
              >
                {!activity || activity.cartAdds.length === 0 ? (
                  <Empty>
                    {activity && !activity.migrationApplied
                      ? "Run supabase/customer-activity.sql to start recording cart activity."
                      : "Nothing added to the cart yet."}
                  </Empty>
                ) : (
                  <div className={feedScroll}>
                    {groupByDay(activity.cartAdds).map(([day, rows]) => (
                      <div key={day}>
                        <DayHeading>{day}</DayHeading>
                        <ul className="divide-y divide-[#F0F0EE]">
                          {rows.map((c, i) => (
                            <li
                              key={`${c.at}-${i}`}
                              className="flex items-center gap-3 px-5 py-2.5"
                            >
                              <Thumb src={c.image} alt={c.title} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[0.8125rem] text-ink">{c.title}</p>
                                <p className="mt-0.5 text-[0.75rem] text-[#737373]">
                                  {c.size ? `Size ${c.size} · ` : ""}Qty {c.quantity}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                {c.price != null && (
                                  <p className="text-[0.8125rem] font-medium tabular-nums text-ink">
                                    {formatCurrency(c.price * c.quantity, c.currency)}
                                  </p>
                                )}
                                <p className="mt-0.5 tabular-nums text-[0.6875rem] text-[#A3A3A3]">
                                  {formatTime(c.at)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
