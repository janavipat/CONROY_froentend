"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/types";
import { applyOffer, type ApplyOfferResult } from "@/services/offers";

/** The cart reduced to what the server needs to price it. */
function cartKey(items: CartItem[]): string {
  return JSON.stringify(
    items.map((i) => [i.productHandle, i.size, i.quantity]).sort(),
  );
}

/**
 * The server's pricing for a cart: subtotal, discount and payable total.
 *
 * Deliberately a fetch rather than a local calculation. The same
 * `computeDiscount` on the server decides the cart quote, the COD order, the
 * Razorpay amount and what is saved on the order — so asking it here is what
 * guarantees the figure a shopper sees is the figure they are charged. A
 * client-side copy of the tier rules would be a second source of truth, and
 * the one that drifted would be the one on screen.
 *
 * Re-quotes whenever the cart changes, debounced so holding the quantity
 * stepper doesn't fire a request per tick.
 *
 * The quote is stored with the cart it was priced for and only returned when
 * that still matches. A reply for a 1-item cart can therefore never be shown
 * against a 2-item one: while a new quote is in flight the caller gets null
 * and falls back to the plain subtotal, rather than a total that is briefly
 * wrong. Money is worth the flicker.
 */
export function useOfferQuote(items: CartItem[], code?: string) {
  const [priced, setPriced] = useState<{ key: string; result: ApplyOfferResult | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const key = cartKey(items);
  const empty = items.length === 0;

  useEffect(() => {
    if (empty) return;

    let stale = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await applyOffer(items, code);
      if (stale) return;
      setPriced({ key, result });
      setLoading(false);
    }, 200);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // `key` stands in for `items`: same contents, stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, code, empty]);

  return {
    quote: !empty && priced?.key === key ? priced.result : null,
    loading,
  };
}
