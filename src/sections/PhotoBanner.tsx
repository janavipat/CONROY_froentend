import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/utils/cn";

/**
 * A full-width campaign photograph that links to a collection.
 *
 * The campaign artwork carries its own headline and "check out" line, so
 * nothing is overlaid and there is no darkening veil: the picture is the
 * banner. On desktop it is shown whole, at its own 2000 × 1091 proportion, so
 * the lettering is never cropped. Phones get a taller 3:2 frame (the full
 * proportion would leave a strip barely 200px high); `mobilePosition` picks
 * which part of the frame that crop keeps.
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
  return (
    <section className={className}>
      <Link
        href={href}
        aria-label={label}
        className="group relative block aspect-[3/2] w-full overflow-hidden bg-mist sm:aspect-[2000/1091] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      >
        <SafeImage
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={cn(
            "object-cover transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.015] sm:object-center",
            mobilePosition === "left" && "object-left",
            mobilePosition === "center" && "object-center",
            mobilePosition === "right" && "object-right",
          )}
        />
      </Link>
    </section>
  );
}
