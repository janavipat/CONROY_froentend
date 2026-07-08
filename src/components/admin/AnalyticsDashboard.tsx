"use client";

import { useEffect, useState } from "react";
import { adminGetAnalytics, type AdminAnalytics } from "@/services/admin";
import { LiveVisitors } from "@/components/admin/LiveVisitors";
import { Loader } from "@/components/ui/Loader";

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function prettyPath(path: string): string {
  return path === "/" ? "Home" : path;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const d = await adminGetAnalytics();
        if (active) setData(d);
      } catch {
        if (active) setError("Could not load analytics. (Run analytics.sql and start the backend.)");
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
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Analytics</h1>
      <p className="mt-1 text-sm text-stone">
        Who&apos;s browsing, what they view, and what they love.
      </p>

      {/* Live visitors (real-time) */}
      <div className="mt-6">
        <LiveVisitors />
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <Loader label="Loading analytics" />
        </div>
      ) : (
        data && (
          <div className="mt-6 space-y-6">
            {/* Top pages */}
            <section className="rounded-media border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-ink">Pages visited</h2>
                <span className="text-xs text-stone">{data.totalPageViews} views tracked</span>
              </div>
              <div className="mt-4 hidden grid-cols-[2.4fr_0.8fr_1fr_1fr] gap-4 border-b border-line pb-2 text-xs uppercase tracking-wide text-stone sm:grid">
                <span>Page</span>
                <span className="text-right">Views</span>
                <span className="text-right">Visitors</span>
                <span className="text-right">Avg time</span>
              </div>
              {data.topPages.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone">No page views yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.topPages.map((p) => (
                    <li
                      key={p.path}
                      className="grid grid-cols-3 gap-2 py-2.5 text-sm sm:grid-cols-[2.4fr_0.8fr_1fr_1fr] sm:gap-4"
                    >
                      <span className="col-span-3 truncate text-ink sm:col-span-1">{prettyPath(p.path)}</span>
                      <span className="text-ink-soft sm:text-right">
                        <span className="text-stone sm:hidden">Views: </span>
                        {p.views}
                      </span>
                      <span className="text-ink-soft sm:text-right">
                        <span className="text-stone sm:hidden">Visitors: </span>
                        {p.uniqueVisitors}
                      </span>
                      <span className="text-ink sm:text-right">
                        <span className="text-stone sm:hidden">Avg: </span>
                        {fmtTime(p.avgSeconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Added but not bought */}
              <section className="rounded-media border border-line bg-white p-5">
                <h2 className="font-display text-lg text-ink">Added to cart, not bought</h2>
                <p className="mt-0.5 text-xs text-stone">Products customers add but don&apos;t purchase.</p>
                {data.abandoned.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone">Nothing abandoned yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {data.abandoned.map((a) => (
                      <li key={a.handle} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="truncate text-ink">{a.title}</span>
                        <span className="shrink-0 text-xs text-stone">
                          <span className="font-medium text-accent">{a.notBought}</span> not bought ·{" "}
                          {a.added} added
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Most liked */}
              <section className="rounded-media border border-line bg-white p-5">
                <h2 className="font-display text-lg text-ink">Most liked</h2>
                <p className="mt-0.5 text-xs text-stone">Products shoppers added to their wishlist.</p>
                {data.mostLiked.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone">No likes yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {data.mostLiked.map((m) => (
                      <li key={m.handle} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="truncate text-ink">{m.title}</span>
                        <span className="shrink-0 text-xs font-medium text-ink">
                          ♥ {m.likes}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )
      )}
    </div>
  );
}
