"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { Rating } from "@/components/ui/Rating";
import { LikeButton } from "./LikeButton";
import { QuickViewModal } from "./QuickViewModal";

/**
 * Minimal product card: a tall image doing all the work, with the name, price
 * and fit set quietly beneath it.
 *
 * There is no card. No border, no surface, no radius, no resting or hover
 * shadow — the photograph sits directly on the page ground and the type sits
 * under it. The only motion is the second image crossfading in over a long
 * beat, and the quick-view bar arriving as a flat white band rather than a
 * gradient wash.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [quickView, setQuickView] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];

  return (
    <>
      <article className="group flex flex-col">
        {/* 3:4 — a taller frame reads as editorial, and it is the crop the
            studio photography was shot for. The mist ground matches the
            backdrop in those frames, so the fill never shows as a seam. */}
        <div className="relative aspect-[3/4] overflow-hidden bg-mist">
          <Link href={`/products/${product.handle}`} aria-label={product.title}>
            <Image
              src={primary.src}
              alt={primary.alt}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-[opacity,transform] duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03] group-hover:opacity-0"
            />
            <Image
              src={secondary.src}
              alt={secondary.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-[opacity,transform] duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03] group-hover:opacity-100"
            />
          </Link>

          {/* Solid label, not bare text. `top-4 left-4` mirrors the wishlist
              icon's inset on the opposite corner so the two sit level. */}
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-(--radius-button) bg-red-600 px-2 py-1 text-[0.5rem] font-medium uppercase leading-none tracking-[0.08em] text-white">
              {product.badge}
            </span>
          )}

          <LikeButton
            handle={product.handle}
            className="absolute right-4 top-4 opacity-0 transition-opacity duration-(--duration-base) focus-within:opacity-100 group-hover:opacity-100"
          />

          {/* Quick view — a flat white band at the foot. A gradient scrim was
              the one piece of decoration left on the card. */}
          <button
            onClick={() => setQuickView(true)}
            className="nav-label absolute inset-x-0 bottom-0 translate-y-full bg-white/95 py-4 text-ink transition-transform duration-(--duration-base) ease-[var(--ease-luxe)] group-hover:translate-y-0 focus-visible:translate-y-0"
          >
            Quick view
          </button>
        </div>

        <div className="mt-5 flex flex-col items-start gap-2">
          <Link
            href={`/products/${product.handle}`}
            className="display-product text-ink transition-colors duration-(--duration-quick) hover:text-accent"
          >
            {product.title}
          </Link>
          {/* Selling price first, then the struck-through original. */}
          <span className="price flex items-baseline gap-2.5">
            <span className="text-ink">{formatCurrency(product.price, product.currency)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <s className="text-[0.8125rem] text-stone">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </s>
            )}
          </span>
          <p className="micro-label">{product.fit}</p>
          <Rating value={product.rating} count={product.reviewCount} showCount={false} />
        </div>
      </article>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
