"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { SITE } from "@/lib/site";
import { formatCurrency } from "@/utils/format";
import { productDisplayTitle, productLabel } from "@/lib/catalog-taxonomy";
import { DiscountBadge } from "./DiscountBadge";
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
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);
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
            {primaryFailed ? (
              /* A failed photograph used to paint the browser's own alt text
                 across the frame — a paragraph of sentence-case copy sprawling
                 over the card. The frame keeps its ground and shows the
                 wordmark instead; the product name is still on the link above,
                 so nothing is lost to assistive tech. */
              <span className="absolute inset-0 grid place-items-center bg-mist">
                <span className="font-display text-[0.5rem] uppercase tracking-[0.28em] text-stone sm:text-[0.625rem]">
                  {SITE.name}
                </span>
              </span>
            ) : (
              <>
                <Image
                  src={primary.src}
                  alt=""
                  fill
                  priority={priority}
                  onError={() => setPrimaryFailed(true)}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-[opacity,transform] duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03] group-hover:opacity-0"
                />
                {!secondaryFailed && (
                  <Image
                    src={secondary.src}
                    alt=""
                    fill
                    onError={() => setSecondaryFailed(true)}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover opacity-0 transition-[opacity,transform] duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03] group-hover:opacity-100"
                  />
                )}
              </>
            )}
          </Link>

          {/* Solid label, not bare text — set at the foot of the frame.

              It used to sit top-left, which put it across the model's face:
              the label is a fixed width on a card that is not, so on a phone's
              two-up grid it reached three-quarters of the way across, exactly
              where a centred head is. Measuring it at every breakpoint, it
              still crossed the head at 1024 and only just cleared it at 1440,
              so moving the breakpoint was never going to be the fix. The foot
              of the frame is legs and studio floor at every width.

              On lg it lifts clear of the quick-view band, which slides up from
              the bottom edge on hover and would otherwise cover it. */}
          {product.badge && (
            <span className="absolute bottom-4 left-4 rounded-(--radius-button) bg-red-600 px-2 py-1 text-[0.5rem] font-medium uppercase leading-none tracking-[0.08em] text-white lg:bottom-16">
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

        <div className="mt-5 flex w-full min-w-0 flex-col items-start gap-2">
          {/* Reserves three lines on phones so a two- and a three-line name
              don't push their cards' prices and ratings out of step with each
              other. Names still wrap in full — nothing is clamped — and the
              reservation is dropped from sm: up, where the grid is wider and
              names fit on one or two lines anyway. */}
          <Link
            href={`/products/${product.handle}`}
            className="display-product min-h-[4rem] w-full break-words text-ink transition-colors duration-(--duration-quick) hover:text-accent sm:min-h-0"
          >
            {productDisplayTitle(product)}
          </Link>
          {/* Selling price first, then the struck-through original, then the
              saving. Wraps as whole items — in a two-column phone grid the
              three together are wider than the card, and as a nowrap row they
              spilled past its edge. Each part stays on one line, so the badge
              drops whole rather than splitting. */}
          <span className="price flex w-full flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="whitespace-nowrap text-ink">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <s className="whitespace-nowrap text-[0.8125rem] text-stone">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </s>
            )}
            <DiscountBadge percent={product.discountPercent} className="text-[0.8125rem]" />
          </span>
          {/* Denim shows its fit; a T-shirt shows its fabric collection and
              never borrows a denim fit label. */}
          <p className="micro-label">{productLabel(product)}</p>
          <Rating value={product.rating} count={product.reviewCount} showCount={false} />
        </div>
      </article>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
