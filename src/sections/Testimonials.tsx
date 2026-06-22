"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TESTIMONIALS } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { StarIcon } from "@/components/ui/Icons";

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const current = TESTIMONIALS[index];

  return (
    <section className="bg-ink py-20 text-cream lg:py-28">
      <Container className="flex flex-col items-center text-center">
        <p className="eyebrow text-cream/60">Loved by our community</p>
        <div className="mt-6 flex gap-1 text-cream">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="h-4 w-4" />
          ))}
        </div>

        <div className="relative mt-8 flex min-h-[180px] max-w-3xl items-center">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-display text-2xl italic leading-snug text-cream sm:text-3xl">
                “{current.quote}”
              </p>
              <footer className="mt-6 text-sm text-cream/70">
                {current.author} — {current.location}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-cream" : "w-1.5 bg-cream/30"
              }`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
