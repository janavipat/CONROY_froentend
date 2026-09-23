import type { Product } from "@/types";

/**
 * Catalogue search — pure matching, no data of its own.
 *
 * The product list is always passed in, from the same source the rest of the
 * storefront reads (see `fetchAllProducts`). This module deliberately holds no
 * catalogue: search used to filter a bundled four-product sample, so it showed
 * out-of-date prices and could not find anything added since.
 *
 * Every word in the query must appear somewhere in the product's searchable
 * text, in any order, so "black slim" finds a black slim-fit pair and the
 * "Relax Fit" suggestion still finds "Relaxed fit". Matching is a plain
 * case-insensitive substring test per word.
 */
export function searchText(product: Product): string {
  return [
    product.title,
    product.tagline,
    product.color,
    product.standardColor,
    product.fit,
    product.productType,
    product.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterProducts(products: Product[], query: string): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return products;
  return products.filter((product) => {
    const text = searchText(product);
    return words.every((word) => text.includes(word));
  });
}
