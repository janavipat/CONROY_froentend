/**
 * A hairline indeterminate progress bar for route transitions.
 *
 * Sits directly under the sticky header and animates on its own — no spinner,
 * no full-screen takeover. Reduced-motion visitors get a static filled track
 * instead of a travelling sliver (the global reduced-motion rule stops the
 * animation, so the sliver would otherwise sit frozen at the left edge).
 */
export function RouteProgress({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-[var(--spacing-header)] z-30 h-0.5 w-full overflow-hidden bg-line motion-reduce:bg-ink/25"
    >
      <span
        aria-hidden
        className="animate-progress-slide block h-full w-1/4 bg-ink motion-reduce:hidden"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
