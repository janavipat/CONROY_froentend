import Image from "next/image";
import { Button } from "@/components/ui/Button";

/**
 * Full-screen brand image with minimal overlaid copy — a single held frame
 * rather than a rotating banner. Nothing moves, nothing competes: the
 * photograph carries the season and the type stays out of its way.
 *
 * The scrim is a single flat wash rather than a gradient. A gradient is the
 * usual reflex here, but it reads as a graphic effect laid over the picture;
 * one even veil at low opacity does the legibility job and leaves the
 * photograph looking photographed.
 */
export function Hero() {
  return (
    <section className="relative" aria-label="CONROY featured collection">
      <div className="relative h-[88vh] min-h-[540px] w-full overflow-hidden">
        <Image
          src="/brand/hero.jpg"
          alt="CONROY premium denim — Soft Comfort, Bold Looks"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Legibility veil — flat, no gradient. */}
        <div className="absolute inset-0 bg-ink/25" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 text-center sm:pb-28 lg:pb-32">
          <p className="eyebrow text-white/80">Modern everyday looks</p>
          <h1 className="display-hero mt-6 max-w-4xl px-6 text-white">
            Soft Comfort
            <br />
            Bold Looks
          </h1>
          {/* Light variant: black would disappear against the photograph. */}
          <Button href="/collections/all" variant="light" size="lg" className="mt-10">
            Shop the collection
          </Button>
        </div>
      </div>
    </section>
  );
}
