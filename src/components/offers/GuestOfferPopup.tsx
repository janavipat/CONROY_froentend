"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { OFFER_CAMPAIGN } from "@/lib/offer-campaign";
import { CloseIcon } from "@/components/ui/Icons";

/**
 * Seen once per visitor, not once per session.
 *
 * localStorage rather than sessionStorage: "once" should survive closing the
 * tab and coming back tomorrow, otherwise a returning shopper meets the same
 * modal on every visit.
 */
const SEEN_KEY = "conroy.offerPopupSeen";

/**
 * The session key the older sign-in prompt used. Still read, so anyone who
 * waved that away earlier in this session is not shown this immediately after.
 */
const LEGACY_SESSION_KEY = "conroy.loginPromptSeen";

/**
 * Long enough for the page to paint and the hero to land, short enough to
 * still read as a welcome rather than an interruption mid-scroll.
 */
const DELAY_MS = 1200;

/**
 * The guest welcome: the house promotion, carrying the account actions that
 * used to live in the sign-in prompt.
 *
 * One popup rather than two. A signed-out visitor previously had both a promo
 * popup and a sign-in prompt aimed at them; this is the single thing a guest
 * sees, and it still offers Sign in, Create account and Maybe later. Never
 * blocking: X, "Maybe later", Escape or the backdrop all close it, and any of
 * them marks it seen for good.
 *
 * Mounted in StoreChrome, so it never appears on /admin. It sits at z-130,
 * above the chat button at z-90, so the two never overlap.
 */
export function GuestOfferPopup() {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  /** Where focus was before the modal took it, to hand back on close. */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Don't interrupt someone already signing in or registering.
  const onAuthPage =
    pathname?.startsWith("/account/login") || pathname?.startsWith("/account/register");

  const showing = open && !user;

  // Nothing behind the modal should scroll or be reachable while it is up.
  useLockBodyScroll(showing);

  useEffect(() => {
    // Wait for the session check; never prompt a signed-in visitor.
    if (initializing || user || onAuthPage) return;
    if (localStorage.getItem(SEEN_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY)) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [initializing, user, onAuthPage]);

  // Escape closes it, and focus moves into the dialog so a keyboard user is
  // not left tabbing the page behind. Focus is handed back on close.
  useEffect(() => {
    if (!showing) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => dialogRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [showing]);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode with storage blocked — closing still works */
    }
    setOpen(false);
  }

  return (
    /* Gated on `user` rather than closed from an effect: if the visitor signs
       in while this is up it simply stops rendering, and AnimatePresence plays
       the exit. Deriving it avoids a setState cascade on every auth change. */
    <AnimatePresence>
      {showing && (
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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="CONROY special offer"
            tabIndex={-1}
            className="relative z-10 max-h-[92vh] w-full max-w-[1080px] overflow-y-auto overflow-x-hidden rounded-media bg-background shadow-2xl outline-none [&::-webkit-scrollbar]:w-0"
            initial={reduce ? { opacity: 0 } : { scale: 0.94, y: 24, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.97, y: 12, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* ── Left: the campaign frame, complete ───────────────────────
                  `contain`, so the whole photograph survives — model, legs and
                  shoes included. A landscape frame in a tall panel leaves a
                  band above and below; the panel therefore carries the modal's
                  own off-white rather than a darker backdrop, and the studio
                  white of the shot runs into it almost seamlessly. The picture
                  reads as floating on the modal's ground, not sitting in a box.
                  A hairline is what separates the two halves. */}
              {/* Stacked, the panel takes the photograph's own 3:2 so it fills
                  the width edge to edge with no side bands — a fixed height
                  here would shrink it to a small picture adrift in neutral.
                  The modal scrolls a little on a short phone, which is the
                  better trade for showing the shot properly. Beside the offer
                  it is a tall column, and the bands move to top and bottom. */}
              <div className="relative aspect-[3/2] w-full bg-background md:aspect-auto md:min-h-[540px] md:border-r md:border-line">
                <SafeImage
                  src={OFFER_CAMPAIGN.image}
                  alt={OFFER_CAMPAIGN.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 540px"
                  /* contain, never cover: nothing is cropped, and `fill` with
                     contain preserves the aspect ratio, so nothing stretches. */
                  className="object-contain object-center"
                  priority
                />
                <span className="absolute left-5 top-5 font-display text-[0.8125rem] tracking-[0.34em] text-ink sm:left-7 sm:top-7">
                  CONROY
                </span>
              </div>

              {/* ── Right: the offer and the account actions ─────────────── */}
              <div className="min-w-0 px-5 py-4 sm:px-9 sm:py-10">
                <p className="eyebrow text-stone">{OFFER_CAMPAIGN.eyebrow}</p>

                <h2 className="mt-3 font-display text-[1.5rem] leading-[1.1] text-ink sm:mt-4 sm:text-[2.125rem]">
                  Premium denim.
                  <br />
                  Better together.
                </h2>

                {/* Hairline rules rather than boxes — the house treatment. */}
                <dl className="mt-4 border-t border-line sm:mt-7">
                  {OFFER_CAMPAIGN.tiers.map((t) => (
                    <div
                      key={t.qty}
                      className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 sm:py-3.5"
                    >
                      <dt className="text-[0.8125rem] uppercase tracking-[0.18em] text-ink-soft">
                        {t.qty}
                      </dt>
                      <dd className="font-display text-[1.625rem] leading-none text-ink sm:text-[2.125rem]">
                        {t.saving}{" "}
                        <span className="text-[0.75rem] uppercase tracking-[0.16em] text-stone">
                          {t.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <Link
                  href={OFFER_CAMPAIGN.href}
                  onClick={dismiss}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-(--radius-button) bg-ink text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-white transition-[background-color,border-color,color] duration-(--duration-button) ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent sm:mt-7 sm:h-[52px]"
                >
                  {OFFER_CAMPAIGN.ctaLabel}
                </Link>

                {/* The existing auth routes — no second login system. */}
                <div className="mt-2.5 grid gap-2.5 sm:mt-3 sm:grid-cols-2 sm:gap-3">
                  <Link
                    href="/account/login"
                    onClick={dismiss}
                    className="flex h-11 w-full items-center justify-center rounded-(--radius-button) border border-ink/25 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-ink transition-[background-color,border-color,color] duration-(--duration-button) ease-out hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent sm:h-[52px]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/account/register"
                    onClick={dismiss}
                    className="flex h-11 w-full items-center justify-center rounded-(--radius-button) border border-ink/25 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-ink transition-[background-color,border-color,color] duration-(--duration-button) ease-out hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent sm:h-[52px]"
                  >
                    Create account
                  </Link>
                </div>

                <div className="mt-2.5 text-center sm:mt-5">
                  <button
                    onClick={dismiss}
                    className="text-xs text-stone underline-offset-4 hover:text-ink hover:underline"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
