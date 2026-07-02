"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";

/** Stable per-tab session id. */
function sessionId(): string {
  try {
    let id = sessionStorage.getItem("conroy.sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("conroy.sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

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

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
