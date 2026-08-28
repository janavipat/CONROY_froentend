"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  QUIET_PATHS,
  isInstalled,
  isIosSafari,
  recentlyDismissed,
  rememberDismissal,
} from "@/lib/pwa/install-state";

/**
 * Adding CONROY to the home screen on iPhone and iPad.
 *
 * Safari has no `beforeinstallprompt` and no API to open the Add to Home Screen
 * sheet — installing is something only the person holding the phone can do. So
 * this does the one thing that is possible: shows them where the button is.
 *
 * Deliberately separate from the Android card. That one is driven by an event
 * the browser fires; this one has to detect the platform itself, which is a
 * guess, so it stays conservative and shows nothing unless it is confident.
 */

const DISMISSED_KEY = "conroy.iosInstallGuide.dismissedAt";

export function IosInstallGuide() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Read after mount, never during render: these answers only exist in the
    // browser, and on the server they would render the wrong thing.
    const show = isIosSafari() && !isInstalled() && !recentlyDismissed(DISMISSED_KEY);
    if (!show) return;

    // A short delay so it follows the page rather than competing with it.
    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    rememberDismissal(DISMISSED_KEY);
  }, []);

  if (!visible) return null;
  if (QUIET_PATHS.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div
      role="dialog"
      aria-label="Add CONROY to your Home Screen"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem] sm:rounded-lg sm:border sm:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-stone">CONROY</p>
          <p className="mt-1.5 text-sm font-medium text-ink">Add Conroy to Home Screen</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center text-stone transition-colors hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden
            className="h-4 w-4"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <ol className="mt-3 space-y-2.5">
        <Step index={1}>
          Tap <ShareIcon /> <strong className="font-medium text-ink">Share</strong> in the Safari
          toolbar
        </Step>
        <Step index={2}>
          Choose <strong className="font-medium text-ink">Add to Home Screen</strong>
        </Step>
        <Step index={3}>
          Tap <strong className="font-medium text-ink">Add</strong>
        </Step>
      </ol>
    </div>
  );
}

function Step({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line text-[0.65rem] tabular-nums text-stone">
        {index}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** iOS Share glyph — the square with the arrow leaving the top. */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mb-0.5 inline-block h-4 w-4 align-middle text-ink"
    >
      <path d="M12 15V4" />
      <path d="M8.5 7.5L12 4l3.5 3.5" />
      <path d="M7 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 11H17" />
    </svg>
  );
}
