/**
 * Catalog taxonomy — the single source of truth for the admin form's options.
 *
 * The four concepts are deliberately separate:
 *
 *   Product Type   what the garment is      Jeans, T-Shirt
 *   Category       the department           Denim, T-Shirts
 *   Fit            how it is cut            Slim Fit, Straight Fit, …
 *   Collection     merchandising grouping   Vintage, Essentials  (join table)
 *
 * Fit options are keyed by category so denim fits are never offered for a
 * T-shirt. Adding a product type later means adding one entry here, not a
 * migration.
 */

export const PRODUCT_TYPES = ["Jeans", "T-Shirt"] as const;

export const CATEGORIES = ["Denim", "T-Shirts"] as const;

/** Which category a product type belongs to, used to preselect sensibly. */
export const CATEGORY_FOR_TYPE: Record<string, string> = {
  Jeans: "Denim",
  "T-Shirt": "T-Shirts",
};

/** Fits available per category. Denim's three are the official CONROY set. */
export const FITS_BY_CATEGORY: Record<string, string[]> = {
  Denim: ["Slim Fit", "Straight Fit", "Relaxed Fit"],
  "T-Shirts": ["Regular Fit", "Slim Fit", "Oversized Fit"],
};

/** Filterable colour buckets. `color` stays the merchandising display name. */
export const STANDARD_COLORS = [
  "Black",
  "Blue",
  "Light Blue",
  "Grey",
  "White",
  "Brown",
  "Green",
  "Beige",
] as const;

/**
 * Best-guess bucket for a display colour, used to prefill the field when an
 * admin opens a product that predates it. Only exact, unambiguous matches —
 * anything unknown returns "" so a human chooses rather than the system
 * guessing wrong.
 */
const COLOR_MAP: Record<string, string> = {
  black: "Black",
  "jet black": "Black",
  "deep black": "Black",
  blue: "Blue",
  "dark blue": "Blue",
  indigo: "Blue",
  "vintage blue": "Blue",
  "true blue": "Blue",
  "ice blue": "Light Blue",
  "light blue": "Light Blue",
  "sky blue": "Light Blue",
  "mud brown": "Brown",
  brown: "Brown",
  "mud green": "Green",
  green: "Green",
  white: "White",
  "off white": "White",
  grey: "Grey",
  gray: "Grey",
  beige: "Beige",
};

export function suggestStandardColor(displayColor: string): string {
  return COLOR_MAP[displayColor.trim().toLowerCase()] ?? "";
}

/** Fits for a category, falling back to denim's set for unknown categories. */
export function fitsFor(category: string): string[] {
  return FITS_BY_CATEGORY[category] ?? FITS_BY_CATEGORY.Denim;
}
