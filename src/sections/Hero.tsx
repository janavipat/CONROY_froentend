"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Full-bleed hero banner — mirrors the live storefront's image-banner with the
 * "Soft Comfort / Bold Looks" heading overlaid on the brand's editorial collage.
 */
export function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[78vh] min-h-[480px] w-full overflow-hidden sm:h-[86vh] lg:h-[88vh]">
        <motion.div
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease }}
          className="absolute inset-0"
        >
          <Image
            src="/brand/hero.jpg"
            alt="CONROY premium denim — Soft Comfort, Bold Looks"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/20" />

        {/* Overlay copy */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 text-center sm:pb-20 lg:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="eyebrow text-white/85"
          >
            Modern everyday looks
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="mt-4 max-w-3xl px-6 font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl lg:text-7xl"
          >
            Soft Comfort
            <br />
            Bold Looks
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.42 }}
            className="mt-8"
          >
            <Link
              href="/collections/all"
              className="inline-flex h-13 items-center justify-center rounded-pill bg-white px-10 text-[0.78rem] tracking-[0.01em] text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
            >
              Shop Collection
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
