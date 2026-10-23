"use client";

import { useEffect, useRef } from "react";
import { trackPixelViewContent } from "@/lib/meta-pixel";

/** Reports a product detail view to the Meta Pixel, once per product shown. */
export function MetaViewContent({
  handle,
  title,
  price,
  currency,
}: {
  handle: string;
  title: string;
  price: number;
  currency: string;
}) {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (sent.current === handle) return;
    sent.current = handle;
    trackPixelViewContent({ id: handle, name: title, price, currency });
  }, [handle, title, price, currency]);

  return null;
}
