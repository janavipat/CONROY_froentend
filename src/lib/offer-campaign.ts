/**
 * The house promotion, in one place.
 *
 * The popup and the homepage band are the same campaign seen twice, so the
 * wording, the tiers, the destination and the photograph live here rather than
 * being typed out in each. Changing the offer is a single edit.
 *
 * This is deliberately NOT part of the admin offers system in
 * `services/offers`. That system models one discount at a time — a percentage
 * or a flat amount, optionally behind a code or a minimum order — and has no
 * notion of "the second one is cheaper". Encoding a quantity-tiered offer there
 * would mean inventing a discount type the cart and checkout could not honour,
 * which would show shoppers a total the backend never applies. So this is
 * promotional wording and routing only; the admin offer remains the single
 * thing that actually changes a price.
 */
export const OFFER_CAMPAIGN = {
  /** Small label above the headline, in the house eyebrow style. */
  eyebrow: "Special offer",
  /** The tiers, largest saving last so the eye lands on it. */
  tiers: [
    { qty: "Buy 1", saving: "30%", label: "off" },
    { qty: "Buy 2", saving: "50%", label: "off" },
  ],
  tagline: "Premium denim. Better together.",
  ctaLabel: "Shop the offer",
  /** Everything is eligible, so the CTA lands on the full catalogue. */
  href: "/collections/all",
  /**
   * The campaign photograph, in /public/brand. Landscape, 1280×854.
   *
   * The popup shows it whole, `object-contain` on the left panel. Cover was
   * tried and cropped the frame either side of the model — with a landscape
   * shot in a tall panel there is no crop that keeps the full figure, so the
   * panel takes a band of neutral instead.
   */
  image: "/brand/offer-campaign.jpg",
  imageAlt: "CONROY denim campaign",
} as const;
