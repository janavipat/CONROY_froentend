"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getActiveOffer, offerHeadline } from "@/services/offers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

/** The house line, always shown — as one line, or part by part on a phone. */
const HOUSE_PARTS = ["Free shipping on all orders", "Easy returns", "Timeless essentials"];
const HOUSE_MESSAGE = HOUSE_PARTS.join(" | ");

/** How long each message stays when there is more than one. */
const ROTATE_MS = 6000;

/**
 * The slim black bar above the header.
 *
 * It always carries the house line. When the admin has an offer running, the
 * offer's headline joins it as a further message. The full line is too wide
 * for a phone, so below 640px its three parts take turns instead. Arrows only
 * appear when there is more than one message to move between.
 */
export function AnnouncementBar() {
  const [offerLine, setOfferLine] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const small = useMediaQuery("(max-width: 639px)");
  const messages = [...(small ? HOUSE_PARTS : [HOUSE_MESSAGE]), ...(offerLine ? [offerLine] : [])];
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    void getActiveOffer().then((offer) => {
      if (active && offer) setOfferLine(offerHeadline(offer));
    });
    return () => {
      active = false;
    };
  }, []);

  const many = messages.length > 1;

  // Gentle auto-advance; never for reduced motion, and paused while the
  // visitor is pointing at or focused inside the bar.
  useEffect(() => {
    if (!many || paused || reduceMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [many, paused, reduceMotion, messages.length]);

  const step = (by: number) => setIndex((i) => (i + by + messages.length) % messages.length);

  return (
    <div
      className="bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-2 sm:px-6">
        {many ? (
          <button
            type="button"
            aria-label="Previous message"
            onClick={() => step(-1)}
            className="grid h-9 w-9 place-items-center text-white/55 transition-colors hover:text-white"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span aria-hidden className="w-9" />
        )}

        <p
          aria-live={many ? "polite" : undefined}
          className="min-w-0 truncate text-center text-[0.625rem] font-medium uppercase tracking-[0.22em] sm:text-[0.6875rem]"
        >
          {messages[index % messages.length]}
        </p>

        {many ? (
          <button
            type="button"
            aria-label="Next message"
            onClick={() => step(1)}
            className="grid h-9 w-9 place-items-center text-white/55 transition-colors hover:text-white"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span aria-hidden className="w-9" />
        )}
      </div>
    </div>
  );
}
