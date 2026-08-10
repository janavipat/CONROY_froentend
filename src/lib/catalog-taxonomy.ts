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

export const CATEGORIES = ["Denim", "T-Shirts", "Cotton T-Shirt", "Cotton Lycra T-Shirt"] as const;

/** Which category a product type belongs to, used to preselect sensibly. */
export const CATEGORY_FOR_TYPE: Record<string, string> = {
  Jeans: "Denim",
  "T-Shirt": "T-Shirts",
};

/**
 * Categories offered per product type.
 *
 * T-Shirt drops Denim and gains the two fabric categories — "T-Shirts" stays
 * the department. Jeans deliberately keeps the list it has always had, so this
 * change is confined to the T-shirt side of the form; narrowing it to Denim
 * alone would be a separate decision.
 */
export const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  Jeans: ["Denim", "T-Shirts"],
  "T-Shirt": ["T-Shirts", "Cotton T-Shirt", "Cotton Lycra T-Shirt"],
};

/**
 * Sizes available per product type. Denim is sold on waist inches, T-shirts on
 * letter sizes, so the two lists share nothing — offering both at once is how
 * a T-shirt ends up saved with a size 34.
 */
export const SIZES_BY_TYPE: Record<string, string[]> = {
  Jeans: ["28", "30", "32", "34", "36", "38", "40"],
  "T-Shirt": ["S", "M", "L", "XL", "XXL"],
};

/** Fits available per category. Denim's three are the official CONROY set. */
export const FITS_BY_CATEGORY: Record<string, string[]> = {
  Denim: ["Slim Fit", "Straight Fit", "Relaxed Fit"],
  "T-Shirts": ["Regular Fit", "Slim Fit", "Oversized Fit"],
  // The fabric categories are still T-shirts — without these two entries
  // fitsFor() falls back to denim's fits and offers "Straight Fit" for a tee.
  "Cotton T-Shirt": ["Regular Fit", "Slim Fit", "Oversized Fit"],
  "Cotton Lycra T-Shirt": ["Regular Fit", "Slim Fit", "Oversized Fit"],
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

/**
 * Collections claimed by a product type, by collection handle.
 *
 * Handles, not titles, so a collection can be renamed without breaking this.
 *
 * A type listed here sees exactly its own collections. A type NOT listed sees
 * everything no other type has claimed — that's how Jeans gets the denim
 * collections (Slim Fit, Vintage Collection, both Romano Fit editions) without
 * enumerating them, and why a denim collection created later shows up on jeans
 * automatically. The trade-off is the reverse: a new T-SHIRT collection must be
 * added to the list below, or it won't be offered on a T-shirt product.
 */
export const COLLECTION_HANDLES_BY_TYPE: Record<string, string[]> = {
  "T-Shirt": ["cotton-tshirt", "cotton-lycra-tshirt"],
};

/** Categories for a product type, falling back to the full list if unknown. */
export function categoriesFor(productType: string): string[] {
  return CATEGORIES_BY_TYPE[productType] ?? [...CATEGORIES];
}

/** Fits for a category, falling back to denim's set for unknown categories. */
export function fitsFor(category: string): string[] {
  return FITS_BY_CATEGORY[category] ?? FITS_BY_CATEGORY.Denim;
}

/**
 * Narrows a list of collections to the ones valid for a product type, so a
 * jeans product is never offered a T-shirt collection and vice versa.
 *
 * A claimed type gets its own handles; an unclaimed one gets the leftovers.
 */
export function collectionsFor<T extends { handle: string }>(
  productType: string,
  all: T[],
): T[] {
  const allowed = COLLECTION_HANDLES_BY_TYPE[productType];
  if (allowed) return all.filter((c) => allowed.includes(c.handle));

  const claimedByOthers = new Set(
    Object.entries(COLLECTION_HANDLES_BY_TYPE)
      .filter(([type]) => type !== productType)
      .flatMap(([, handles]) => handles),
  );
  return all.filter((c) => !claimedByOthers.has(c.handle));
}

/** Sizes for a product type, falling back to denim's set for unknown types. */
export function sizesFor(productType: string): string[] {
  return SIZES_BY_TYPE[productType] ?? SIZES_BY_TYPE.Jeans;
}
