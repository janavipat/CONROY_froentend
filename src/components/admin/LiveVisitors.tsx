"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminGetLive, type LiveData } from "@/services/admin";
import { cn } from "@/utils/cn";

const POLL_MS = 8_000;

export function LiveVisitors() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function tick() {
      try {
        const d = await adminGetLive();
        if (active) {
          setData(d);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const live = data?.live ?? 0;
  const maxLoc = Math.max(1, ...(data?.locations.map((l) => l.count) ?? [1]));

  return (
    <div className="rounded-media border border-line bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-ink">Live visitors</h3>
          <p className="text-xs text-stone">Right now on the storefront</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                live > 0 && "animate-ping bg-green-500",
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                live > 0 ? "bg-green-500" : "bg-stone/40",
              )}
            />
          </span>
          <motion.span
            key={live}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-semibold tabular-nums text-ink"
          >
            {live}
          </motion.span>
        </div>
      </div>

      {error && !data && (
        <p className="mt-6 text-sm text-stone">
          Couldn&apos;t reach the backend. Start it to see live visitors.
        </p>
      )}

      {/* Locations */}
      <div className="mt-6">
        <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
          Where they are
        </p>
        {data && data.locations.length > 0 ? (
          <ul className="space-y-3">
            {data.locations.map((loc) => (
              <li key={loc.countryCode}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-ink">
                    <span className="text-base leading-none">{loc.flag}</span>
                    <span className="truncate">
                      {loc.country}
                      {loc.cities.length > 0 && (
                        <span className="text-stone"> · {loc.cities.slice(0, 2).join(", ")}</span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-ink">{loc.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist">
                  <motion.div
                    className="h-full rounded-full bg-ink"
                    initial={{ width: 0 }}
                    animate={{ width: `${(loc.count / maxLoc) * 100}%` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone">
            No active visitors. Open the{" "}
            <a href="/" target="_blank" className="text-ink underline-offset-2 hover:underline">
              storefront
            </a>{" "}
            in another tab to see this update live.
          </p>
        )}
      </div>

      {/* Active pages */}
      {data && data.pages.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
            Active pages
          </p>
          <ul className="space-y-2">
            {data.pages.map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-mono text-xs text-ink-soft">{p.path}</span>
                <span className="shrink-0 tabular-nums text-stone">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <p className="mt-5 border-t border-line pt-4 text-xs text-stone">
          {data.totalSessions} session{data.totalSessions === 1 ? "" : "s"} since the server started
        </p>
      )}
    </div>
  );
}
