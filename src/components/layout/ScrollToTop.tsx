"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Puts every new route at the top before it paints.
 *
 * The App Router only restores scroll once the route's content commits. While a
 * page is still streaming, its `loading` state renders at whatever offset the
 * previous page was left at — on a long listing that meant landing on the
 * footer for as long as the fetch took, then being thrown to the top when the
 * content arrived. Resetting on the pathname change instead puts the loading
 * state itself at the top, so the middle of the page is what a shopper sees
 * from the first frame.
 *
 * `useLayoutEffect` rather than `useEffect`: it runs before the browser paints
 * the new route, so there is no frame at the old offset to see.
 *
 * Two navigations are deliberately left alone — back/forward, where restoring
 * the previous position is the behaviour people expect, and links carrying a
 * hash, which are asking for a specific element rather than the top.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const restoringHistory = useRef(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // popstate fires before the pathname commits, so this flag is set by the
    // time the layout effect below runs for that navigation.
    function onPopState() {
      restoringHistory.current = true;
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    // The first pass is the initial load — a deep link or a refresh already
    // arrives where it should, and a hash target has not been scrolled to yet.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (restoringHistory.current) {
      restoringHistory.current = false;
      return;
    }
    if (window.location.hash) return;

    // Forced instant rather than inheriting whatever the root is set to, so a
    // route change can never animate up from the previous page's offset.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  return null;
}
