"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
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

  function handleAdd() {
    const chosen = requireSize();
    if (!chosen) return;
    addItem({
      productHandle: product.handle,
      title: product.title,
      image: product.images[0].src,
      price: product.price,
      currency: product.currency,
      size: chosen,
      fit: product.fit,
      quantity,
    });
    trackCartAdd(product.handle, { phone: user?.phone }); // analytics: added-to-cart (attributed if signed in)
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    if (!requireSize()) return;
    handleAdd();
    router.push("/cart");
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-4" : "gap-6")}>
      {/* Sizes */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="eyebrow text-ink">Size</span>
          <span className="text-xs text-stone">{product.fit}</span>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent">
            <span aria-hidden>⚠</span> Please select a size to continue.
          </p>
        )}
      </div>

      {/* Quantity + actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-3">
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

      <p className="text-xs text-stone">
        Hurry — only {product.stock} item(s) left in stock.
      </p>
    </div>
  );
}
