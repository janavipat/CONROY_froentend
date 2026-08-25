"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminOrder } from "@/services/admin";
import {
  adminListOrders,
  adminDeleteOrder,
  adminCreateShipment,
  adminDrainShipmentJobs,
  adminListDeletedOrders,
  adminRestoreOrder,
  adminPurgeOrder,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { printPackingSlips } from "@/lib/packing-slip";
import { cn } from "@/utils/cn";
import { SearchIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { Loader } from "@/components/ui/Loader";
import { StatusBadge, CountUp, ConfirmDialog } from "./ui";

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

function methodLabel(m: string): string {
  const k = (m || "").toLowerCase();
  if (k.includes("cod") || k.includes("cash")) return "Cash on Delivery";
  if (k.includes("razor")) return "Razorpay";
  if (!m) return "—";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

const itemCount = (o: AdminOrder) => o.items.reduce((s, it) => s + it.quantity, 0);

/**
 * The status pill. Was a grey chip with a coloured dot: the colour carried no
 * weight, and "Payment pending" wrapped onto two lines inside it, which made
 * every row of the table taller than it needed to be. StatusBadge is the same
 * pill used on the dashboard and order detail — tinted by meaning, and set to
 * never wrap.
 */
function Badge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

type Filter = "all" | "paid" | "cod_pending" | "cancelled" | "deleted";

export function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  /** The order awaiting confirmation. Nothing is sent until it is confirmed. */
  const [pending, setPending] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  /** Deleted Orders is its own list — a soft-deleted order is not in `orders`. */
  const [deletedOrders, setDeletedOrders] = useState<AdminOrder[]>([]);
  const [softDeleteReady, setSoftDeleteReady] = useState(true);
  /** The order awaiting confirmation of PERMANENT removal. */
  const [purging, setPurging] = useState<AdminOrder | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shipping, setShipping] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const loadDeleted = useCallback(async () => {
    try {
      const { orders: rows, available } = await adminListDeletedOrders();
      setDeletedOrders(rows);
      setSoftDeleteReady(available);
    } catch {
      setError("Could not load deleted orders.");
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setOrders(await adminListOrders());
    } catch {
      setError("Could not load orders. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Turns the shipment queue over once when the panel opens. The attempt fired
   * at checkout is not awaited and dies with that function, and the cron only
   * runs daily — so without this a stalled order waits hours to be retried.
   * Promise chain, not await: setState in an effect body cascades renders.
   */
  useEffect(() => {
    let active = true;
    adminDrainShipmentJobs()
      .then((processed) => {
        if (active && processed > 0) void load();
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [load]);

  // Promise chain rather than awaiting loadDeleted: setState directly in an
  // effect body cascades renders, which react-hooks/set-state-in-effect rejects.
  useEffect(() => {
    let active = true;
    adminListDeletedOrders()
      .then(({ orders: rows, available }) => {
        if (!active) return;
        setDeletedOrders(rows);
        setSoftDeleteReady(available);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Promise chain rather than `await load()`: setState in an effect body
  // triggers cascading renders, which react-hooks/set-state-in-effect rejects.
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

  /** Books the courier for an order the automatic job never managed to. */
  async function ship(order: AdminOrder) {
    if (shipping) return;
    setShipping(order.id);
    setError("");
    setNotice("");
    try {
      const { waybill } = await adminCreateShipment(order.id);
      setNotice(
        waybill
          ? `Order #${order.id.slice(0, 8).toUpperCase()} is with Delhivery — waybill ${waybill}.`
          : `Order #${order.id.slice(0, 8).toUpperCase()} was sent to Delhivery.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the shipment.");
    } finally {
      setShipping(null);
    }
  }

  async function confirmDelete() {
    if (!pending || deleting) return; // guards a double-click on Delete
    const order = pending;
    setDeleting(order.id);
    setError("");
    try {
      await adminDeleteOrder(order.id);
      setPending(null);
      void loadDeleted();
      // Drop it straight away, then refetch so the list and its totals match
      // the server rather than this component’s guess.
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
      await load();
    } catch (err) {
      // The dialog closes either way — the reason Delhivery gave belongs on
      // the page, where it stays readable instead of vanishing with the overlay.
      setPending(null);
      setError(err instanceof Error ? err.message : "Could not delete this order.");
    } finally {
      setDeleting(null);
    }
  }

  async function restore(order: AdminOrder) {
    if (busyId) return;
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      await adminRestoreOrder(order.id);
      setDeletedOrders((prev) => prev.filter((o) => o.id !== order.id));
      setNotice(`Order #${order.id.slice(0, 8).toUpperCase()} restored.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore this order.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmPurge() {
    if (!purging || busyId) return; // guards a double-click
    const order = purging;
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      await adminPurgeOrder(order.id);
      setPurging(null);
      setDeletedOrders((prev) => prev.filter((o) => o.id !== order.id));
      setNotice(`Order #${order.id.slice(0, 8).toUpperCase()} permanently deleted.`);
    } catch (err) {
      setPurging(null);
      setError(err instanceof Error ? err.message : "Could not permanently delete this order.");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      orders: orders.length,
      items: orders.reduce((s, o) => s + itemCount(o), 0),
      sales: live.reduce((s, o) => s + o.subtotal, 0),
      paid: orders.filter((o) => o.status === "paid").length,
    };
  }, [orders]);

  const viewingDeleted = filter === "deleted";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = filter === "deleted" ? deletedOrders : orders;
    return source.filter((o) => {
      if (filter !== "all" && filter !== "deleted" && o.status !== filter) return false;
      if (!q) return true;
      return [o.id, o.customerName, o.email, o.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, deletedOrders, query, filter]);

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
    { key: "deleted", label: "Deleted orders" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>
      </div>

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-2 divide-line rounded-media border border-line bg-white sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Orders", value: stats.orders },
          { label: "Items ordered", value: stats.items },
          { label: "Total sales", value: stats.sales, currency: true },
          { label: "Paid orders", value: stats.paid },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-xs text-stone">{s.label}</p>
            {/* Counts up once the figures arrive. Keyed on the value so the run
                starts when the data lands, not while the table is still empty. */}
            <p className="mt-1 font-display text-xl tabular-nums text-ink">
              <CountUp
                key={s.label + s.value}
                value={s.value}
                format={s.currency ? (n) => formatCurrency(n) : undefined}
              />
            </p>
          </div>
        ))}
      </div>

      {viewingDeleted && !softDeleteReady && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          Deleted Orders needs a database change that hasn’t been applied yet — run
          supabase/soft-delete-orders.sql. Until then, Delete is unavailable.
        </p>
      )}

      {notice && (
        <p className="mt-6 rounded-md border border-line bg-mist/60 px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      )}

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
                    {/* The box stays 16px; the label around it carries the
                        touch area. A bare 16px checkbox is a poor target on a
                        phone, and the negative margin means the padding costs
                        the row no height. */}
                    <label className="-m-2.5 inline-flex cursor-pointer p-2.5">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-ink"
                        aria-label="Select all"
                      />
                    </label>
                  </th>
                  <th className="px-3 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Payment status</th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">Delhivery</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="w-44 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => {
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
                        <label className="-m-2.5 inline-flex cursor-pointer p-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(o.id)}
                            onChange={() => toggle(o.id)}
                            className="h-4 w-4 accent-ink"
                            aria-label={`Select order ${o.id}`}
                          />
                        </label>
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
                        <Badge status={o.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                        {methodLabel(o.paymentMethod)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {o.waybill ? (
                          <span className="font-mono text-xs text-ink-soft">{o.waybill}</span>
                        ) : cancelled ? (
                          <span className="text-xs text-stone">—</span>
                        ) : (
                          <span
                            title={o.shipmentError ?? "No Delhivery shipment for this order yet."}
                            className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                          >
                            Not synced
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">
                        {itemCount(o)} item{itemCount(o) === 1 ? "" : "s"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {viewingDeleted && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void restore(o);
                                }}
                                disabled={busyId !== null}
                                className="rounded-md border border-line px-2.5 py-1 text-xs text-ink transition-colors hover:border-ink disabled:opacity-50"
                              >
                                {busyId === o.id ? "…" : "Restore"}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPurging(o);
                                }}
                                disabled={busyId !== null}
                                className="rounded-md border border-accent/40 px-2.5 py-1 text-xs text-accent transition-colors hover:border-accent disabled:opacity-50"
                              >
                                Delete forever
                              </button>
                            </>
                          )}
                          {!viewingDeleted &&
                            ["Pending", "Confirmed", "Processing", "Packed"].includes(
                              o.fulfillmentStatus,
                            ) &&
                            !cancelled && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void ship(o);
                                }}
                                disabled={shipping !== null}
                                aria-label={`Create Delhivery shipment for order ${o.id
                                  .slice(0, 8)
                                  .toUpperCase()}`}
                                className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
                              >
                                {shipping === o.id ? "…" : "Ship"}
                              </button>
                            )}
                          {!viewingDeleted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPending(o);
                              }}
                              disabled={deleting === o.id}
                              aria-label={`Delete order ${o.id.slice(0, 8).toUpperCase()}`}
                              className="rounded-md border border-line px-2.5 py-1 text-xs text-accent transition-colors hover:border-accent disabled:opacity-50"
                            >
                              {deleting === o.id ? "…" : "Delete"}
                            </button>
                          )}
                          <ChevronRightIcon className="h-4 w-4 text-stone" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Names the order that is about to go, so the wrong row cannot be
          deleted from muscle memory, and states the Delhivery consequence. */}
      <ConfirmDialog
        open={pending !== null}
        busy={deleting !== null}
        title="Delete this order?"
        description="It moves to Deleted Orders, where it can be restored. Any Delhivery shipment is cancelled first — if the courier refuses, the order is left untouched."
        confirmLabel="Move to Deleted"
        detail={
          pending && (
            <span className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                #{pending.id.slice(0, 8).toUpperCase()} · {pending.customerName || pending.email}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                {formatCurrency(pending.subtotal, pending.currency)} · {itemCount(pending)} item
                {itemCount(pending) === 1 ? "" : "s"} · {methodLabel(pending.paymentMethod)}
              </span>
            </span>
          )
        }
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />

      {/* Separate dialog: this one really is irreversible. */}
      <ConfirmDialog
        open={purging !== null}
        busy={busyId !== null}
        title="Permanently delete this order?"
        description="The order and its items, shipment record and cancellation history are removed for good. This cannot be undone."
        confirmLabel="Delete forever"
        detail={
          purging && (
            <span className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                #{purging.id.slice(0, 8).toUpperCase()} · {purging.customerName || purging.email}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                {formatCurrency(purging.subtotal, purging.currency)} · {itemCount(purging)} item
                {itemCount(purging) === 1 ? "" : "s"} · {methodLabel(purging.paymentMethod)}
              </span>
            </span>
          )
        }
        onConfirm={confirmPurge}
        onCancel={() => setPurging(null)}
      />
    </div>
  );
}
