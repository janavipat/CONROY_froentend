"use client";

import { useEffect } from "react";

/**
 * Registers the service worker.
 *
 * Without a registered worker exposing a fetch handler, Chrome's heuristic for
 * showing the install prompt never fires — the manifest alone gets the site as
 * far as "installable from the menu" and no further.
 *
 * Registration waits for load so it never competes with the first render for
 * bandwidth, and stays silent on failure: an unavailable worker costs the
 * install prompt, which is not a reason to put an error in front of a shopper.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Dev serves uncached, rebuilt assets; a worker holding onto them between
    // rebuilds is a debugging trap rather than a help.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* install prompt is unavailable; the store works exactly as before */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
