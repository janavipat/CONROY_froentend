import Link from "next/link";
import { preload } from "react-dom";
import { cn } from "@/utils/cn";

/**
 * Widths of the pre-built WebP copies in /brand/campaign/, made from the
 * 2000px originals by scripts/build-campaign-images.mjs. 2000 is the
 * originals' own width — nothing is enlarged.
 */
const CAMPAIGN_WIDTHS = [828, 1080, 1440, 2000];

/**
 * How wide the photograph is drawn. From 640px up it is the full viewport
 * width. Below that the 3:2 crop is cover-fitted, so the image is drawn wider
 * than the screen: (2000/1091) ÷ (3/2) ≈ 1.22 × the viewport. Saying "100vw"
 * there made phones fetch a copy ~20% too narrow and enlarge it.
 */
const SIZES = "(min-width: 640px) 100vw, 123vw";

/**
 * A full-width campaign photograph that links to a collection.
 *
 * The campaign artwork carries its own headline and "check out" line, so
 * nothing is overlaid and there is no darkening veil: the picture is the
 * banner. On desktop it is shown whole, at its own 2000 × 1091 proportion, so
 * the lettering is never cropped. Phones get a taller 3:2 frame (the full
 * proportion would leave a strip barely 200px high); `mobilePosition` picks
 * which part of the frame that crop keeps.
 *
 * Served from pre-built static files rather than the Next.js image optimizer.
 * The optimizer is capped at 1080px and quality 75 on this site to stay inside
 * its transformation quota (see next.config.ts), so desktops were enlarging a
 * 1080px, heavily compressed AVIF to 1366–1920px — which is what made the
 * lettering soft. Static copies cost no optimizer quota and can be both wider
 * and higher quality. `src` is the original JPEG, kept as the fallback for
 * browsers without WebP; the copies are named after it.
 */
export function PhotoBanner({
  src,
  alt,
  href,
  label,
  priority = false,
  mobilePosition = "center",
  className,
}: {
  src: string;
  alt: string;
  href: string;
  /** Accessible name for the link — where it goes, not what the photo shows. */
  label: string;
  priority?: boolean;
  mobilePosition?: "left" | "center" | "right";
  className?: string;
}) {
  // "/brand/hero-comfort.jpg" → "/brand/campaign/hero-comfort"
  const base = src.replace(/^\/brand\/(.+)\.jpe?g$/, "/brand/campaign/$1");
  const srcSet = CAMPAIGN_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(", ");

  // The preload next/image's `priority` used to emit, so the hero still starts
  // downloading before the stylesheet and scripts.
  if (priority) {
    preload(`${base}-1440.webp`, {
      as: "image",
      type: "image/webp",
      imageSrcSet: srcSet,
      imageSizes: SIZES,
      fetchPriority: "high",
    });
  }

  return (
    <section className={className}>
      <Link
        href={href}
        aria-label={label}
        className="group relative block aspect-[3/2] w-full overflow-hidden bg-mist sm:aspect-[2000/1091] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      >
        <picture>
          <source type="image/webp" srcSet={srcSet} sizes={SIZES} />
          {/* A plain img: next/image would route it back through the capped
              optimizer. Width/height give the browser the proportion. */}          <img
            src={src}
            alt={alt}
            width={2000}
            height={1091}
            sizes={SIZES}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.015] sm:object-center",
              mobilePosition === "left" && "object-left",
              mobilePosition === "center" && "object-center",
              mobilePosition === "right" && "object-right",
            )}
          />
        </picture>
      </Link>
    </section>
  );
}
