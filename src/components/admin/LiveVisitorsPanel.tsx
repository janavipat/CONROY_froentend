"use client";

import { useEffect, useRef, useState } from "react";
import { adminGetLive, type LiveData, type LiveVisitorRow } from "@/services/admin";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/utils/cn";

/**
 * State + country only — "Gujarat, India". Deliberately not the town, district
 * or coordinates: knowing which state someone is in is enough to run the shop,
 * and anything finer is more of a customer's whereabouts than we need to hold.
 */
function placeOf(v: LiveVisitorRow): string {
  return [v.region, v.country].filter(Boolean).join(", ") || "Unknown";
}

// Matches the storefront beacon's ~25s heartbeat closely enough that a
// visitor going offline shows up within one or two polls.
const POLL_MS = 5_000;

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-media border border-line bg-white p-4">
      <p className="text-xs text-stone">{label}</p>
      <p className="mt-1 font-display text-xl sm:text-2xl text-ink">{value}</p>
    </div>
  );
}

export function LiveVisitorsPanel() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState("");
  const loadedOnce = useRef(false);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const d = await adminGetLive();
        if (active) {
          setData(d);
          setError("");
        }
      } catch {
        if (active) setError("Could not load live visitors.");
      } finally {
        loadedOnce.current = true;
      }
    }
    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!data && !error) {
    return (
      <div className="rounded-media border border-line bg-white p-10">
        <Loader label="Loading live visitors" size="sm" />
      </div>
    );
  }

  if (data && !data.tableReady) {
    return (
      <div className="rounded-media border border-line bg-white p-6 text-sm text-stone">
        Live visitors needs one setup step: run{" "}
        <code className="rounded bg-mist px-1.5 py-0.5 text-xs text-ink">supabase/live-visitors.sql</code> in the
        Supabase SQL editor, then this section will start populating automatically.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Live now" value={String(data?.live ?? 0)} />
        <StatTile label="Signed in" value={String(data?.loggedIn ?? 0)} />
        <StatTile label="Guests" value={String(data?.guests ?? 0)} />
      </div>

      {error && <p className="text-xs text-accent">{error}</p>}

      <div className="grid gap-4">
        <div className="max-h-[420px] overflow-y-auto rounded-media border border-line bg-white">
          {!data || data.visitors.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone">No one online right now.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-stone">
                  <th className="py-2 px-3 font-medium">Visitor</th>
                  <th className="py-2 px-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {data.visitors.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0">
                    <td className="py-2 px-3">
                      <span className="font-medium text-ink">{v.label}</span>
                      <span
                        className={cn(
                          "ml-2 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                          v.loggedIn ? "bg-accent/15 text-accent" : "bg-mist text-stone",
                        )}
                      >
                        {v.loggedIn ? "Signed in" : "Guest"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-ink-soft">
                      {v.flag} {placeOf(v)}
                      {!v.precise && (
                        <span
                          title="Estimated from the visitor's IP address — they haven't shared their location"
                          className="ml-2 rounded-full bg-mist px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone"
                        >
                          Approx
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
