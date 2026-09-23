"use server";

import type { Product } from "@/types";
import { fetchAllProducts } from "@/services/catalog";

/**
 * The current catalogue, for search UI that runs in the browser (the header
 * search overlay).
 *
 * It is `fetchAllProducts` and nothing else — the same read, cache window and
 * offline fallback as the collection, wishlist and product pages — so search
 * can never disagree with them about a name, price or image. It exists only
 * because `services/catalog` is server-only and a client component can't
 * import it directly.
 */
export async function fetchSearchCatalogue(): Promise<Product[]> {
  return fetchAllProducts();
}
