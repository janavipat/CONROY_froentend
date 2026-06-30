import "server-only";
import type { Collection, Product } from "@/types";
import {
  getAllProducts,
  getCollectionByHandle,
  getProductByHandle,
  getProductsForCollection,
} from "@/lib/products";
import { getApiBase, hasRemoteApi } from "@/lib/api";

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
    color: (raw.color as Product["color"]) ?? "Black",
    fit: (raw.fit as Product["fit"]) ?? "Straight fit",
    price: Number(raw.price ?? 0),
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
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

export async function fetchAllProducts(): Promise<Product[]> {
  const data = await apiGet<Record<string, unknown>[]>("/products");
  if (data && data.length) return data.map(normalizeProduct);
  return getAllProducts();
}

export async function fetchProductByHandle(handle: string): Promise<Product | undefined> {
  const data = await apiGet<Record<string, unknown>>(`/products/${handle}`);
  if (data) return normalizeProduct(data);
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
    return { collection, products: (data.products ?? []).map(normalizeProduct) };
  }

  // Fallback to static data.
  const collection = getCollectionByHandle(handle);
  if (!collection) return undefined;
  return { collection, products: getProductsForCollection(handle) };
}
