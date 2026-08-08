"use client";

import { useEffect, useState } from "react";
import { browserPermission, readGeoConsent, writeGeoConsent } from "@/lib/geo-consent";

/**
 * Asks once — and only once — whether we may use the visitor's location.
 *
 * Shown on the first visit, then never again: the answer is stored, and the
 * browser's own permission state is checked first so someone who already
 * granted or blocked location is never bothered.
 *
 * Answering only records the decision. The actual GPS read happens in
 * VisitorBeacon, which watches for consent turning "granted".
 */
export function LocationConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (readGeoConsent() !== "unset") return; // already answered

      // If the browser has already decided, mirror it and stay silent.
      const perm = await browserPermission();
      if (perm === "granted") {
        writeGeoConsent("granted");
        return;
      }
      if (perm === "denied") {
        writeGeoConsent("denied");
        return;
      }

      // Let the page settle before interrupting.
      const t = setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, 2500);
      return () => clearTimeout(t);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!open) return null;

  const decide = (value: "granted" | "denied") => {
    writeGeoConsent(value);
    setOpen(false);
    // Nudge VisitorBeacon to pick the answer up without a reload.
    window.dispatchEvent(new Event("conroy:geoconsent"));
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="geo-consent-title"
      className="fixed bottom-5 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 border border-line bg-white p-5 shadow-lg sm:left-5 sm:translate-x-0"
    >
      <p id="geo-consent-title" className="text-sm leading-relaxed text-ink">
        Allow us to access your location to provide a better experience?
      </p>
      <p className="mt-2 text-xs leading-relaxed text-stone">
        Used only to show your city for delivery and support. You can change this any time in your
        browser settings.
      </p>
      <div className="mt-4 flex gap-2.5">
        <button
          onClick={() => decide("granted")}
          className="h-10 flex-1 border border-ink bg-ink text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white transition-colors duration-(--duration-base) hover:bg-accent hover:border-accent"
        >
          Allow
        </button>
        <button
          onClick={() => decide("denied")}
          className="h-10 flex-1 border border-ink/25 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-(--duration-base) hover:border-ink"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
