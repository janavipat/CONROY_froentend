"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/Container";

const IMAGE =
  "https://cdn.shopify.com/s/files/1/0763/6248/1899/files/2_7_jpg.jpg?v=1771950828";

/**
 * A cinematic, video-like editorial band — a full-bleed image with a continuous
 * Ken Burns drift (ambient motion, like a looping film) plus scroll parallax and
 * a headline that reveals into view. Mirrors ralphlauren.global's Discover feel.
 */
export function CampaignBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Parallax: the image drifts slower than the page as you scroll past.
  const y = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);
  // With reduced motion, start in the final state so the copy is never stuck
  // invisible waiting on a reveal that won't play.
  const reduce = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative flex min-h-[560px] items-center overflow-hidden bg-ink lg:min-h-[80vh]"
    >
      {/* Parallax layer (translate) wraps the Ken-Burns layer (scale/pan) so the
          two transforms never fight. */}
      <motion.div style={{ y }} className="absolute inset-[-14%_0] will-change-transform">
        <div className="ken-burns absolute inset-0">
          <Image src={IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      </motion.div>

      {/* Navy scrim — deep behind the copy on the left so the headline stays
          readable, easing off to the right so the photograph is still visible.
          A flat wash strong enough to read as navy would hide the image. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/25" />

      {/* Gentle top/bottom vignette for depth. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/25" />

      <Container className="relative z-10 py-24">
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl"
        >
          <motion.p
            className="text-[0.72rem] font-medium uppercase tracking-[0.3em] text-white/70"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            The CONROY Film
          </motion.p>
          <h2 className="mt-5 font-display text-4xl leading-[1.03] text-white sm:text-5xl lg:text-6xl">
            Made to move
            <br />
            with you.
          </h2>
          <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-white/85">
            Honest indigo, softened by wear. A film of everyday moments in denim built to be
            lived in — and passed on.
          </p>
          <Link
            href="/collections/all"
            className="mt-9 inline-flex h-12 items-center justify-center rounded-pill border border-white/70 px-10 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-white hover:text-ink"
          >
            Explore the collection
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
