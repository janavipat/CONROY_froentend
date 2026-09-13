"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { anonUserKey } from "@/services/analytics";
import { fetchLikes, toggleLike as apiToggle } from "@/services/wishlist";

interface WishlistContextValue {
  liked: Set<string>;
  isLiked: (handle: string) => boolean;
  toggle: (handle: string) => Promise<void>;
  count: number;
  /** True until the saved list has been read once for the current owner. */
  loading: boolean;
  /** The list could not be read. Distinct from having saved nothing. */
  loadError: boolean;
  /** Re-reads the saved list. Exposed so a failed load can offer a retry. */
  reload: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [attempt, setAttempt] = useState(0);
  const phone = user?.phone;

  /*
   * An unread list and an empty one are different things. Collapsing them made
   * the wishlist page say "nothing saved yet" to someone whose saved items had
   * simply failed to load.
   *
   * Which read the answer belongs to is stored rather than a loading flag, so
   * both states fall out of it: a read is outstanding whenever the answer on
   * hand is for a different one, and no flag has to be flipped by hand.
   */
  const request = `${phone ?? ""}#${attempt}`;
  const [answer, setAnswer] = useState<{ request: string; failed: boolean } | null>(null);
  const loading = answer?.request !== request;
  const loadError = answer?.request === request && answer.failed;

  /** Asks for the list again; the effect below does the actual reading. */
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    // Owner: signed-in phone, else a durable anonymous browser id.
    fetchLikes(phone || anonUserKey())
      .then((handles) => {
        if (!active) return;
        setLiked(new Set(handles));
        setAnswer({ request, failed: false });
      })
      .catch(() => {
        if (!active) return;
        /*
         * The previously known set is left alone rather than cleared: hearts
         * already drawn on screen stay drawn, and a retry can reconcile them.
         */
        setAnswer({ request, failed: true });
      });
    return () => {
      active = false;
    };
  }, [phone, request]);

  const toggle = useCallback(
    async (handle: string) => {
      const userKey = phone || anonUserKey();
      // Optimistic flip.
      setLiked((prev) => {
        const next = new Set(prev);
        if (next.has(handle)) next.delete(handle);
        else next.add(handle);
        return next;
      });
      const res = await apiToggle(handle, userKey);
      setLiked((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(handle);
        else next.delete(handle);
        return next;
      });
      // A toggle that reached the server proves the list is readable again.
      setAnswer((prev) => (prev?.failed ? { ...prev, failed: false } : prev));
    },
    [phone],
  );

  return (
    <WishlistContext.Provider
      value={{
        liked,
        isLiked: (h) => liked.has(h),
        toggle,
        count: liked.size,
        loading,
        loadError,
        reload,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
