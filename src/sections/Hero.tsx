"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const ease = [0.16, 1, 0.3, 1] as const;
/** Time each slide holds before advancing. Drives the progress bars too. */
const AUTOPLAY_MS = 6000;

interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  /** Two lines, stacked like the live storefront's banner. */
  title: [string, string];
  cta: { label: string; href: string };
}

const SLIDES: Slide[] = [
  {
    image: "/brand/hero.jpg",
    alt: "CONROY premium denim — Soft Comfort, Bold Looks",
    eyebrow: "Modern everyday looks",
    title: ["Soft Comfort", "Bold Looks"],
    cta: { label: "Shop Collection", href: "/collections/all" },
  },
  {
    image: "/brand/banner1.png",
    alt: "CONROY Bleu Heritage — heritage indigo denim",
    eyebrow: "Heritage indigo",
    title: ["Bleu", "Heritage"],
    cta: { label: "Explore Now", href: "/collections/romano-fit-bleu-heritage" },
  },
  {
    image: "/brand/banner2.jpg",
    alt: "CONROY Noir Classique — washed black denim",
    eyebrow: "Washed black",
    title: ["Noir", "Classique"],
    cta: { label: "Explore Now", href: "/collections/romano-fit-noir-classique" },
  },
];

/**
 * Full-bleed hero slider — a rotating set of image banners with overlaid
 * editorial copy, arrow controls and progress bars, in the spirit of
 * ralphlauren.global's brand banner.
 */
export function Hero() {
  const [index, setIndex] = useState(0);
  // Pause the rotation while the visitor is interacting with the banner.
  const [paused, setPaused] = useState(false);
  // The copy must never sit at opacity 0 waiting on a reveal that won't play.
  const reduce = useReducedMotion();

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, go]);

  const slide = SLIDES[index];

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="CONROY featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[78vh] min-h-[480px] w-full overflow-hidden sm:h-[86vh] lg:h-[88vh]">
        {/* Background images — crossfade, with a slow Ken Burns push on the active one */}
        {SLIDES.map((s, i) => (
          <motion.div
            key={s.image}
            aria-hidden={i !== index}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 0.9, ease }}
          >
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ scale: i === index ? 1.08 : 1 }}
              transition={{ duration: AUTOPLAY_MS / 1000 + 2, ease: "linear" }}
            >
              <Image
                src={s.image}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        ))}

        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />

        {/* Overlay copy — keyed on the slide so it remounts and animates in.
            Deliberately no exit animation: the new copy must appear even if an
            outgoing animation can't run (reduced motion, background tab). */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 text-center sm:pb-28 lg:pb-32">
          <motion.div
            key={index}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-col items-center"
          >
            <p className="eyebrow text-white/85">{slide.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl px-6 font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              {slide.title[0]}
              <br />
              {slide.title[1]}
            </h1>
            <div className="mt-8">
              <Link
                href={slide.cta.href}
                className="inline-flex h-13 items-center justify-center rounded-pill bg-white px-10 text-[0.78rem] tracking-[0.01em] text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
              >
                {slide.cta.label}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Arrows (desktop) */}
        <button
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="absolute left-5 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink lg:grid"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="absolute right-5 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-ink lg:grid"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        {/* Progress bars — click to jump; the active one fills over AUTOPLAY_MS */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2.5 px-6 sm:bottom-10">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}: ${s.title.join(" ")}`}
              aria-current={i === index}
              className="group h-6 w-12 sm:w-16"
            >
              <span className="relative block h-[3px] w-full overflow-hidden rounded-pill bg-white/35 transition-colors group-hover:bg-white/55">
                {i === index ? (
                  <motion.span
                    // Keyed on index so the fill restarts for each slide.
                    key={`fill-${index}-${paused}`}
                    initial={{ width: paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: "linear" }}
                    className="absolute inset-y-0 left-0 block rounded-pill bg-white"
                  />
                ) : (
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 block rounded-pill bg-white transition-all",
                      i < index ? "w-full opacity-60" : "w-0",
                    )}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
