"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

const CDN = "https://cdn.shopify.com/s/files/1/0763/6248/1899/files";

interface Shop {
  title: string;
  href: string;
  image: string;
}

/** Entry points into the catalogue — mirrors RL's "The Shops" rail. */
const SHOPS: Shop[] = [
  {
    title: "Straight Fit",
    href: "/products/pants",
    image: `${CDN}/3_1_jpg.jpg?v=1771951023`,
  },
  {
    title: "Relax Fit",
    href: "/products/the-comfort-true-blue",
    image: `${CDN}/4_1_jpg.jpg?v=1771951309`,
  },
  {
    title: "Noir Classique",
    href: "/collections/romano-fit-noir-classique",
    image: `${CDN}/3_3_jpg.jpg?v=1771951023`,
  },
  {
    title: "Bleu Heritage",
    href: "/collections/romano-fit-bleu-heritage",
    image: `${CDN}/2_7_jpg.jpg?v=1771950828`,
  },
  {
    title: "Black Denim",
    href: "/products/the-comfort-deep-black",
    image: `${CDN}/3_4_jpg.jpg?v=1771950996`,
  },
  {
    title: "All Denim",
    href: "/collections/all",
    image: `${CDN}/4_2_jpg.jpg?v=1771951311`,
  },
];

/** Gold diamond-and-rule ornament under the heading. */
function Ornament() {
  return (
    <div aria-hidden className="mt-5 flex items-center gap-2">
      <span className="h-px w-14 bg-gold/45" />
      <span className="h-1.5 w-1.5 rotate-45 border border-gold/80" />
      <span className="h-px w-7 bg-gold/45" />
      <span className="h-1.5 w-1.5 rotate-45 border border-gold/80" />
      <span className="h-px w-14 bg-gold/45" />
    </div>
  );
}

/**
 * "The Shops" — a navy editorial panel beside a horizontal rail of gold-framed
 * entry points into the catalogue. Modelled on ralphlauren.global's brand-page
 * shops rail.
 */
export function ShopsSlider() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.6 * dir, behavior: "smooth" });
  }

  const arrow = (dir: number, label: string, Icon: typeof ChevronLeftIcon) => (
    <button
      aria-label={label}
      onClick={() => scroll(dir)}
      className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink"
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  return (
    <section className="overflow-hidden border-y border-gold/25 bg-ink py-20 lg:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_2.7fr] lg:items-center lg:gap-16">
          {/* Left — navy editorial panel */}
          <Reveal className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h2 className="font-display leading-[0.9] text-gold">
              <span className="block text-3xl italic sm:text-4xl">The</span>
              <span className="mt-1 block text-6xl tracking-[0.01em] sm:text-7xl">Shops</span>
            </h2>
            <Ornament />
            <p className="mt-6 max-w-xs text-[0.95rem] leading-[1.9] text-gold/70">
              Destinations for CONROY style, from timeless classics to new collections.
            </p>
            <div className="mt-8 hidden gap-2.5 lg:flex">
              {arrow(-1, "Previous shops", ChevronLeftIcon)}
              {arrow(1, "Next shops", ChevronRightIcon)}
            </div>
          </Reveal>

          {/* Right — gold-framed tiles */}
          <div
            ref={trackRef}
            className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SHOPS.map((s, i) => (
              <Reveal
                key={s.title}
                index={i}
                as="article"
                className="shrink-0 basis-[70%] snap-start sm:basis-[44%] lg:basis-[30%]"
              >
                <Link href={s.href} className="group relative block overflow-hidden bg-ink">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 44vw, 30vw"
                      className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
                    />

                    {/* Scrim so the title stays legible over any photo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />

                    {/* Double gold frame — the nested rule is what reads as
                        couture rather than a plain bordered card. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-3 border border-gold/70 transition-colors duration-500 group-hover:border-gold sm:inset-4"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[0.95rem] border border-gold/25 transition-colors duration-500 group-hover:border-gold/50 sm:inset-[1.35rem]"
                    />

                    {/* Title, overlaid like RL */}
                    <h3 className="absolute inset-x-0 bottom-0 px-7 pb-8 text-center font-display text-[1.7rem] leading-tight text-white sm:text-3xl">
                      {s.title}
                    </h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mobile arrows */}
        <div className="mt-8 flex justify-center gap-2.5 lg:hidden">
          {arrow(-1, "Previous shops", ChevronLeftIcon)}
          {arrow(1, "Next shops", ChevronRightIcon)}
        </div>
      </Container>
    </section>
  );
}
