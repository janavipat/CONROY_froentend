import { cn } from "@/utils/cn";

/**
 * The "28% Off" figure beside a price.
 *
 * The number itself is computed by the API from price vs compareAtPrice — this
 * only renders what it is handed, so every surface shows the same saving and
 * none of them can invent one. Renders nothing without a real discount, so a
 * full-price product never shows "0% Off".
 */
export function DiscountBadge({
  percent,
  className,
}: {
  percent?: number;
  /** Size class, matched by each caller to the struck price beside it. `cn` is
   *  plain clsx, so a default size here could not be overridden — callers set
   *  it instead. */
  className?: string;
}) {
  if (percent == null || percent <= 0) return null;
  return (
    <span className={cn("font-medium text-red-600", className)}>{percent}% Off</span>
  );
}
