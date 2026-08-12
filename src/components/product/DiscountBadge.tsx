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
    /* whitespace-nowrap keeps "28% Off" together. Squeezed into a narrow
       column it was breaking after the number, stacking "28%" over "Off". */
    <span className={cn("whitespace-nowrap font-medium text-red-600", className)}>
      {percent}% Off
    </span>
  );
}
