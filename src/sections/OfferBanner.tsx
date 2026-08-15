import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { OFFER_CAMPAIGN } from "@/lib/offer-campaign";

/**
 * The promotion as a slim line under the header.
 *
 * Deliberately not a campaign band: it sits above the hero, where a
 * full-height photographic section would push the store's own opening image
 * below the fold. So it is typographic only — ink ground, the savings in the
 * display serif, one hairline between them — and about the height of the
 * announcement bar it sits near. No photograph, no second colour, no starburst;
 * at this height an image would read as noise.
 *
 * Static by design. It renders above the fold, so an entrance animation would
 * either flash or, if frames are throttled, leave the offer invisible.
 */
export function OfferBanner() {
  return (
    <section aria-label="Special offer" className="bg-ink text-white">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 py-3.5 sm:py-4 lg:justify-between">
        {/* Label and headline stack tightly so the campaign line is present
            without turning the strip into a band. Both go on a phone: the
            tiers already say what this is, and extra rows cost more here than
            they add. */}
        <div className="hidden min-w-0 sm:block">
          <p className="eyebrow text-white/55">{OFFER_CAMPAIGN.eyebrow}</p>
          <p className="mt-1 font-display text-[1.0625rem] leading-none text-white">
            Premium denim. Better together.
          </p>
        </div>

        {/* The tiers, side by side and centred on their own line when the row
            wraps — so a narrow screen never leaves a lone "Buy 2". */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1.5 sm:gap-x-7">
          {OFFER_CAMPAIGN.tiers.map((t, i) => (
            <div key={t.qty} className="flex items-baseline gap-2.5">
              {/* Hairline between the two, never before the first. */}
              {i > 0 && (
                <span aria-hidden className="mr-2.5 hidden h-4 w-px bg-white/25 sm:inline-block" />
              )}
              <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-white/60">
                {t.qty}
              </span>
              <span className="font-display text-[1.375rem] leading-none text-white sm:text-[1.5rem]">
                {t.saving}
              </span>
              <span className="text-[0.625rem] uppercase tracking-[0.16em] text-white/55">
                {t.label}
              </span>
            </div>
          ))}
        </div>

        <Button href={OFFER_CAMPAIGN.href} variant="light" size="sm">
          {OFFER_CAMPAIGN.ctaLabel}
        </Button>
      </Container>
    </section>
  );
}
