"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminGetAccounts, type AccountsSummary } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { ReceiptIcon } from "@/components/ui/Icons";

/** Compact accounting snapshot for the dashboard side panel. */
export function AccountsSummaryCard() {
  const [summary, setSummary] = useState<AccountsSummary | null>(null);

  useEffect(() => {
    let active = true;
    adminGetAccounts()
      .then((d) => active && setSummary(d.summary))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const currency = summary?.currency ?? "INR";

  return (
    <div className="rounded-media border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <ReceiptIcon className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-medium text-ink">Accounts</h3>
      </div>

      {summary ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-stone">People purchased</dt>
            <dd className="font-medium text-ink">{summary.buyerCount}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone">Total bill</dt>
            <dd className="font-medium text-ink">
              {formatCurrency(summary.netRevenue, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone">Refunds</dt>
            <dd className="font-medium text-accent">
              {summary.refundedAmount > 0
                ? `−${formatCurrency(summary.refundedAmount, currency)}`
                : formatCurrency(0, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone">Net margin</dt>
            <dd className="font-medium text-ink">
              {formatCurrency(summary.netMargin, currency)}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-mist" />
          ))}
        </div>
      )}

      <Link
        href="/admin/accounts"
        className="mt-4 block rounded-md border border-line py-2 text-center text-sm text-ink transition-colors hover:bg-mist"
      >
        View accounts
      </Link>
    </div>
  );
}
