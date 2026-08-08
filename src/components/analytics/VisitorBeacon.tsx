"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { anonUserKey, trackPageView, trackLeave } from "@/services/analytics";
import { useAuth } from "@/lib/auth/auth-context";
import { getCoords, readGeoConsent } from "@/lib/geo-consent";

/**
 * Sends a lightweight heartbeat to the backend so the admin dashboard can show
 * live visitors and where they are.
 *
 * Location comes from the browser's Geolocation API once the visitor has
 * consented — IP geolocation resolves to the ISP's routing city, which is
 * routinely a couple of hundred kilometres out. Without consent the backend
 * falls back to that IP guess and flags it as approximate.
 */
export function VisitorBeacon() {
  const pathname = usePathname();
  const { user } = useAuth();
  // One GPS fix per session, reused by every heartbeat — repeatedly waking the
  // receiver would drain battery for a label that doesn't change.
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  // Read through a ref inside the interval/unload handlers: those close over
  // this render's `user`, so capturing it directly would send a stale identity
  // if the visitor signed in while sitting on the page.
  const whoRef = useRef<{ name?: string | null; phone?: string | null }>({});
  useEffect(() => {
    whoRef.current = { name: user?.name, phone: user?.phone };
  }, [user?.name, user?.phone]);

  useEffect(() => {
    // Presence is keyed on the DEVICE, not the tab. sessionId() lives in
    // sessionStorage, so three open tabs used to appear as three live
    // visitors; anonUserKey() is in localStorage and is one id per browser.
    const visitorKey = anonUserKey();

    /**
     * Fetches the GPS fix, then beats immediately so the corrected location
     * lands right away instead of after the next 25s tick. Retried from the
     * heartbeat while consent is granted and we still have nothing — a single
     * failed read must not leave the visitor on the IP guess forever.
     */
    const acquire = async () => {
      if (coordsRef.current) return;
      if (readGeoConsent() !== "granted") return;
      const c = await getCoords();
      if (c) {
        coordsRef.current = c;
        send();
      }
    };

    const send = () => {
      api
        .post("/track", {
          sessionId: visitorKey,
          name: whoRef.current.name || undefined,
          phone: whoRef.current.phone || undefined,
          latitude: coordsRef.current?.latitude,
          longitude: coordsRef.current?.longitude,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
        })
        .catch(() => {
          /* ignore — analytics must never break the storefront */
        });
    };

    send();
    void acquire();
    const interval = setInterval(() => {
      void acquire(); // no-op once we have a fix, or if consent wasn't given
      send();
    }, 25_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);
    // Picks up the answer the moment the visitor allows, without a reload.
    window.addEventListener("conroy:geoconsent", acquire);

    // Time-on-page (unrelated cart/pageview analytics) + an immediate
    // live-visitor "offline" signal — both only on a real tab close/navigate
    // away, not on every in-app route change (this effect's own cleanup below
    // re-runs per pathname without the visitor actually leaving the site).
    const start = performance.now();
    const path = pathname || "/";
    const onPageHide = () => {
      trackPageView(path, Math.round(performance.now() - start), whoRef.current);
      trackLeave(visitorKey);
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("conroy:geoconsent", acquire);
      window.removeEventListener("pagehide", onPageHide);
      trackPageView(path, Math.round(performance.now() - start), whoRef.current);
    };
  }, [pathname]);

  return null;
}
