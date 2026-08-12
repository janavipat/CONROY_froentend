import "server-only";
import type { Collection, Product } from "@/types";
import {
  COLLECTIONS,
  getAllProducts,
  getCollectionByHandle,
  getProductByHandle,
  getProductsForCollection,
} from "@/lib/products";
import { getApiBase, hasRemoteApi } from "@/lib/api";
import { TSHIRT_COLLECTION_TITLES } from "@/lib/catalog-taxonomy";

/**
 * Catalog data access. When a backend API is configured and reachable, data is
 * served from Supabase via the Express API. Otherwise it falls back to the
 * bundled static catalog so the storefront always builds and renders.
 */


function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    id: String(raw.id),
    handle: String(raw.handle),
    title: String(raw.title),
    tagline: String(raw.tagline ?? ""),
    description: String(raw.description ?? ""),
    color: String(raw.color ?? ""),
    fit: (raw.fit as Product["fit"]) ?? "Straight fit",
    productType: (raw.productType as string) ?? "Jeans",
    category: (raw.category as string) ?? "Denim",
    standardColor: (raw.standardColor as string) ?? undefined,
    isNewIn: Boolean(raw.isNewIn),
    newInOrder: (raw.newInOrder as number) ?? undefined,
    isBestSeller: Boolean(raw.isBestSeller),
    bestSellerOrder: (raw.bestSellerOrder as number) ?? undefined,
    createdAt: (raw.createdAt as string) ?? undefined,
    price: Number(raw.price ?? 0),
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
    discountPercent: raw.discountPercent ? Number(raw.discountPercent) : undefined,
    currency: String(raw.currency ?? "INR"),
    sizes: (raw.sizes as string[]) ?? [],
    images: ((raw.images as { src: string; alt: string }[]) ?? []).map((i) => ({
      src: i.src,
      alt: i.alt ?? "",
    })),
    collections: (raw.collections as string[]) ?? [],
    details: (raw.details as string[]) ?? [],
    stock: Number(raw.stock ?? 0),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    badge: (raw.badge as string) ?? undefined,
  };
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (!hasRemoteApi()) return null;
  try {
    // Always fetch fresh so admin edits reflect immediately (catalog is small).
    const res = await fetch(`${getApiBase()}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; data: T };
    return json.ok ? json.data : null;
  } catch {
    // Network/backend unavailable — caller falls back to static data.
    return null;
  }
}

/**
 * Fills in `collections` for T-shirts.
 *
 * The products API doesn't return collection membership, and a T-shirt's card
 * label is the fabric collection it belongs to. Rather than change the API,
 * this reads the two T-shirt collections from the existing public endpoint and
 * tags the matching products. Skipped entirely when a list holds no T-shirts,
 * so denim-only pages make no extra requests.
 */
async function withTshirtCollections(products: Product[]): Promise<Product[]> {
  if (!products.some((p) => p.productType === "T-Shirt")) return products;

  const memberships = await Promise.all(
    Object.keys(TSHIRT_COLLECTION_TITLES).map(async (handle) => {
      const data = await apiGet<{ products?: { handle: string }[] }>(`/collections/${handle}`);
      return [handle, new Set((data?.products ?? []).map((p) => p.handle))] as const;
    }),
  );

  return products.map((p) => {
    if (p.productType !== "T-Shirt") return p;
    const owned = memberships.filter(([, members]) => members.has(p.handle)).map(([h]) => h);
    if (!owned.length) return p;
    return { ...p, collections: [...new Set([...p.collections, ...owned])] };
  });
}

export async function fetchAllProducts(): Promise<Product[]> {
  const data = await apiGet<Record<string, unknown>[]>("/products");
  if (data && data.length) return withTshirtCollections(data.map(normalizeProduct));
  return getAllProducts();
}

/**
 * Every collection the admin has created, for the Collections index. Falls
 * back to the bundled catalogue when the API is unreachable, like the other
 * readers here.
 */
export async function fetchCollections(): Promise<Collection[]> {
  const data = await apiGet<Record<string, unknown>[]>("/collections");
  if (data && data.length) {
    return data.map((c) => ({
      handle: String(c.handle),
      title: String(c.title),
      subtitle: String(c.subtitle ?? ""),
      description: String(c.description ?? ""),
      image: String(c.image ?? ""),
      productHandles: [],
    }));
  }
  return COLLECTIONS;
}

export async function fetchProductByHandle(handle: string): Promise<Product | undefined> {
  const data = await apiGet<Record<string, unknown>>(`/products/${handle}`);
  if (data) return (await withTshirtCollections([normalizeProduct(data)]))[0];
  return getProductByHandle(handle);
}

export async function fetchCollection(
  handle: string,
): Promise<{ collection: Collection; products: Product[] } | undefined> {
  const data = await apiGet<Record<string, unknown> & { products?: Record<string, unknown>[] }>(
    `/collections/${handle}`,
  );
  if (data) {
    const collection: Collection = {
      handle: String(data.handle),
      title: String(data.title),
      subtitle: String(data.subtitle ?? ""),
      description: String(data.description ?? ""),
      image: String(data.image ?? ""),
      productHandles: (data.products ?? []).map((p) => String(p.handle)),
    };
    return {
      collection,
      products: await withTshirtCollections((data.products ?? []).map(normalizeProduct)),
    };
  }

  // Fallback to static data.
  const collection = getCollectionByHandle(handle);
  if (!collection) return undefined;
  return { collection, products: getProductsForCollection(handle) };
}
