"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminListReturns,
  adminUpdateReturnStatus,
  adminBulkUpdateReturnStatus,
  adminDeleteReturn,
  type AdminReturn,
  type AdminReturnStatus,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { Loader } from "@/components/ui/Loader";

const STATUSES: AdminReturnStatus[] = [
  "requested",
  "approved",
  "rejected",
  "refunded",
  "replaced",
  "completed",
];

function statusCls(status: AdminReturnStatus): string {
  switch (status) {
    case "requested":
      return "bg-amber-100 text-amber-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-emerald-100 text-emerald-700"; // refunded / replaced / completed
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function returnTotal(r: AdminReturn): number {
  return r.items.reduce((s, it) => s + it.price * it.quantity, 0);
}

export function ReturnsTable() {
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | AdminReturnStatus>("all");
  const [query, setQuery] = useState("");
  const [bulkStatus, setBulkStatus] = useState<AdminReturnStatus>("approved");
  const headerCbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    adminListReturns()
      .then((r) => active && (setReturns(r), setLoading(false)))
      .catch(
        () =>
          active &&
          (setError("Could not load returns. (Run returns.sql and start the backend.)"), setLoading(false)),
      );
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return returns.filter((r) => {
      const matchesF = filter === "all" || r.status === filter;
      const matchesQ =
        !q ||
        r.orderRef.toLowerCase().includes(q) ||
        (r.customerName ?? "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      return matchesF && matchesQ;
    });
  }, [returns, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: returns.length };
    for (const s of STATUSES) c[s] = 0;
    for (const r of returns) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [returns]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someChecked = filtered.some((r) => selected.has(r.id));
  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = someChecked && !allChecked;
  }, [someChecked, allChecked]);

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function withSaving(ids: string[], on: boolean) {
    setSavingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  async function changeStatus(id: string, status: AdminReturnStatus) {
    const prev = returns;
    withSaving([id], true);
    setReturns((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await adminUpdateReturnStatus(id, status);
    } catch {
      setReturns(prev);
      setError("Could not update the return status. Please retry.");
    } finally {
      withSaving([id], false);
    }
  }

  async function bulkApply(status: AdminReturnStatus) {
    const ids = filtered.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (ids.length === 0) return;
    const prev = returns;
    withSaving(ids, true);
    setReturns((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, status } : r)));
    try {
      const res = await adminBulkUpdateReturnStatus(ids, status);
      if (!res.ok) {
        setReturns(prev);
        setError(`Updated ${res.updated}, ${res.failed} failed. Please retry.`);
      } else {
        setSelected(new Set());
      }
    } catch {
      setReturns(prev);
      setError("Bulk update failed. Please retry.");
    } finally {
      withSaving(ids, false);
    }
  }

  async function removeReturn(id: string) {
    if (!window.confirm("Delete this return request? This cannot be undone.")) return;
    const prev = returns;
    setReturns((rs) => rs.filter((r) => r.id !== id));
    setSelected((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    try {
      await adminDeleteReturn(id);
    } catch {
      setReturns(prev);
      setError("Could not delete the return. Please retry.");
    }
  }

  const selectedCount = filtered.filter((r) => selected.has(r.id)).length;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Returns</h1>
        <p className="mt-1 text-sm text-stone">
          {loading ? "Loading…" : `${returns.length} return request${returns.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Filters + search */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === s ? "bg-ink text-white" : "bg-mist text-ink-soft hover:text-ink",
              )}
            >
              {s} <span className="opacity-60">({counts[s] ?? 0})</span>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order, customer, reason…"
          className="w-60 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-stone focus:border-ink"
        />
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-ink/20 bg-mist/60 px-4 py-2.5">
          <span className="text-sm font-medium text-ink">{selectedCount} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => bulkApply("approved")}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <CheckIcon className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={() => bulkApply("rejected")}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              <CloseIcon className="h-3.5 w-3.5" /> Reject
            </button>
            <span className="mx-1 h-5 w-px bg-line" />
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as AdminReturnStatus)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs capitalize text-ink focus:border-ink focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => bulkApply(bulkStatus)}
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink"
            >
              Apply to {selectedCount}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md px-2 py-1.5 text-xs text-stone transition-colors hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <Loader size="sm" label="" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-media border border-line bg-white py-16 text-center text-stone">
          {returns.length === 0 ? "No return requests yet." : "No returns match your filters."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-media border border-line bg-white">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone">
                <th className="w-10 py-3 pl-4 pr-2">
                  <input
                    ref={headerCbRef}
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-ink"
                    aria-label="Select all"
                  />
                </th>
                <th className="py-3 pr-3 font-medium">Order</th>
                <th className="py-3 pr-3 font-medium">Customer</th>
                <th className="py-3 pr-3 font-medium">Items</th>
                <th className="py-3 pr-3 font-medium">Reason</th>
                <th className="py-3 pr-3 font-medium">Type</th>
                <th className="py-3 pr-3 text-right font-medium">Amount</th>
                <th className="py-3 pr-3 font-medium">Date</th>
                <th className="py-3 pr-3 font-medium">Stage</th>
                <th className="w-10 py-3 pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => {
                const checked = selected.has(r.id);
                const saving = savingIds.has(r.id);
                return (
                  <tr key={r.id} className={cn("align-top transition-colors", checked && "bg-mist/40")}>
                    <td className="py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(r.id)}
                        className="mt-0.5 h-4 w-4 accent-ink"
                        aria-label={`Select return for order ${r.orderRef}`}
                      />
                    </td>
                    <td className="py-3 pr-3 font-medium text-ink">#{r.orderRef}</td>
                    <td className="py-3 pr-3">
                      <span className="block text-ink">{r.customerName || "—"}</span>
                      <span className="block text-xs text-stone">{r.phone || r.email}</span>
                    </td>
                    <td className="max-w-[220px] py-3 pr-3">
                      <ul className="space-y-0.5">
                        {r.items.map((it, i) => (
                          <li key={i} className="truncate text-ink-soft">
                            {it.title}
                            <span className="text-stone">
                              {" "}
                              · {it.size} × {it.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="max-w-[160px] py-3 pr-3 text-ink-soft">{r.reason}</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-mist px-2 py-0.5 text-xs capitalize text-ink-soft">
                        {r.resolution}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-medium text-ink">
                      {formatCurrency(returnTotal(r))}
                    </td>
                    <td className="py-3 pr-3 text-stone">{formatDate(r.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            statusCls(r.status),
                          )}
                        >
                          {r.status}
                        </span>
                        <select
                          value={r.status}
                          disabled={saving}
                          onChange={(e) => changeStatus(r.id, e.target.value as AdminReturnStatus)}
                          className="rounded-md border border-line bg-white px-2 py-1 text-xs capitalize text-ink focus:border-ink focus:outline-none disabled:opacity-50"
                          aria-label="Update stage"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                        {saving && (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-ink" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => removeReturn(r.id)}
                        aria-label="Delete return"
                        className="grid h-7 w-7 place-items-center rounded-md border border-line text-stone transition-colors hover:border-accent hover:text-accent"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
