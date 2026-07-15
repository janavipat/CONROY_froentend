"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Returns whether the browser currently has a network connection, updating
 * automatically as the connection drops and returns. SSR-safe via
 * useSyncExternalStore (no setState-in-effect, no hydration mismatch).
 *
 * Note: this reflects the OS/browser network state (`navigator.onLine`). A
 * connected-but-dead network (captive portal, no route to the internet) can
 * still report online.
 */
export function useOnlineStatus(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => navigator.onLine, []);
  // No `navigator` on the server — assume online so the server markup matches
  // the first paint for a connected visitor.
  const getServerSnapshot = () => true;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
