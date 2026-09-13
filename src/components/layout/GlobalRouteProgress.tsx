"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RouteProgress } from "@/components/ui/RouteProgress";

/*
 * Long enough that a prefetched route — which arrives in a few dozen
 * milliseconds — never flashes a bar, short enough that a slow one is
 * acknowledged well inside the window where a visitor starts to doubt the tap
 * registered.
 */
const APPEAR_DELAY_MS = 150;

/*
 * A navigation that never lands (an aborted request, a click something else
 * cancelled) must not leave the bar running forever. After this the bar gives
 * up on its own.
 */
const GIVE_UP_MS = 15_000;

/**
 * Shows the existing {@link RouteProgress} bar during route transitions.
 *
 * The App Router exposes no navigation events, and `useLinkStatus` only works
 * inside a single `<Link>`. So the start of a navigation is taken from the
 * click that causes it (captured before Next's own handler runs) and from
 * back/forward, and the end is taken from the pathname actually changing —
 * which is the only signal that the new route is on screen.
 *
 * Query-only changes are deliberately ignored: filtering, sorting and search
 * keep the same pathname and already have their own in-place feedback.
 */
export function GlobalRouteProgress() {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  /*
   * Derived, not stored: the bar runs while we are still standing on the route
   * we tried to leave. Nothing has to remember to switch it off — the arrival
   * of the new pathname is the switch.
   */
  const navigating = leaving !== null && leaving === pathname;

  // The handlers below fire outside React, and need the route we are on now.
  const here = useRef(pathname);
  useEffect(() => {
    here.current = pathname;
  }, [pathname]);

  // A completed navigation clears the mark, so a later return to the same
  // route cannot re-trigger the bar against a stale one.
  useEffect(() => {
    return () => setLeaving(null);
  }, [pathname]);

  useEffect(() => {
    if (!navigating) return;
    const show = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    const giveUp = setTimeout(() => setLeaving(null), GIVE_UP_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
      setVisible(false);
    };
  }, [navigating]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Modified clicks open elsewhere; this tab is not going anywhere.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page: a hash jump or a filter change, not a route transition.
      if (url.pathname === window.location.pathname) return;

      setLeaving(here.current);
    }

    function onPopState() {
      setLeaving(here.current);
    }

    /*
     * Capture phase: `<Link>` calls preventDefault on the anchor itself, so a
     * bubble-phase listener would only ever see clicks it had already claimed.
     */
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (!visible) return null;

  /*
   * Fixed and above the sticky header, so the bar takes no space in the
   * document — appearing mid-scroll must not nudge the page — and cannot be
   * painted over by the header it sits against. `pointer-events-none` keeps a
   * hairline that spans the viewport from eating taps on the nav beneath it.
   */
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60]">
      <RouteProgress />
    </div>
  );
}
