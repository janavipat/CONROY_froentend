import { isStaging } from "@/lib/staging";

/**
 * A standing marker that this is the test storefront, not conroy.global.
 *
 * Renders nothing outside staging, so it costs production a single boolean.
 * It is deliberately not dismissible: the whole risk of a staging copy is
 * someone mistaking it for the real shop — placing an order they expect to
 * arrive, or reporting the ₹1 price as a bug — and a banner that can be closed
 * stops doing its job on the second page view.
 *
 * Rendered above the header rather than inside it so it survives every layout,
 * including the checkout, where the header is at its most stripped-back.
 */
export function StagingBanner() {
  if (!isStaging) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-amber-400 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-black sm:text-xs"
    >
      <span className="font-semibold uppercase">Staging — test site</span>
      <span className="opacity-80">
        Test data and test payments only. All items are priced ₹1. Nothing here ships.
      </span>
    </div>
  );
}
