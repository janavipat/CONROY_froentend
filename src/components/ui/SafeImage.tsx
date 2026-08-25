"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

/**
 * next/image that falls back to the original source when the optimizer cannot
 * serve a variant.
 *
 * Vercel's image optimizer answers 402 once the transformation quota is spent.
 * Variants already cached keep serving, but any new one is refused and the
 * browser renders a broken image — which is what left six denim photographs
 * blank while the rest of the catalogue was fine.
 *
 * The fallback is driven by the failure itself, not by configuration: the
 * image is requested through the optimizer exactly as before, and only if that
 * request errors does this swap to `unoptimized`, which makes next/image emit
 * the original URL. So an image that optimises normally is untouched — same
 * srcset, same AVIF/WebP negotiation, same bytes — and only a failing one is
 * served unoptimised.
 *
 * Everything that governs layout is passed straight through: `fill`, explicit
 * width/height, `sizes`, `className` and `style` are unchanged between the two
 * renders, so the element keeps its box and nothing shifts. `alt` is likewise
 * untouched.
 *
 * This is a safety net for a spent quota, not a replacement for optimisation.
 * Once the quota is restored it simply stops firing, because nothing will
 * error. Nothing here is product- or URL-specific.
 */
export function SafeImage({ onError, unoptimized, ...props }: ImageProps) {
  const [optimizerFailed, setOptimizerFailed] = useState(false);

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      // One retry only: flipping to `unoptimized` re-requests the original
      // URL, and if that fails too there is nothing further to fall back to.
      setOptimizerFailed(true);
      onError?.(event);
    },
    [onError],
  );

  return (
    // alt is required by ImageProps and arrives through the spread, so the
    // rule's "missing alt" reading is wrong here — TypeScript already enforces
    // that every caller passes one.
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      unoptimized={unoptimized || optimizerFailed}
      onError={optimizerFailed ? onError : handleError}
    />
  );
}
