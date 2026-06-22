"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types";
import { cn } from "@/utils/cn";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
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
