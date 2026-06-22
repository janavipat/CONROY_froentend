"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Returns whether the given media query currently matches. SSR-safe via
 * useSyncExternalStore (no setState-in-effect, no hydration mismatch).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  // On the server we have no `window`; report `false` (mobile-first default).
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
