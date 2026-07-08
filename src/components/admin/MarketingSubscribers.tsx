"use client";

import { useEffect, useState } from "react";
import { adminListSubscribers, type AdminSubscriber } from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { MailIcon } from "@/components/ui/Icons";

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

export function MarketingSubscribers() {
  const [subs, setSubs] = useState<AdminSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await adminListSubscribers();
        if (active) setSubs(data);
      } catch {
        if (active) setError("Could not load subscribers. Start the backend and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  function exportCsv() {
    const rows = ["email,joined", ...subs.map((s) => `${s.email},${s.joinedAt}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "conroy-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Marketing</h1>
          <p className="mt-1 text-sm text-stone">
            {loading ? "Loading…" : `${subs.length} newsletter subscriber${subs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {subs.length > 0 && (
          <button
            onClick={exportCsv}
            className="rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-ink"
          >
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        <div className="hidden grid-cols-[1fr_160px] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span>Email</span>
          <span className="text-right">Subscribed</span>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader label="Loading subscribers" />
          </div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MailIcon className="h-9 w-9 text-stone" />
            <p className="text-stone">No subscribers yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {subs.map((s) => (
              <li
                key={s.email}
                className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-[1fr_160px] sm:gap-4"
              >
                <span className="truncate text-ink">{s.email}</span>
                <span className="text-stone sm:text-right">{formatDate(s.joinedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
