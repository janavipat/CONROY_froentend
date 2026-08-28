/**
 * Shared state for the two install offers.
 *
 * Android and iOS need different UI — one drives a native dialog, the other can
 * only describe where the button is — but "already installed" and "the shopper
 * said no" mean the same thing on both, and should behave the same way.
 */

/**
 * How long "maybe later" lasts. Long enough that it reads as respected rather
 * than as a banner that keeps coming back, short enough that someone who
 * changes their mind is offered it again.
 */
export const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

/** Nowhere near a purchase or the admin: neither wants an interruption. */
export const QUIET_PATHS = ["/admin", "/checkout"];

export function recentlyDismissed(key: string): boolean {
  try {
    const at = Number(window.localStorage.getItem(key));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    // Private browsing or blocked storage: treat as not dismissed rather than
    // suppressing the offer entirely.
    return false;
  }
}

export function rememberDismissal(key: string): void {
  try {
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore — it simply reappears next visit */
  }
}

export function forgetDismissal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Whether the site is running as an installed app.
 *
 * `display-mode: standalone` covers Android and desktop; iOS reports it on a
 * non-standard `navigator.standalone` instead, and older iOS versions report it
 * nowhere else — so both are checked.
 */
export function isInstalled(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

/**
 * iPhone or iPad, in Safari.
 *
 * iPadOS 13+ identifies itself as a Mac, so the touch-point count is what
 * separates an iPad from a desktop. The in-app browsers (Chrome, Firefox, Edge
 * on iOS) are excluded: they are all WebKit underneath, but the Share sheet
 * this guide describes is Safari's, and pointing someone at a button their
 * browser does not have is worse than staying quiet.
 */
export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;

  const iPhoneOrIPad =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!iPhoneOrIPad) return false;

  // Every iOS browser puts "Safari" in its UA; only the others add their own token.
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Line\//i.test(ua);
  return !otherBrowser && /Safari/.test(ua);
}
