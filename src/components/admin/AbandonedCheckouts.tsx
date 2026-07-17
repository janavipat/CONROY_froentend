"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminGetAbandonedCustomers, type AbandonedCustomer } from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { BagIcon } from "@/components/ui/Icons";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

export function AbandonedCheckouts() {
  const [rows, setRows] = useState<AbandonedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await adminGetAbandonedCustomers();
        if (active) setRows(data);
      } catch {
        if (active) setError("Could not load abandoned checkouts. (Run analytics.sql + start the backend.)");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Abandoned checkouts</h1>
      <p className="mt-1 text-sm text-stone">
        Customers who added products to their cart but never bought them.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        <div className="hidden grid-cols-[1.4fr_2.4fr_0.7fr_1fr] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span>Customer</span>
          <span>Products added, not bought</span>
          <span className="text-right">Items</span>
          <span className="text-right">Last added</span>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BagIcon className="h-9 w-9 text-stone" />
            <p className="text-stone">No abandoned carts from signed-in customers yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li
                key={c.phone}
                className="grid grid-cols-1 gap-2 px-4 py-4 text-sm sm:grid-cols-[1.4fr_2.4fr_0.7fr_1fr] sm:items-start sm:gap-4 sm:px-5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/customers/${encodeURIComponent(c.phone)}`}
                    className="block truncate font-medium text-ink hover:underline"
                  >
                    {c.name || c.phone}
                  </Link>
                  <span className="block truncate text-xs text-stone">{c.email || c.phone}</span>
                  {!c.hasOrders && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-amber-700">
                      Never ordered
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.products.map((p) => (
                    <Link
                      key={p.handle}
                      href={`/products/${p.handle}`}
                      className="rounded-full border border-line bg-mist px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
                <span className="font-medium text-accent sm:text-right">
                  <span className="text-stone sm:hidden">Items: </span>
                  {c.productCount}
                </span>
                <span className="text-stone sm:text-right">{formatDate(c.lastAddedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
