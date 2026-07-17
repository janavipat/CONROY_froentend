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
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const phone = user?.phone;

  useEffect(() => {
    let active = true;
    async function run() {
      // Owner: signed-in phone, else a durable anonymous browser id.
      const handles = await fetchLikes(phone || anonUserKey());
      if (active) setLiked(new Set(handles));
    }
    void run();
    return () => {
      active = false;
    };
  }, [phone]);

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
    },
    [phone],
  );

  return (
    <WishlistContext.Provider
      value={{ liked, isLiked: (h) => liked.has(h), toggle, count: liked.size }}
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
