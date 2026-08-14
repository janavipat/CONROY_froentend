"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminCustomer } from "@/services/admin";
import { adminListCustomers } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { ChevronRightIcon } from "@/components/ui/Icons";
import { Loader } from "@/components/ui/Loader";

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

/** Escapes a value for a CSV cell. */
function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    adminListCustomers()
      .then((c) => active && (setCustomers(c), setLoading(false)))
      .catch(
        () =>
          active &&
          (setError("Could not load customers. (Run users.sql and start the backend.)"),
          setLoading(false)),
      );
    return () => {
      active = false;
    };
  }, []);

  function exportExcel() {
    const header = ["Mobile", "Email", "Orders", "Total spent (INR)", "Joined"];
    const rows = customers.map((c) => [
      c.phone,
      c.email || "",
      c.orderCount,
      c.totalSpent,
      formatDate(c.joinedAt),
    ]);
    // Prepend a BOM so Excel opens the CSV with correct UTF-8 encoding.
    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `conroy-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-stone">
            {loading
              ? "Loading…"
              : `${customers.length} customer${customers.length === 1 ? "" : "s"} · click a row for details`}
          </p>
        </div>
        <button
          onClick={exportExcel}
          disabled={loading || customers.length === 0}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export to Excel
        </button>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader size="sm" label="" />
          </div>
        ) : customers.length === 0 ? (
          <p className="py-14 text-center text-sm text-stone">No customers yet.</p>
        ) : (
          /* Narrow screens scroll the table sideways rather than stacking the
             columns out of alignment. */
          <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              {/* Everything but Email is fixed, so the figures line up down the
                  table and Email absorbs the slack instead of leaving a gap. */}
              <colgroup>
                <col className="w-[170px]" />
                <col />
                <col className="w-[92px]" />
                <col className="w-[124px]" />
                <col className="w-[132px]" />
                <col className="w-[52px]" />
              </colgroup>

              <thead>
                <tr className="border-b border-[#E5E5E5] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                  <th className="px-4 py-2.5 font-medium">Mobile</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 text-right font-medium">Orders</th>
                  <th className="px-3 py-2.5 text-right font-medium">Spent</th>
                  <th className="px-3 py-2.5 text-right font-medium">Joined</th>
                  {/* `relative` is load-bearing: sr-only is position:absolute,
                      and without a positioned ancestor its containing block is
                      the document — so it escaped the scroll container's clip
                      and stretched the page to 761px at 360px wide. */}
                  <th className="relative px-4 py-2.5 text-right font-medium">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0F0EE]">
                {customers.map((c) => {
                  const href = `/admin/customers/${encodeURIComponent(c.phone)}`;
                  return (
                    <tr
                      key={c.phone}
                      onClick={() => router.push(href)}
                      className="group cursor-pointer transition-colors hover:bg-[#FAFAF9]"
                    >
                      <td className="px-4 py-2.5">
                        {/* A real link, so the row is reachable by keyboard and
                            opens in a new tab on middle-click — the row's own
                            handler only duplicates what this already does. */}
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium tabular-nums text-ink outline-none focus-visible:underline"
                        >
                          {c.phone}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-ink-soft" title={c.email || undefined}>
                          {c.email || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                        {c.orderCount}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium text-ink">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-stone">
                        {formatDate(c.joinedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <ChevronRightIcon className="ml-auto h-4 w-4 text-[#D4D4D4] transition-colors group-hover:text-ink" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
