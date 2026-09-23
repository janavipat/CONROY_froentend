"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { fetchSearchCatalogue } from "@/services/search-actions";

/**
 * Loads the current catalogue for the header search overlay, once it is first
 * opened. The result is shared across every use of the hook and reused for a
 * minute, so opening and closing the overlay doesn't refetch each time.
 */
const REUSE_MS = 60_000;

let cached: { products: Product[]; at: number } | null = null;
let inflight: Promise<Product[]> | null = null;

function load(): Promise<Product[]> {
  if (cached && Date.now() - cached.at < REUSE_MS) return Promise.resolve(cached.products);
  if (!inflight) {
    inflight = fetchSearchCatalogue()
      .then((products) => {
        cached = { products, at: Date.now() };
        return products;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

type State = { products: Product[]; failed: boolean; loaded: boolean };

export function useSearchCatalogue(enabled: boolean): {
  products: Product[];
  loading: boolean;
  failed: boolean;
} {
  const [state, setState] = useState<State>(() =>
    cached
      ? { products: cached.products, failed: false, loaded: true }
      : { products: [], failed: false, loaded: false },
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load()
      .then((products) => {
        if (!cancelled) setState({ products, failed: false, loaded: true });
      })
      .catch(() => {
        // Keep whatever was already loaded; only report failure if there is nothing to show.
        if (!cancelled) setState((prev) => ({ ...prev, failed: !prev.loaded }));
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    products: state.products,
    loading: enabled && !state.loaded && !state.failed,
    failed: state.failed,
  };
}
