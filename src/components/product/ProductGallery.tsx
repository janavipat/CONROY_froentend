"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types";
import { cn } from "@/utils/cn";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);

  return (
    /* lg:items-start is load-bearing. The gallery is a grid item, so it
       stretches to the row height set by the taller info column, and a flex
       row stretches its children to match — which overrode the main image's
       aspect-[4/5] and let the image grow as tall as the copy beside it.
       Starting the items keeps the declared 4:5 ratio, so every product gets
       the same frame regardless of how much description it carries.
       Only from lg: below that the gallery is a column and stretch is what
       makes the image span the full width. */
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-start">
      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={cn(
              "relative h-20 w-16 shrink-0 overflow-hidden bg-mist transition-opacity lg:h-24 lg:w-20",
              active === i ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100",
            )}
          >
            <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-media bg-mist">
        <Image
          key={images[active].src}
          src={images[active].src}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
