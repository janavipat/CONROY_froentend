"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Rating } from "@/components/ui/Rating";
import { QuickViewModal } from "./QuickViewModal";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [quickView, setQuickView] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];

  return (
    <>
      <article className="group flex flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-media bg-mist">
          <Link href={`/products/${product.handle}`} aria-label={product.title}>
            {/* Primary + hover image */}
            <Image
              src={primary.src}
              alt={primary.alt}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-opacity duration-500 ease-[var(--ease-luxe)] group-hover:opacity-0"
            />
            <Image
              src={secondary.src}
              alt={secondary.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="scale-105 object-cover opacity-0 transition-all duration-700 ease-[var(--ease-luxe)] group-hover:scale-100 group-hover:opacity-100"
            />
          </Link>

          {product.badge && (
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[0.6rem] tracking-[0.01em] text-cream">
              {product.badge}
            </span>
          )}

          {/* Quick view */}
          <button
            onClick={() => setQuickView(true)}
            className={cn(
              "absolute inset-x-3 bottom-3 h-10 bg-cream/95 text-[0.7rem] tracking-[0.01em] text-ink opacity-0 backdrop-blur transition-all duration-300",
              "translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-ink hover:text-cream",
            )}
          >
            Quick view
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/products/${product.handle}`}
              className="font-display text-lg leading-tight text-ink hover:text-stone"
            >
              {product.title}
            </Link>
            <span className="shrink-0 text-sm text-ink">
              {formatCurrency(product.price, product.currency)}
            </span>
          </div>
          <p className="text-xs text-stone">{product.fit}</p>
          <Rating value={product.rating} count={product.reviewCount} showCount={false} />
        </div>
      </article>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}
