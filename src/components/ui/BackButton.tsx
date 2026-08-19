"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

/**
 * The tab's history depth when this module first ran — i.e. the shopper's entry
 * page. Anything beyond it was pushed by them moving around the site, so
 * popping one entry is guaranteed to keep them on CONROY.
 *
 * `history.length` alone can't answer this: a freshly opened tab already reads
 * 2 (the initial about:blank plus the page), so a plain `length > 1` check
 * sends someone who arrived on a shared product link back to a blank tab.
 */
const ENTRY_HISTORY_DEPTH = typeof window === "undefined" ? 0 : window.history.length;

/**
 * "← Back" control for pages a shopper drills into — product detail, a
 * collection, the cart and checkout, the account hub.
 *
 * Uses navigation history, so it returns to wherever they actually came from
 * rather than a fixed parent route. With no in-app history to pop — a shared
 * link, a search result, a new tab — it routes to `fallbackHref` instead. That
 * is the safe failure mode: the worst case is landing on a sensible page
 * rather than a blank tab or somewhere off the site.
 *
 * Sized for thumbs: the label stays at the breadcrumb's micro scale, while
 * negative margins let the padding grow the tap target to the 44px minimum
 * without moving the text off its optical baseline.
 */
export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className,
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > ENTRY_HISTORY_DEPTH) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "-m-2 inline-flex min-h-11 items-center gap-2 p-2 text-[0.6875rem] uppercase",
        "tracking-[0.14em] text-stone transition-colors duration-(--duration-quick)",
        "hover:text-ink focus-visible:text-ink focus-visible:outline-none",
        "focus-visible:ring-1 focus-visible:ring-ink/20 sm:min-h-0",
        className,
      )}
    >
      <span aria-hidden>&larr;</span>
      {label}
    </button>
  );
}
