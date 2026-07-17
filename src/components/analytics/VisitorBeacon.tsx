"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { sessionId, trackPageView } from "@/services/analytics";

/**
 * Sends a lightweight heartbeat to the backend so the admin dashboard can show
 * live visitors and where they are. Runs on storefront pages only. Geography is
 * derived server-side from the browser locale + timezone sent here.
 */
export function VisitorBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const send = () => {
      api
        .post("/track", {
          sessionId: sessionId(),
          path: pathname || "/",
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
        })
        .catch(() => {
          /* ignore — analytics must never break the storefront */
        });
    };

    send();
    const interval = setInterval(send, 20_000); // keep the session "live"
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Time-on-page: record a page view with its duration when the visitor
    // leaves this path (navigates away or closes the tab).
    const start = performance.now();
    const path = pathname || "/";
    const flush = () => trackPageView(path, Math.round(performance.now() - start));
    window.addEventListener("pagehide", flush);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);

  return null;
}
