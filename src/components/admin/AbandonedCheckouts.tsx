"use client";

import { useEffect, useState } from "react";
import { adminGetAnalytics, type AnalyticsAbandoned } from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { BagIcon } from "@/components/ui/Icons";

export function AbandonedCheckouts() {
  const [rows, setRows] = useState<AnalyticsAbandoned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await adminGetAnalytics();
        if (active) setRows(data.abandoned);
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
        Products customers added to their cart but didn&apos;t purchase.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span>Product</span>
          <span className="text-right">Added</span>
          <span className="text-right">Purchased</span>
          <span className="text-right">Not bought</span>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BagIcon className="h-9 w-9 text-stone" />
            <p className="text-stone">No abandoned carts yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li
                key={r.handle}
                className="grid grid-cols-3 gap-2 px-5 py-3 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-4"
              >
                <span className="col-span-3 truncate text-ink sm:col-span-1">{r.title}</span>
                <span className="text-ink-soft sm:text-right">
                  <span className="text-stone sm:hidden">Added: </span>
                  {r.added}
                </span>
                <span className="text-ink-soft sm:text-right">
                  <span className="text-stone sm:hidden">Bought: </span>
                  {r.purchased}
                </span>
                <span className="font-medium text-accent sm:text-right">{r.notBought}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
