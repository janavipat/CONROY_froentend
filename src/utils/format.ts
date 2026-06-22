/** Formatting helpers. */

const FORMATTERS: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(amount: number, currency = "INR"): string {
  const key = currency;
  if (!FORMATTERS[key]) {
    FORMATTERS[key] = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  }
  // Shopify renders "Rs. 2,000.00"; keep it close and readable.
  return FORMATTERS[key].format(amount);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
