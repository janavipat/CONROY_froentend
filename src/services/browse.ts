import "server-only";
import type { Product } from "@/types";
import { fetchAllProducts, fetchCollection } from "@/services/catalog";

/**
 * Catalogue querying for the storefront's browse routes.
 *
 * Filtering happens in memory over the full product list rather than through
 * new API endpoints: the catalogue is small (a dozen products), `fetchAllProducts`
 * already fetches with `cache: "no-store"`, and this keeps Phase 2 to routing and
 * structure without touching the backend. Move it server-side when the catalogue
 * outgrows a single response.
 *
 * Nothing here invents data — every filter reads fields that already exist.
 */

/** Case-insensitive compare that tolerates "Slim fit" vs "Slim Fit". */
function eq(a: string | undefined, b: string): boolean {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

/** Only products a shopper should see. Drafts and archived stay hidden. */
function isVisible(p: Product): boolean {
  return (p.status ?? "active") === "active";
}

export interface BrowseQuery {
  category?: string;
  productType?: string;
  fit?: string;
  collection?: string;
  newIn?: boolean;
  bestSeller?: boolean;
}

/**
 * Products matching every provided facet. A collection filter resolves through
 * the existing collection endpoint so the join table stays the source of truth.
 */
export async function browseProducts(q: BrowseQuery): Promise<Product[]> {
  let products: Product[];

  if (q.collection) {
    const result = await fetchCollection(q.collection);
    products = result?.products ?? [];
  } else {
    products = await fetchAllProducts();
  }

  products = products.filter(isVisible);

  if (q.category) products = products.filter((p) => eq(p.category, q.category!));
  if (q.productType) products = products.filter((p) => eq(p.productType, q.productType!));
  if (q.fit) products = products.filter((p) => eq(p.fit, q.fit!));
  if (q.newIn) products = products.filter((p) => p.isNewIn);
  if (q.bestSeller) products = products.filter((p) => p.isBestSeller);

  // New In and Best Sellers are ordered by the admin, not by date or sales.
  // Products without an order sort last, keeping the sequence stable.
  if (q.newIn) products = sortByOrder(products, (p) => p.newInOrder);
  else if (q.bestSeller) products = sortByOrder(products, (p) => p.bestSellerOrder);

  return products;
}

function sortByOrder(products: Product[], key: (p: Product) => number | undefined): Product[] {
  return [...products].sort((a, b) => (key(a) ?? Infinity) - (key(b) ?? Infinity));
}

/** Every product the admin has marked New In, in the order they chose. */
export function fetchNewIn(): Promise<Product[]> {
  return browseProducts({ newIn: true });
}

/** Every product the admin has marked Best Seller, in the order they chose. */
export function fetchBestSellers(): Promise<Product[]> {
  return browseProducts({ bestSeller: true });
}
