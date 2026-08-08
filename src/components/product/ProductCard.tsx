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
 * and fit set quietly beneath it. No border, no card surface, no hover panel —
 * the only motion is the second image crossfading in over a long beat.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [quickView, setQuickView] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];

  return (
    <>
      <article className="group flex flex-col">
        {/* 3:4 rather than 4:5 — a taller frame reads as editorial. The shadow
            is a hover-only lift: at rest the card has no box at all. */}
        <div className="relative aspect-[3/4] overflow-hidden bg-mist transition-shadow duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:shadow-(--shadow-lift)">
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

          {product.badge && (
            <span className="eyebrow absolute left-5 top-5 text-ink">{product.badge}</span>
          )}

          <LikeButton
            handle={product.handle}
            className="absolute right-4 top-4 opacity-0 transition-opacity duration-(--duration-base) focus-within:opacity-100 group-hover:opacity-100"
          />

          {/* Quick view — a hairline word at the foot, not a filled bar. */}
          <button
            onClick={() => setQuickView(true)}
            className="nav-label absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent py-6 text-white opacity-0 transition-opacity duration-(--duration-base) ease-[var(--ease-luxe)] group-hover:opacity-100"
          >
            Quick view
          </button>
        </div>

        <div className="mt-7 flex flex-col items-start gap-2.5">
          <Link
            href={`/products/${product.handle}`}
            className="display-product text-ink transition-colors duration-(--duration-quick) hover:text-accent"
          >
            {product.title}
          </Link>
          {/* Selling price first, then the struck-through original. */}
          <span className="flex items-baseline gap-2.5 text-[0.9375rem] tracking-[0.02em]">
            <span className="text-ink">{formatCurrency(product.price, product.currency)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <s className="text-[0.8125rem] text-stone">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </s>
            )}
          </span>
          <p className="text-[0.75rem] uppercase tracking-[0.14em] text-stone">{product.fit}</p>
          <Rating value={product.rating} count={product.reviewCount} showCount={false} />
        </div>
      </article>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
