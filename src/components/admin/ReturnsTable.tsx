"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  adminListReturns,
  adminUpdateReturnStatus,
  adminBulkUpdateReturnStatus,
  adminDeleteReturn,
  type AdminReturn,
  type AdminReturnStatus,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import {
  CheckIcon,
  CloseIcon,
  ReturnIcon,
  ClockIcon,
  BoxIcon,
  ReceiptIcon,
  SearchIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { Card, BrandLoader, CountUp } from "./ui";

const STATUSES: AdminReturnStatus[] = [
  "requested",
  "approved",
  "rejected",
  "refunded",
  "replaced",
  "completed",
];

/**
 * Return stage → colour, in the same language as the order badges: amber while
 * it's waiting on someone, blue while it's moving, red when refused, green when
 * settled.
 */
const STAGE: Record<AdminReturnStatus, string> = {
  requested: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20",
  approved: "bg-[#2563EB]/10 text-[#2563EB] ring-[#2563EB]/20",
  rejected: "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20",
  refunded: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20",
  replaced: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20",
  completed: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20",
};

function StageBadge({ status }: { status: AdminReturnStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.6875rem] font-medium capitalize ring-1 ring-inset",
        STAGE[status],
      )}
    >
      {status}
    </span>
  );
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

/**
 * Which moves make sense from here.
 *
 * Only transitions the status enum actually supports — there is no "received"
 * stage in the data, so no button pretends there is. A finished or refused
 * return offers nothing further.
 */
function nextActions(r: AdminReturn): { label: string; to: AdminReturnStatus; kind: "primary" | "danger" | "ghost" }[] {
  switch (r.status) {
    case "requested":
      return [
        { label: "Approve return", to: "approved", kind: "primary" },
        { label: "Reject", to: "rejected", kind: "danger" },
      ];
    case "approved":
      return r.resolution === "replacement"
        ? [
            { label: "Mark replaced", to: "replaced", kind: "primary" },
            { label: "Reject", to: "rejected", kind: "danger" },
          ]
        : [
            { label: "Issue refund", to: "refunded", kind: "primary" },
            { label: "Reject", to: "rejected", kind: "danger" },
          ];
    case "refunded":
    case "replaced":
      return [{ label: "Mark completed", to: "completed", kind: "ghost" }];
    default:
      return [];
  }
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const headerCbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    adminListReturns()
      .then((r) => active && (setReturns(r), setLoading(false)))
      .catch(
        () =>
          active &&
          (setError("Could not load returns. (Run returns.sql and start the backend.)"),
          setLoading(false)),
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

  /** Summary figures, all derived from the real list — zero when it's empty. */
  const summary = useMemo(
    () => [
      { label: "Total returns", value: returns.length, note: "All time", Icon: ReturnIcon, tone: "" },
      {
        label: "Pending",
        value: counts.requested ?? 0,
        note: "Awaiting review",
        Icon: ClockIcon,
        tone: (counts.requested ?? 0) > 0 ? "text-[#B45309]" : "",
      },
      {
        label: "Approved",
        value: counts.approved ?? 0,
        note: "In progress",
        Icon: CheckIcon,
        tone: "",
      },
      {
        label: "Refunded",
        value: counts.refunded ?? 0,
        note: "Money returned",
        Icon: ReceiptIcon,
        tone: (counts.refunded ?? 0) > 0 ? "text-[#16803C]" : "",
      },
      {
        label: "Replacements",
        value: returns.filter((r) => r.resolution === "replacement").length,
        note: "Requested",
        Icon: BoxIcon,
        tone: "",
      },
    ],
    [returns, counts],
  );

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

  /** The panel shown when a row is opened — same markup on mobile and desktop. */
  function Detail({ r }: { r: AdminReturn }) {
    const saving = savingIds.has(r.id);
    const actions = nextActions(r);
    return (
      <div className="border-t border-[#E5E5E5] bg-[#FAFAF9] px-4 py-4 sm:px-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                Items
              </p>
              <ul className="mt-1.5 space-y-1">
                {r.items.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                    <span className="min-w-0 truncate text-[#171717]" title={it.title}>
                      {it.title}
                      <span className="text-[#737373]">
                        {" "}
                        · {it.size} × {it.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[#171717]">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
                Reason
              </p>
              <p className="mt-1 break-words text-[0.8125rem] text-[#171717]">{r.reason || "—"}</p>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <dl className="space-y-1.5 text-[0.8125rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#737373]">Order</dt>
                <dd>
                  <Link href={`/admin/orders/${r.orderId}`} className="text-[#2563EB] hover:underline">
                    #{r.orderRef}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#737373]">Requested</dt>
                <dd className="text-[#171717]">{formatDate(r.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#737373]">Resolution</dt>
                <dd className="capitalize text-[#171717]">{r.resolution}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#737373]">Amount</dt>
                <dd className="font-medium tabular-nums text-[#171717]">
                  {formatCurrency(returnTotal(r))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#737373]">Contact</dt>
                <dd className="min-w-0 truncate text-[#171717]">{r.phone || r.email}</dd>
              </div>
            </dl>

            {/* Only the moves that make sense from the current stage. */}
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-[#E5E5E5] pt-3">
                {actions.map((a) => (
                  <button
                    key={a.to}
                    disabled={saving}
                    onClick={() => changeStatus(r.id, a.to)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[0.75rem] font-medium transition-colors disabled:opacity-50",
                      a.kind === "primary" && "bg-[#171717] text-white hover:opacity-90",
                      a.kind === "danger" &&
                        "border border-[#DC2626]/30 text-[#DC2626] hover:bg-[#DC2626]/5",
                      a.kind === "ghost" && "border border-[#E5E5E5] text-[#171717] hover:bg-[#F5F5F4]",
                    )}
                  >
                    {a.label}
                  </button>
                ))}
                <button
                  onClick={() => removeReturn(r.id)}
                  className="ml-auto rounded-lg px-2.5 py-1.5 text-[0.75rem] text-[#737373] transition-colors hover:text-[#DC2626]"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[1.75rem]">
          Returns
        </h1>
        <p className="mt-0.5 text-[0.8125rem] text-[#737373]">
          Manage return requests, refunds, and replacements.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 px-4 py-3 text-[0.8125rem] text-[#DC2626]">
          {error}
        </p>
      )}

      {/* Summary */}
      <div className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#E5E5E5] sm:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <div key={s.label} className="min-w-0 bg-white px-4 py-3.5">
            <div className="flex items-center gap-1.5">
              <s.Icon className="h-3.5 w-3.5 shrink-0 text-[#A3A3A3]" />
              <p className="truncate text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-[#737373]">
                {s.label}
              </p>
            </div>
            <p className={cn("mt-1.5 text-[1.25rem] font-semibold tabular-nums text-[#171717]", s.tone)}>
              <CountUp key={s.label + s.value} value={s.value} />
            </p>
            <p className="mt-0.5 truncate text-[0.6875rem] text-[#A3A3A3]">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <Card padded={false} className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E5E5E5] p-3 lg:flex-row lg:items-center">
          <div className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 pb-0.5">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium capitalize transition-colors",
                  filter === s
                    ? "bg-[#171717] text-white"
                    : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#171717]",
                )}
              >
                {s}{" "}
                <span className={cn("tabular-nums", filter === s ? "opacity-70" : "text-[#A3A3A3]")}>
                  ({counts[s] ?? 0})
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-0 lg:w-64 lg:shrink-0">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, or reason…"
              className="h-9 w-full min-w-0 rounded-lg border border-[#E5E5E5] bg-white pl-8 pr-3 text-[0.8125rem] text-[#171717] outline-none placeholder:text-[#A3A3A3] focus:border-[#171717]"
            />
          </div>
        </div>

        {/* Bulk bar */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] bg-[#FAFAF9] px-4 py-2.5">
            <span className="text-[0.8125rem] font-medium text-[#171717]">{selectedCount} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => bulkApply("approved")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#171717] px-3 py-1.5 text-[0.75rem] font-medium text-white transition-opacity hover:opacity-90"
              >
                <CheckIcon className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => bulkApply("rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626]/30 px-3 py-1.5 text-[0.75rem] font-medium text-[#DC2626] transition-colors hover:bg-[#DC2626]/5"
              >
                <CloseIcon className="h-3.5 w-3.5" /> Reject
              </button>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as AdminReturnStatus)}
                className="h-8 rounded-lg border border-[#E5E5E5] bg-white px-2 text-[0.75rem] capitalize text-[#171717] focus:border-[#171717] focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={() => bulkApply(bulkStatus)}
                className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-[0.75rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
              >
                Apply to {selectedCount}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-2 py-1.5 text-[0.75rem] text-[#737373] transition-colors hover:text-[#171717]"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <BrandLoader label="Loading returns" className="min-h-[280px]" />
        ) : filtered.length === 0 ? (
          /* Empty state — sized to a card, not the screen. */
          <div className="grid min-h-[300px] place-items-center px-6 py-12">
            <div className="max-w-sm text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#F5F5F4] text-[#A3A3A3]">
                <ReturnIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-[0.9375rem] font-semibold text-[#171717]">
                {returns.length === 0 ? "No return requests yet" : "No returns match your filters"}
              </h2>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[#737373]">
                {returns.length === 0
                  ? "When a customer requests a return, it will appear here for review and processing."
                  : "Try a different stage or clear the search."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {returns.length === 0 ? (
                  <>
                    <Link
                      href="/admin/orders"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#171717] px-3.5 py-2 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90"
                    >
                      View orders <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/policy"
                      className="rounded-lg border border-[#E5E5E5] px-3.5 py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
                    >
                      Return policy
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                    className="rounded-lg border border-[#E5E5E5] px-3.5 py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <table className="w-full min-w-[880px] text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAF9] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                    <th className="w-10 py-2.5 pl-4 pr-2">
                      <input
                        ref={headerCbRef}
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-[#171717]"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Customer</th>
                    <th className="px-3 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold">Reason</th>
                    <th className="px-3 py-2.5 font-semibold">Requested</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="w-10 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EE]">
                  {filtered.map((r) => {
                    const checked = selected.has(r.id);
                    const open = expanded === r.id;
                    return (
                      <Fragment key={r.id}>
                        <tr
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-[#FAFAF9]",
                            (checked || open) && "bg-[#FAFAF9]",
                          )}
                          onClick={() => setExpanded(open ? null : r.id)}
                        >
                          <td className="py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(r.id)}
                              className="h-4 w-4 accent-[#171717]"
                              aria-label={`Select return for order ${r.orderRef}`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-[#171717]">
                            #{r.orderRef}
                          </td>
                          <td className="max-w-[180px] px-3 py-3">
                            <span className="block truncate text-[#171717]">{r.customerName || "—"}</span>
                            <span className="block truncate text-[0.75rem] text-[#737373]">
                              {r.phone || r.email}
                            </span>
                          </td>
                          <td className="max-w-[200px] px-3 py-3">
                            <span className="block truncate text-[#525252]" title={r.items.map((i) => i.title).join(", ")}>
                              {r.items[0]?.title ?? "—"}
                            </span>
                            {r.items.length > 1 && (
                              <span className="text-[0.75rem] text-[#A3A3A3]">
                                +{r.items.length - 1} more
                              </span>
                            )}
                          </td>
                          <td className="max-w-[160px] truncate px-3 py-3 text-[#525252]" title={r.reason}>
                            {r.reason}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-[#737373]">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums text-[#171717]">
                            {formatCurrency(returnTotal(r))}
                          </td>
                          <td className="px-3 py-3">
                            <StageBadge status={r.status} />
                          </td>
                          <td className="px-3 py-3 text-right text-[#A3A3A3]">
                            {savingIds.has(r.id) ? (
                              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#171717]" />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <Detail r={r} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards, so nothing has to scroll sideways. */}
            <ul className="divide-y divide-[#F0F0EE] md:hidden">
              {filtered.map((r) => {
                const open = expanded === r.id;
                return (
                  <li key={r.id} className="min-w-0">
                    <button
                      onClick={() => setExpanded(open ? null : r.id)}
                      className="flex w-full min-w-0 flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-[#FAFAF9]"
                    >
                      <span className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-[0.8125rem] font-medium text-[#171717]">
                          #{r.orderRef}
                        </span>
                        <StageBadge status={r.status} />
                      </span>
                      <span className="truncate text-[0.8125rem] text-[#525252]">
                        {r.customerName || r.email}
                      </span>
                      <span className="flex items-center justify-between gap-2 text-[0.75rem] text-[#737373]">
                        <span className="truncate">
                          {r.items[0]?.title ?? "—"}
                          {r.items.length > 1 && ` +${r.items.length - 1}`}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-[#171717]">
                          {formatCurrency(returnTotal(r))}
                        </span>
                      </span>
                    </button>
                    {open && <Detail r={r} />}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
