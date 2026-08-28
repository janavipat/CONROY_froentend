"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  QUIET_PATHS,
  forgetDismissal,
  isInstalled,
  recentlyDismissed,
  rememberDismissal,
} from "@/lib/pwa/install-state";

/**
 * The offer to install CONROY as an app.
 *
 * Chrome fires `beforeinstallprompt` only when the site genuinely meets its
 * installability criteria and is not already installed, so the event itself is
 * the test for "can this browser install us" — nothing is rendered until it
 * arrives. Browsers that cannot install (iOS Safari, Firefox) never fire it and
 * therefore never see this.
 *
 * The native dialog can only be opened from a user gesture, and only once per
 * event, which is why the event is held rather than acted on immediately.
 */

/** Not in the DOM lib: the event exists only in Chromium browsers. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "conroy.installPrompt.dismissedAt";

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Held back so the browser's own mini-infobar doesn't appear alongside
      // this one; the native dialog is opened from the button below instead.
      event.preventDefault();
      if (isInstalled() || recentlyDismissed(DISMISSED_KEY)) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallEvent(null);
      // Nothing left to offer, and the snooze would otherwise linger.
      forgetDismissal(DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setInstallEvent(null);
    rememberDismissal(DISMISSED_KEY);
  }, []);

  const install = useCallback(async () => {
    if (!installEvent || busy) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      // The event cannot be reused, so it goes either way. Declining is
      // remembered as a dismissal rather than asked again on the next page.
      if (outcome === "dismissed") dismiss();
      else setInstallEvent(null);
    } catch {
      setInstallEvent(null);
    } finally {
      setBusy(false);
    }
  }, [installEvent, busy, dismiss]);

  if (!installEvent) return null;
  if (QUIET_PATHS.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div
      role="dialog"
      aria-label="Install the CONROY app"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem] sm:rounded-lg sm:border sm:shadow-lg"
    >
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-stone">CONROY</p>
      <p className="mt-1.5 text-sm font-medium text-ink">Install Conroy</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Add the store to your home screen for faster access to new drops and your orders.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={install}
          disabled={busy}
          className="flex h-11 flex-1 items-center justify-center bg-ink px-5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
        >
          {busy ? "Opening…" : "Install app"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-11 items-center justify-center px-3 text-[0.78rem] uppercase tracking-[0.14em] text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
