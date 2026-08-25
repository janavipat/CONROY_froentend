import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";

const CDN = "https://cdn.shopify.com/s/files/1/0763/6248/1899/files";

/**
 * "Heritage Icons" — a three-panel editorial story: a full-height image either
 * side of a soft centre panel carrying the narrative. Modelled on
 * ralphlauren.global's Heritage Icons / Newport block.
 */
export function HeritageStory() {
  return (
    <section aria-labelledby="heritage-story-title">
      <div className="grid lg:grid-cols-[1.1fr_1fr_1.1fr]">
        {/* Left — lifestyle image */}
        <Reveal className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[44rem]">
          <SafeImage
            src={`${CDN}/4_1_jpg.jpg?v=1771951309`}
            alt="CONROY Bleu Heritage — indigo denim, relaxed fit"
            fill
            sizes="(max-width: 1024px) 100vw, 35vw"
            className="object-cover"
          />
        </Reveal>

        {/* Centre — the story */}
        <Reveal
          index={1}
          className="flex flex-col justify-center bg-mist px-8 py-section sm:px-12 lg:px-14 xl:px-20"
        >
          <p className="eyebrow">Heritage Icons</p>

          <h2
            id="heritage-story-title"
            className="display-section mt-6 text-ink"
          >
            Indigo
          </h2>

          <p className="mt-8 max-w-sm text-body text-ink-soft">
            CONROY draws on the mills of the Indian subcontinent, where indigo has been woven and
            worn for generations — blending that heritage with a quiet, modern ease.
          </p>

          {/* Underlined SHOP NOW, as on the reference */}
          <Link
            href="/collections/romano-fit-bleu-heritage"
            className="eyebrow group mt-12 w-fit border-b border-ink/40 pb-2.5 text-ink transition-colors duration-(--duration-base) hover:border-accent hover:text-accent"
          >
            Shop Now
          </Link>

          {/* Scroll cue with a long rule + arrow */}
          <span
            aria-hidden
            className="eyebrow mt-16 inline-flex items-center gap-3"
          >
            Scroll to explore
            <span className="flex items-center">
              <span className="h-px w-10 bg-stone/60" />
              <ArrowRightIcon className="-ml-1 h-3.5 w-3.5" />
            </span>
          </span>
        </Reveal>

        {/* Right — companion image */}
        <Reveal index={2} className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[44rem]">
          <SafeImage
            src={`${CDN}/3_3_jpg.jpg?v=1771951023`}
            alt="CONROY Noir Classique — washed black denim"
            fill
            sizes="(max-width: 1024px) 100vw, 35vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
