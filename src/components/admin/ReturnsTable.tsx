"use client";

import { useEffect, useState } from "react";
import {
  adminListReturns,
  adminUpdateReturnStatus,
  adminDeleteReturn,
  type AdminReturn,
  type AdminReturnStatus,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

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
      return "bg-amber-500 text-white";
    case "approved":
      return "bg-blue-600 text-white";
    case "rejected":
      return "bg-accent text-white";
    default:
      return "bg-green-600 text-white"; // refunded / replaced / completed
  }
}

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

export function ReturnsTable() {
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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

  async function changeStatus(id: string, status: AdminReturnStatus) {
    setSavingId(id);
    setReturns((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await adminUpdateReturnStatus(id, status);
    } catch {
      setError("Could not update the return status. Please retry.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeReturn(id: string) {
    if (!window.confirm("Delete this return request? This cannot be undone.")) return;
    const prev = returns;
    setReturns((rs) => rs.filter((r) => r.id !== id));
    try {
      await adminDeleteReturn(id);
    } catch {
      setReturns(prev);
      setError("Could not delete the return. Please retry.");
    }
  }

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

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      ) : returns.length === 0 ? (
        <p className="mt-6 rounded-media border border-line bg-white py-16 text-center text-stone">
          No return requests yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {returns.map((r) => (
            <li key={r.id} className="rounded-media border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <p className="text-sm text-ink">
                    Order <span className="font-medium">#{r.orderRef}</span>
                    <span className="text-stone"> · {formatDate(r.createdAt)}</span>
                  </p>
                  <p className="text-xs text-stone">
                    {r.customerName || "—"} · {r.phone || "—"} · {r.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                      statusCls(r.status),
                    )}
                  >
                    {r.status}
                  </span>
                  <span className="rounded-full bg-mist px-2.5 py-1 text-xs capitalize text-ink-soft">
                    {r.resolution}
                  </span>
                </div>
              </div>

              {/* Returned items */}
              <ul className="mt-3 space-y-1.5">
                {r.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink-soft">
                      {it.title}
                      <span className="text-stone">
                        {" "}
                        · Size {it.size} × {it.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 text-ink">{formatCurrency(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-sm text-ink-soft">
                <span className="text-stone">Reason: </span>
                {r.reason}
              </p>

              {/* Update status */}
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                <label className="text-xs text-stone">Set status:</label>
                <select
                  value={r.status}
                  disabled={savingId === r.id}
                  onChange={(e) => changeStatus(r.id, e.target.value as AdminReturnStatus)}
                  className="rounded-md border border-line bg-white px-2 py-1.5 text-sm capitalize text-ink focus:border-ink focus:outline-none disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
                {savingId === r.id && <span className="text-xs text-stone">Saving…</span>}
                <button
                  onClick={() => removeReturn(r.id)}
                  className="ml-auto rounded-md border border-line px-2.5 py-1.5 text-xs text-stone transition-colors hover:border-accent hover:text-accent"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
