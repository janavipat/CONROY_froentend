"use client";

import { useEffect, useRef, useState } from "react";
import { TESTIMONIALS } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={cn("h-4 w-4", i < rating ? "text-amber-500" : "text-line")} />
      ))}
    </div>
  );
}

/** Customer testimonials — an auto-playing, swipeable slider of review cards. */
export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function step(dir: number) {
    setIndex((cur) => {
      const next = (cur + dir + TESTIMONIALS.length) % TESTIMONIALS.length;
      goTo(next);
      return next;
    });
  }

  // Auto-advance (pauses on hover / focus within the slider).
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => step(1), 4500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Keep the active dot in sync when the user swipes/scrolls manually.
  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setIndex(best);
  }

  return (
    <section className="bg-paper py-16 sm:py-20 lg:py-28">
      <Container>
        <Reveal className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="eyebrow text-stone">Loved by our community</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
              What our customers say
            </h2>
          </div>
          {/* Arrows (desktop) */}
          <div className="hidden gap-2 sm:flex">
            <button
              aria-label="Previous testimonial"
              onClick={() => step(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              aria-label="Next testimonial"
              onClick={() => step(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </Reveal>

        {/* Slider track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="flex shrink-0 basis-[86%] snap-center flex-col rounded-media border border-line bg-white p-7 shadow-sm sm:basis-[47%] lg:basis-[31.8%]"
            >
              <Stars rating={t.rating} />
              <blockquote className="mt-4 flex-1 text-[0.98rem] leading-relaxed text-ink-soft">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-white">
                  {t.author.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{t.author}</span>
                  <span className="block text-xs text-stone">
                    {t.location} · {t.timeframe}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.author}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => {
                setIndex(i);
                goTo(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-ink" : "w-1.5 bg-line hover:bg-stone",
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
