"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { CheckIcon, CloseIcon, UserIcon } from "@/components/ui/Icons";

/** Dismissed for the rest of this browser session. */
const SEEN_KEY = "conroy.loginPromptSeen";
/** How long a signed-out visitor browses before we invite them to sign in. */
const DELAY_MS = 35000;

/**
 * A gentle, dismissible sign-in invitation for signed-out visitors. Appears
 * once per session after DELAY_MS of browsing — never blocking: it can be
 * closed with the X, "Maybe later", Escape, or by clicking the backdrop.
 *
 * Mounted in StoreChrome, so it never shows on /admin.
 */
export function LoginPopup() {
  const { user, initializing } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Don't interrupt someone already on an auth page.
  const onAuthPage = pathname?.startsWith("/account/login") || pathname?.startsWith("/account/register");

  useEffect(() => {
    // Wait for the session check; never prompt a signed-in visitor.
    if (initializing || user || onAuthPage) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;

    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [initializing, user, onAuthPage]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // If the visitor signs in while it's open, get out of the way.
  useEffect(() => {
    if (user && open) setOpen(false);
  }, [user, open]);

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

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
            aria-label="Close sign-in prompt"
            onClick={dismiss}
            className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-label="Sign in to CONROY"
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

            {/* Header — note: .font-display forces a navy colour, so every
                heading here needs an explicit text-white to stay legible. */}
            <div className="bg-ink px-6 py-9 text-white">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-gold/40">
                <UserIcon className="h-6 w-6 text-gold" />
              </span>

              <p className="mt-5 text-[0.6rem] font-medium uppercase tracking-[0.32em] text-white/55">
                Welcome to
              </p>
              <p className="mt-2 font-display text-3xl tracking-[0.2em] text-white">CONROY</p>

              {/* Gold ornament, echoing "The Shops" */}
              <div aria-hidden className="mt-4 flex items-center justify-center gap-2">
                <span className="h-px w-10 bg-gold/45" />
                <span className="h-1 w-1 rotate-45 border border-gold/70" />
                <span className="h-px w-10 bg-gold/45" />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-white/70">
                Premium denim, made to last.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-ink-soft">
                Sign in to unlock your CONROY account.
              </p>

              <ul className="mt-4 space-y-2 text-left">
                {[
                  "Track every order from checkout to doorstep",
                  "Save your favourites to your wishlist",
                  "Faster checkout with saved addresses",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[0.82rem] text-ink-soft">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/account/login"
                onClick={dismiss}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-pill bg-ink text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
              <Link
                href="/account/register"
                onClick={dismiss}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-pill border border-line text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-mist"
              >
                Create account
              </Link>

              <button
                onClick={dismiss}
                className="mt-4 text-xs text-stone underline-offset-4 hover:text-ink hover:underline"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
