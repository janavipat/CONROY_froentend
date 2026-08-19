import { isStaging, stagingTakesRealPayments } from "@/lib/staging";

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

  // Two different warnings, because they are two different risks. On test
  // keys the danger is someone treating the test shop as real. On live keys it
  // inverts: the shop IS charging them, and the amber "test payments only"
  // line would be the thing that talked them into entering a real card.
  if (stagingTakesRealPayments) {
    return (
      <div
        role="alert"
        className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-red-600 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs"
      >
        <span className="font-semibold uppercase">Staging — real payments</span>
        <span className="opacity-90">
          Test site, but checkout is LIVE: paying charges your card or UPI ₹1 for real. Nothing here ships.
        </span>
      </div>
    );
  }

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
