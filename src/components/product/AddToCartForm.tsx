"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import {
  clearPendingCartItem,
  readPendingCartItem,
  setPendingCartItem,
} from "@/lib/pending-cart";
import { useToast } from "@/components/ui/Toast";
import { trackCartAdd } from "@/services/analytics";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";

/** Size + quantity selector with add-to-cart. Shared by Quick View and PDP. */
export function AddToCartForm({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  /** Returns the chosen size, or null (flagging + toasting the error). */
  function requireSize(): string | null {
    if (!size) {
      setError(true);
      toast("Please select a size first.", "error");
      return null;
    }
    return size;
  }

  /** Puts the item in the cart. Callers must have checked sign-in already. */
  function commitAdd(chosen: string, qty: number) {
    addItem({
      productHandle: product.handle,
      title: product.title,
      image: product.images[0].src,
      price: product.price,
      currency: product.currency,
      size: chosen,
      fit: product.fit,
      quantity: qty,
    });
    // Recorded the moment it's added — independent of whether an order ever
    // follows. Price is the price right now, so history can't be rewritten.
    trackCartAdd(
      product.handle,
      { phone: user?.phone },
      { size: chosen, quantity: qty, price: product.price, currency: product.currency },
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  /**
   * Signed out? Park the intent and send them to the existing login page —
   * nothing goes in the cart. `resumedRef` picks it back up on return.
   * Returns true when the caller should stop.
   */
  function redirectedToLogin(chosen: string): boolean {
    if (user) return false;
    setPendingCartItem({ handle: product.handle, size: chosen, quantity });
    toast("Please sign in to add items to your cart.", "info");
    router.push("/account/login");
    return true;
  }

  function handleAdd() {
    const chosen = requireSize();
    if (!chosen) return;
    if (redirectedToLogin(chosen)) return;
    commitAdd(chosen, quantity);
  }

  function handleBuyNow() {
    const chosen = requireSize();
    if (!chosen) return;
    if (redirectedToLogin(chosen)) return;
    commitAdd(chosen, quantity);
    router.push("/cart");
  }

  // Resume the add the visitor was blocked on before signing in. Guarded by a
  // ref so a re-render can never add the same item twice.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!user || resumedRef.current) return;
    const pending = readPendingCartItem();
    if (!pending || pending.handle !== product.handle) return;
    if (!product.sizes.includes(pending.size)) {
      clearPendingCartItem();
      return;
    }
    resumedRef.current = true;
    clearPendingCartItem();
    // Mirrors the selection the visitor made before signing in, so the form
    // matches what just went into the cart. Runs once, guarded by resumedRef.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(pending.size);
    setQuantity(pending.quantity);
    commitAdd(pending.size, pending.quantity);
    toast("Signed in — added to your cart.", "success");
    // commitAdd/toast are stable for this product; re-running on every render
    // would re-add the item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product.handle]);

  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-9")}>
      {/* Sizes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow text-ink">Size</span>
          <span className="text-xs text-stone">{product.fit}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSize(s);
                setError(false);
              }}
              className={cn(
                "grid h-11 min-w-11 place-items-center rounded-md border px-3 text-sm transition-colors",
                size === s
                  ? "border-ink bg-ink text-cream"
                  : error
                    ? "border-accent text-ink"
                    : "border-line text-ink hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent">
            <span aria-hidden>⚠</span> Please select a size to continue.
          </p>
        )}
      </div>

      {/* Quantity + actions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-stretch gap-4">
          <div className="flex items-center border border-line">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="grid h-11 w-11 place-items-center text-ink hover:bg-ink/5"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="grid h-11 w-11 place-items-center text-ink hover:bg-ink/5"
              aria-label="Increase quantity"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={handleAdd} className="flex-1" size={compact ? "md" : "lg"}>
            {added ? (
              <>
                <CheckIcon className="h-4 w-4" /> Added
              </>
            ) : (
              "Add to cart"
            )}
          </Button>
        </div>
        {!compact && (
          <Button onClick={handleBuyNow} variant="outline" size="lg">
            Buy it now
          </Button>
        )}
      </div>
    </div>
  );
}
