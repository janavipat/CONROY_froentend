import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";

/**
 * Filtering and sorting for the browse pages.
 *
 * Pure functions over a product list, with no React and no fetching: the
 * listings already receive their products from the server, so filtering is a
 * transform over what is on the page rather than a new query. That keeps the
 * API and the catalogue untouched and makes results update instantly.
 *
 * Facets are derived from the products actually present, so a page only ever
 * offers a filter that can change what is shown — the denim listing has no
 * "T-Shirts" option, and a page whose items are all in stock has no
 * availability toggle.
 */

export type FacetKey =
  | "category"
  | "fit"
  | "size"
  | "color"
  | "collection"
  | "price"
  | "discount";

export interface FilterState {
  category: string[];
  fit: string[];
  size: string[];
  color: string[];
  /** Collection handles. */
  collection: string[];
  /** Price band ids, see `priceBands`. */
  price: string[];
  /** Minimum saving band ids, see `discountBands`. */
  discount: string[];
  inStock: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  category: [],
  fit: [],
  size: [],
  color: [],
  collection: [],
  price: [],
  discount: [],
  inStock: false,
};

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface PriceBand {
  id: string;
  label: string;
  min: number;
  max: number;
}

/** Sizes sort numerically where they are numbers, else by the garment run. */
const LETTER_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
function compareSizes(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = Number.isFinite(na);
  const bNum = Number.isFinite(nb);
  // Waist sizes first, then the letter run — the two never interleave.
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return LETTER_ORDER.indexOf(a) - LETTER_ORDER.indexOf(b);
}

function tally(products: Product[], pick: (p: Product) => string[] | string | undefined) {
  const counts = new Map<string, number>();
  for (const p of products) {
    const raw = pick(p);
    if (!raw) continue;
    for (const v of Array.isArray(raw) ? raw : [raw]) {
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Price bands derived from the set's own range, rounded to hundreds so the
 * labels read like money rather than like a histogram. Returns nothing when
 * the range is too narrow for a band to be a meaningful choice.
 */
export function priceBands(products: Product[]): PriceBand[] {
  const prices = products.map((p) => p.price).filter((n) => Number.isFinite(n));
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max - min < 500) return [];

  const round = (n: number) => Math.round(n / 100) * 100;
  const a = round(min + (max - min) / 3);
  const b = round(min + ((max - min) * 2) / 3);
  if (a >= b) return [];

  return [
    { id: "lo", label: `Under ${formatCurrency(a)}`, min: 0, max: a - 1 },
    { id: "mid", label: `${formatCurrency(a)} – ${formatCurrency(b)}`, min: a, max: b },
    { id: "hi", label: `${formatCurrency(b)} and above`, min: b + 1, max: Infinity },
  ];
}

/**
 * Saving bands, from the discount the API already computes per product.
 *
 * Returns nothing when no product carries a saving — which is the case today,
 * since nothing in the catalogue has an MRP above its selling price. The facet
 * then hides itself rather than offering a filter that matches nothing, and
 * appears on its own the moment something goes on sale. (The store-wide
 * BUY 1 / BUY 2 campaign is applied in the cart, not per product, so it is not
 * something a product listing can filter by.)
 */
export function discountBands(products: Product[]): PriceBand[] {
  const withSaving = products.filter((p) => (p.discountPercent ?? 0) > 0);
  if (withSaving.length === 0) return [];

  const top = Math.max(...withSaving.map((p) => p.discountPercent ?? 0));
  return [
    { id: 'd10', label: '10% off or more', min: 10, max: Infinity },
    { id: 'd25', label: '25% off or more', min: 25, max: Infinity },
    { id: 'd50', label: '50% off or more', min: 50, max: Infinity },
  ].filter((b) => b.min <= top);
}

export interface Facets {
  category: FacetOption[];
  fit: FacetOption[];
  size: FacetOption[];
  color: FacetOption[];
  collection: FacetOption[];
  price: PriceBand[];
  discount: PriceBand[];
  /** Only offered when the set actually holds both in- and out-of-stock items. */
  hasStockMix: boolean;
}

/** A facet with fewer than two choices cannot change the result — drop it. */
const useful = (o: FacetOption[]) => (o.length > 1 ? o : []);

/**
 * @param labels handle → display title, for facets whose stored value is a
 *   slug. Anything missing falls back to a title-cased handle rather than
 *   showing the raw slug.
 */
export function buildFacets(products: Product[], labels: Record<string, string> = {}): Facets {
  const toOptions = (
    counts: Map<string, number>,
    sort?: (a: string, b: string) => number,
    label?: (v: string) => string,
  ) =>
    [...counts.entries()]
      .sort((x, y) => (sort ? sort(x[0], y[0]) : x[0].localeCompare(y[0])))
      .map(([value, count]) => ({ value, label: label ? label(value) : value, count }));

  const titleise = (handle: string) =>
    labels[handle] ??
    handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const inStock = products.filter((p) => (p.stock ?? 0) > 0).length;

  return {
    category: useful(toOptions(tally(products, (p) => p.category))),
    fit: useful(toOptions(tally(products, (p) => p.fit))),
    size: useful(toOptions(tally(products, (p) => p.sizes), compareSizes)),
    color: useful(toOptions(tally(products, (p) => p.standardColor))),
    collection: useful(
      toOptions(tally(products, (p) => p.collections), undefined, titleise),
    ),
    price: priceBands(products),
    discount: discountBands(products),
    hasStockMix: inStock > 0 && inStock < products.length,
  };
}

export function activeFilterCount(f: FilterState): number {
  return (
    f.category.length +
    f.fit.length +
    f.size.length +
    f.color.length +
    f.collection.length +
    f.price.length +
    f.discount.length +
    (f.inStock ? 1 : 0)
  );
}

/**
 * Applies the filters.
 *
 * Within one facet the options are OR-ed (Slim *or* Straight), across facets
 * they are AND-ed (Slim *and* size 32) — the behaviour every storefront filter
 * has, and the only one where ticking a second size widens rather than empties
 * the result.
 */
export function applyFilters(
  products: Product[],
  f: FilterState,
  bands: PriceBand[],
  savings: PriceBand[] = [],
): Product[] {
  const chosenBands = bands.filter((b) => f.price.includes(b.id));
  const chosenSavings = savings.filter((b) => f.discount.includes(b.id));

  return products.filter((p) => {
    if (f.category.length && !f.category.includes(p.category ?? "")) return false;
    if (f.fit.length && !f.fit.includes(p.fit ?? "")) return false;
    if (f.color.length && !f.color.includes(p.standardColor ?? "")) return false;
    if (f.size.length && !p.sizes?.some((s) => f.size.includes(s))) return false;
    if (f.collection.length && !p.collections?.some((c) => f.collection.includes(c)))
      return false;
    if (chosenBands.length && !chosenBands.some((b) => p.price >= b.min && p.price <= b.max))
      return false;
    if (chosenSavings.length && !chosenSavings.some((b) => (p.discountPercent ?? 0) >= b.min))
      return false;
    if (f.inStock && (p.stock ?? 0) <= 0) return false;
    return true;
  });
}

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORTS)[number]["value"];

/** Sorts a copy — "featured" keeps the order the server sent. */
export function sortProducts(products: Product[], sort: SortValue): Product[] {
  const out = [...products];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "newest":
      return out.sort(
        (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0),
      );
    case "rating":
      return out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return out;
  }
}
