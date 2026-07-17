"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminCustomer } from "@/services/admin";
import { adminListCustomers } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { ChevronRightIcon } from "@/components/ui/Icons";

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
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
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export to Excel
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        {/* Header (desktop) */}
        <div className="hidden grid-cols-[1.4fr_1.2fr_0.7fr_0.9fr_0.9fr_auto] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span>Mobile</span>
          <span>Email</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Joined</span>
          <span className="w-4" />
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
          </div>
        ) : customers.length === 0 ? (
          <p className="py-16 text-center text-stone">No customers yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {customers.map((c) => (
              <li key={c.phone}>
                <Link
                  href={`/admin/customers/${encodeURIComponent(c.phone)}`}
                  className="grid grid-cols-2 items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-mist sm:grid-cols-[1.4fr_1.2fr_0.7fr_0.9fr_0.9fr_auto] sm:gap-4 sm:px-5"
                >
                  <span className="font-medium text-ink">{c.phone}</span>
                  <span className="truncate text-ink-soft">{c.email || "—"}</span>
                  <span className="text-ink-soft sm:text-right">
                    <span className="text-stone sm:hidden">Orders: </span>
                    {c.orderCount}
                  </span>
                  <span className="text-ink sm:text-right">
                    <span className="text-stone sm:hidden">Spent: </span>
                    {formatCurrency(c.totalSpent)}
                  </span>
                  <span className="text-stone sm:text-right">{formatDate(c.joinedAt)}</span>
                  <ChevronRightIcon className="hidden h-4 w-4 text-stone sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
