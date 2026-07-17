"use client";

import { useEffect, useState } from "react";
import { getActiveOffer, offerHeadline, type ActiveOffer } from "@/services/offers";

/**
 * Top promotional marquee — only shown when an offer is active. It scrolls the
 * active offer's headline; with no offer, nothing renders.
 */
export function AnnouncementBar() {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      const o = await getActiveOffer();
      if (active) setOffer(o);
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  if (!offer) return null;

  const headline = offerHeadline(offer);
  // Repeat the headline so the marquee track loops seamlessly.
  const track = Array.from({ length: 8 }, () => headline);

  return (
    <div className="overflow-hidden bg-accent text-white">
      <div className="flex w-max animate-marquee whitespace-nowrap py-2.5">
        {track.map((msg, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-8 text-[0.68rem] font-medium uppercase tracking-[0.08em]"
          >
            {msg}
            <span aria-hidden className="text-white/50">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
