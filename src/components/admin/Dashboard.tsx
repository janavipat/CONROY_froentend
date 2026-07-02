"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminGetStats, type AdminStats } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import {
  BagIcon,
  TruckIcon,
  UserIcon,
  ReturnIcon,
  StarIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Animates a number from 0 → target with an ease-out curve. */
function CountUp({ target, format }: { target: number; format?: (n: number) => string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{format ? format(val) : val}</>;
}

function statusBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", cls: "bg-green-600 text-white" };
    case "cod_pending":
      return { text: "COD", cls: "bg-amber-500 text-white" };
    case "cancelled":
      return { text: "Cancelled", cls: "bg-accent text-white" };
    default:
      return { text: status, cls: "bg-mist text-ink-soft" };
  }
}

export function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const s = await adminGetStats();
        if (active) setStats(s);
      } catch {
        if (active) setError("Could not load dashboard. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const cards = stats
    ? [
        {
          label: "Revenue",
          target: stats.revenue,
          format: (n: number) => formatCurrency(n),
          sub: `${stats.orderCount} order${stats.orderCount === 1 ? "" : "s"}`,
          Icon: BagIcon,
          href: "/admin/orders",
        },
        {
          label: "Orders",
          target: stats.orderCount,
          sub: `${stats.paidCount} paid · ${stats.codCount} COD`,
          Icon: TruckIcon,
          href: "/admin/orders",
        },
        {
          label: "Customers",
          target: stats.customerCount,
          sub: "Signed up",
          Icon: UserIcon,
          href: "/admin/customers",
        },
        {
          label: "Returns",
          target: stats.returnCount,
          sub: `${stats.pendingReturns} pending`,
          Icon: ReturnIcon,
          href: "/admin/returns",
        },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-stone">An overview of your store.</p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        // Shimmer skeletons
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-media border border-line bg-white" />
          ))}
        </div>
      ) : (
        stats && (
          <>
            {/* Stat cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={c.href}
                    className="group block rounded-media border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-sage text-ink transition-colors group-hover:bg-ink group-hover:text-white">
                        <c.Icon className="h-5 w-5" />
                      </span>
                      <ArrowRightIcon className="h-4 w-4 -translate-x-1 text-stone opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-4 font-display text-3xl text-ink">
                      <CountUp target={c.target} format={c.format} />
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">{c.label}</p>
                    <p className="text-xs text-stone">{c.sub}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Secondary row */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
              {/* Recent orders */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-media border border-line bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg text-ink">Recent orders</h2>
                  <Link href="/admin/orders" className="text-xs text-ink-soft hover:text-ink">
                    View all →
                  </Link>
                </div>
                {stats.recentOrders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-stone">No orders yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {stats.recentOrders.map((o, i) => {
                      const b = statusBadge(o.status);
                      return (
                        <motion.li
                          key={o.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-ink">{o.customerName || o.email}</p>
                            <p className="text-xs text-stone">
                              #{o.id.slice(0, 8).toUpperCase()} · {formatDate(o.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", b.cls)}>
                              {b.text}
                            </span>
                            <span className="text-sm font-medium text-ink">{formatCurrency(o.total)}</span>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>

              {/* Side panel */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="rounded-media border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-mist text-ink">
                      <BagIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-2xl text-ink">
                        <CountUp target={stats.productCount} />
                      </p>
                      <p className="text-xs text-stone">Products live</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/products"
                    className="mt-4 block rounded-md border border-line py-2 text-center text-sm text-ink transition-colors hover:bg-mist"
                  >
                    Manage products
                  </Link>
                </div>

                <div className="rounded-media border border-line bg-white p-5">
                  <div className="flex items-center gap-2">
                    <StarIcon className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-medium text-ink">Active offer</h3>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {stats.activeOffer ? (
                      <span className="font-medium text-ink">{stats.activeOffer}</span>
                    ) : (
                      "No active offer"
                    )}
                  </p>
                  <Link
                    href="/admin/offers"
                    className="mt-4 block rounded-md bg-ink py-2 text-center text-sm text-white transition-opacity hover:opacity-90"
                  >
                    {stats.activeOffer ? "Manage offers" : "Create an offer"}
                  </Link>
                </div>
              </motion.div>
            </div>
          </>
        )
      )}
    </div>
  );
}
