"use client";

import { useEffect, useState } from "react";
import type { AdminCustomer } from "@/services/admin";
import { adminListCustomers } from "@/services/admin";
import { formatCurrency } from "@/utils/format";

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

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-stone">
          {loading ? "Loading…" : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        {/* Header (desktop) */}
        <div className="hidden grid-cols-[1.4fr_1.2fr_0.7fr_0.9fr_0.9fr] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span>Mobile</span>
          <span>Email</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Joined</span>
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
              <li
                key={c.phone}
                className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-[1.4fr_1.2fr_0.7fr_0.9fr_0.9fr] sm:gap-4 sm:px-5"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
