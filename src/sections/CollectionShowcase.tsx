"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

const CDN = "https://cdn.shopify.com/s/files/1/0763/6248/1899/files";

interface Tile {
  eyebrow: string;
  title: string;
  href: string;
  image: string;
}

const TILES: Tile[] = [
  {
    eyebrow: "Bestseller",
    title: "Noir Classique",
    href: "/collections/romano-fit-noir-classique",
    image: `${CDN}/3_3_jpg.jpg?v=1771951023`,
  },
  {
    eyebrow: "New in",
    title: "Bleu Heritage",
    href: "/collections/romano-fit-bleu-heritage",
    image: `${CDN}/4_1_jpg.jpg?v=1771951309`,
  },
  {
    eyebrow: "Trending",
    title: "The Relax Fit",
    href: "/collections/romano-fit-noir-classique",
    image: `${CDN}/1.1.jpg_2_f47254ce-4b73-4cfe-87d8-4fbf77e25ccd.jpg?v=1773538477`,
  },
  {
    eyebrow: "The edit",
    title: "All Denim",
    href: "/collections/all",
    image: `${CDN}/2_7_jpg.jpg?v=1771950828`,
  },
];

/** Editorial "Discover / What's New" slider, mirroring ralphlauren.global. */
export function CollectionShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.72 * dir, behavior: "smooth" });
  }

  const arrow = (dir: number, label: string, Icon: typeof ChevronLeftIcon) => (
    <button
      aria-label={label}
      onClick={() => scroll(dir)}
      className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  return (
    <section className="overflow-hidden py-14 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_2.6fr] lg:items-center lg:gap-12">
          {/* Left — intro */}
          <Reveal className="lg:pr-4">
            <p className="eyebrow text-stone">Discover</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
              What&apos;s New
            </h2>
            <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-ink-soft">
              The latest campaigns, collections and stories from the world of CONROY.
            </p>
            <div className="mt-8 hidden gap-2.5 lg:flex">
              {arrow(-1, "Previous", ChevronLeftIcon)}
              {arrow(1, "Next", ChevronRightIcon)}
            </div>
          </Reveal>

          {/* Right — horizontal editorial cards */}
          <div
            ref={trackRef}
            className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TILES.map((t, i) => (
              <Reveal
                key={t.title}
                index={i}
                as="article"
                className="shrink-0 basis-[78%] snap-start sm:basis-[46%] lg:basis-[31.5%]"
              >
                <Link
                  href={t.href}
                  className="group relative block overflow-hidden rounded-media bg-mist"
                >
                  <div className="relative aspect-[3/4.1]">
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                      className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-luxe)] group-hover:scale-[1.07]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                  </div>

                  {/* Title overlay (bottom-left, like RL) */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/75">
                      {t.eyebrow}
                    </p>
                    <h3 className="mt-1.5 font-display text-2xl leading-[1.1] text-white sm:text-[1.75rem]">
                      {t.title}
                    </h3>
                    <span className="mt-2.5 inline-flex translate-y-1 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Explore <ChevronRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mobile arrows */}
        <div className="mt-7 flex justify-center gap-2.5 lg:hidden">
          {arrow(-1, "Previous", ChevronLeftIcon)}
          {arrow(1, "Next", ChevronRightIcon)}
        </div>
      </Container>
    </section>
  );
}
