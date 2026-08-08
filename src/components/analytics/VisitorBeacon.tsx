"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { sessionId, trackPageView, trackLeave } from "@/services/analytics";
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

  // Read the GPS fix once consent exists — on load for a returning visitor who
  // already agreed, or the moment they answer the prompt. Never prompts by
  // itself: getCoords is only called when consent is already "granted", so a
  // visitor who declined is never asked again.
  useEffect(() => {
    let cancelled = false;
    const acquire = async () => {
      if (cancelled || coordsRef.current) return;
      if (readGeoConsent() !== "granted") return;
      const c = await getCoords();
      if (!cancelled && c) coordsRef.current = c;
    };
    void acquire();
    window.addEventListener("conroy:geoconsent", acquire);
    return () => {
      cancelled = true;
      window.removeEventListener("conroy:geoconsent", acquire);
    };
  }, []);

  useEffect(() => {
    const send = () => {
      api
        .post("/track", {
          sessionId: sessionId(),
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
