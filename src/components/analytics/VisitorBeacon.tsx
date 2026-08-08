"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { sessionId, trackPageView, trackLeave } from "@/services/analytics";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Sends a lightweight heartbeat to the backend so the admin dashboard can show
 * live visitors and where they are. Runs on storefront pages only. Geography is
 * resolved server-side from the request IP (Vercel's edge geo headers) — the
 * locale/timezone sent here are only a fallback for local dev, where those
 * headers don't exist.
 */
export function VisitorBeacon() {
  const pathname = usePathname();
  const { user } = useAuth();
  // Read through a ref inside the interval/unload handlers: those close over
  // this render's `user`, so capturing it directly would send a stale identity
  // if the visitor signed in while sitting on the page.
  const whoRef = useRef<{ name?: string | null; phone?: string | null }>({});
  useEffect(() => {
    whoRef.current = { name: user?.name, phone: user?.phone };
  }, [user?.name, user?.phone]);

  useEffect(() => {
    const send = () => {
      api
        .post("/track", {
          sessionId: sessionId(),
          name: whoRef.current.name || undefined,
          phone: whoRef.current.phone || undefined,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
        })
        .catch(() => {
          /* ignore — analytics must never break the storefront */
        });
    };

    send();
    const interval = setInterval(send, 25_000); // keep the session "live"
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Time-on-page (unrelated cart/pageview analytics) + an immediate
    // live-visitor "offline" signal — both only on a real tab close/navigate
    // away, not on every in-app route change (this effect's own cleanup below
    // re-runs per pathname without the visitor actually leaving the site).
    const start = performance.now();
    const path = pathname || "/";
    const onPageHide = () => {
      trackPageView(path, Math.round(performance.now() - start), whoRef.current);
      trackLeave(sessionId());
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
      trackPageView(path, Math.round(performance.now() - start), whoRef.current);
    };
  }, [pathname]);

  return null;
}
