"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  getActiveOffer,
  offerDiscountLabel,
  offerHeadline,
  type ActiveOffer,
} from "@/services/offers";
import { CloseIcon, CheckIcon } from "@/components/ui/Icons";

const SEEN_KEY = "conroy.offerSeen";

/**
 * A celebratory promo popup shown once per browser session when an offer is
 * active — mirroring the discount pop-ups on typical shopping sites.
 */
export function OfferPopup() {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function run() {
      const o = await getActiveOffer();
      if (!active || !o) return;
      // Show once per session per offer.
      if (sessionStorage.getItem(SEEN_KEY) === o.id) return;
      setOffer(o);
      timer = setTimeout(() => setOpen(true), 1200);
    }
    void run();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    if (offer) sessionStorage.setItem(SEEN_KEY, offer.id);
    setOpen(false);
  }

  async function copyCode() {
    if (!offer?.code) return;
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  if (!offer) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close offer"
            onClick={dismiss}
            className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-label="Special offer"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-media bg-white text-center shadow-2xl"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/20"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            {/* Header with the discount */}
            <div className="bg-ink px-6 py-8 text-white">
              <motion.p
                className="eyebrow text-white/60"
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                Limited time offer
              </motion.p>
              <motion.p
                className="mt-2 font-display text-5xl font-semibold tracking-tight"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 16 }}
              >
                {offerDiscountLabel(offer)}
              </motion.p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <h3 className="font-display text-lg text-ink">{offer.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{offerHeadline(offer)}</p>

              {offer.code && (
                <button
                  onClick={copyCode}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-ink/40 bg-mist py-3 text-sm font-medium tracking-[0.14em] text-ink transition-colors hover:border-ink"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-600" /> Copied!
                    </>
                  ) : (
                    <>
                      {offer.code} <span className="text-xs font-normal text-stone">· tap to copy</span>
                    </>
                  )}
                </button>
              )}

              <Link
                href="/collections/all"
                onClick={dismiss}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-pill bg-ink text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
              >
                Shop now
              </Link>
              <button
                onClick={dismiss}
                className="mt-3 text-xs text-stone underline-offset-4 hover:text-ink hover:underline"
              >
                No thanks
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
