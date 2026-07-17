"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { PRODUCTS } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const VALUES = [
  "Honest materials, crafted with integrity",
  "Enduring silhouettes, refined through time",
  "Functional elegance for everyday living",
  "Thoughtful craftsmanship honouring tradition",
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function Philosophy() {
  const imgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ["start end", "end start"] });
  // Image drifts as you scroll past — cinematic parallax.
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  // Never hide content behind a reveal that won't play: with reduced motion we
  // start in the final state instead of at opacity 0.
  const reduce = useReducedMotion();

  return (
    <section className="overflow-hidden bg-sage py-16 sm:py-20 lg:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Image — parallax + ambient Ken Burns motion (video-like) */}
          <div ref={imgRef}>
            <motion.div
              initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/5] overflow-hidden rounded-media bg-mist shadow-[0_25px_60px_-35px_rgba(0,0,0,0.45)]"
            >
              <motion.div style={{ y }} className="absolute inset-[-9%_0] will-change-transform">
                <div className="ken-burns absolute inset-0">
                  <Image
                    src={PRODUCTS[2].images[0].src}
                    alt="CONROY craftsmanship"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </motion.div>

              {/* subtle bottom fade + floating badge */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
              <span className="animate-float absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ink shadow-sm">
                Made in India
              </span>
            </motion.div>
          </div>

          {/* Text — staggered reveal */}
          <motion.div
            variants={container}
            initial={reduce ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p variants={item} className="eyebrow text-stone">
              Our Philosophy
            </motion.p>
            <motion.h2
              variants={item}
              className="mt-4 font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]"
            >
              Style that whispers, rather than shouts.
            </motion.h2>
            <motion.p variants={item} className="mt-6 text-base leading-relaxed text-ink-soft">
              True luxury is neither loud nor fleeting — it is quietly confident, meticulously
              crafted and built to endure. Every fabric is chosen for its integrity; every detail
              shaped by artisans who understand that excellence is not an act, but a long-standing
              tradition.
            </motion.p>

            <ul className="mt-8 space-y-3">
              {VALUES.map((value) => (
                <motion.li key={value} variants={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                  <span className="text-[0.95rem] text-ink-soft">{value}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div variants={item} className="mt-9">
              <Button href="/about" variant="outline">
                Read our story
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
