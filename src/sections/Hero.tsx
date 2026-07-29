import Image from "next/image";
import { Button } from "@/components/ui/Button";

/**
 * Full-screen brand image with minimal overlaid copy — a single held frame
 * rather than a rotating banner. Nothing moves, nothing competes: the
 * photograph carries the season and the type stays out of its way.
 */
export function Hero() {
  return (
    <section className="relative" aria-label="CONROY featured collection">
      <div className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
        <Image
          src="/brand/hero.jpg"
          alt="CONROY premium denim — Soft Comfort, Bold Looks"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Legibility scrim — weighted to the foot, where the copy sits. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-black/15" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-32 text-center sm:pb-40 lg:pb-48">
          <p className="eyebrow text-white/70">Modern everyday looks</p>
          <h1 className="display-hero mt-8 max-w-4xl px-6 text-white">
            Soft Comfort
            <br />
            Bold Looks
          </h1>
          {/* Light variant: navy would disappear against the photograph. */}
          <Button href="/collections/all" variant="light" size="lg" className="mt-14">
            Shop the collection
          </Button>
        </div>
      </div>
    </section>
  );
}
