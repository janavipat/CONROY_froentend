import type { Metadata } from "next";
import type { Product } from "@/types";
import { SITE } from "@/lib/site";

/**
 * Shared SEO helpers.
 *
 * Metadata and JSON-LD describe the same page to the same crawler, so they are
 * built from one place — a title written here and a schema name written
 * elsewhere is how the two drift apart.
 */

/** Trims to a whole word inside `max`, so a snippet never ends mid-word. */
export function truncate(text: string, max = 155): string {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * A product name fit for a title tag and for schema.
 *
 * `productDisplayTitle` upper-cases T-shirts, which is a typographic choice for
 * the page — but a search result rendered "WHITE COTTON TSHIRT" reads as
 * shouting, and "TSHIRT" does not match how anyone searches. This restores
 * sentence case for titles stored in a single case and spells the garment the
 * way it is written everywhere else. Nothing is renamed: a title that already
 * carries mixed case is passed through untouched.
 */
export function productSeoTitle(title: string): string {
  const raw = String(title ?? "").trim();
  if (!raw) return raw;

  const singleCase = raw === raw.toLowerCase() || raw === raw.toUpperCase();
  const cased = singleCase
    ? raw
        .toLowerCase()
        .replace(/\b[a-z]/g, (c) => c.toUpperCase())
        // Keep possessives lowercase: "Men'S" -> "Men's".
        .replace(/'S\b/g, "'s")
    : raw;

  return cased.replace(/\bT[- ]?shirt\b/gi, "T-Shirt");
}

/** Absolute URL for a site-relative path — schema and OG both require one. */
export function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Metadata for a listing page, with the pieces every category needs and no
 * route repeating the boilerplate.
 *
 * `image` matters more than it looks: without it a shared category link falls
 * back to whatever the layout set, so every category previewed identically.
 */
export function listingMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
}): Metadata {
  const url = absolute(opts.path);
  // Bare here: the root layout's title template appends "| CONROY". Repeating
  // it would produce "Denim | CONROY | CONROY".
  const description = truncate(opts.description);
  const socialTitle = `${opts.title} | ${SITE.name}`;
  // Declaring openGraph at all replaces the file-based default, so a page with
  // no product photograph still has to name the site card explicitly or it
  // shares with no image at all.
  const src = opts.image ?? `${SITE.url}/opengraph-image`;
  const images = [
    opts.image
      ? { url: src, width: 1200, height: 1500, alt: opts.imageAlt ?? opts.title }
      : { url: src, width: 1200, height: 630, alt: `${SITE.name} — ${opts.title}` },
  ];

  return {
    title: opts.title,
    description,
    alternates: { canonical: opts.path },
    openGraph: { type: "website", title: socialTitle, description, url, images },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [src] },
  };
}

/** Metadata for a page that must never be indexed (cart, checkout, search). */
export function privatePageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    // follow, not nofollow: these pages link on to real catalogue pages and
    // there is no reason to waste that signal.
    robots: { index: false, follow: true },
  };
}

/* ── JSON-LD ──────────────────────────────────────────────────────────────
   One graph per page. Multiple competing blocks describing the same entity is
   what makes Rich Results report conflicting types. */

export interface Crumb {
  name: string;
  /** Null for the current page — the last item may omit its URL. */
  path: string | null;
}

/** BreadcrumbList, matching the trail the page already shows on screen. */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absolute(c.path) } : {}),
    })),
  };
}

/**
 * Product schema built strictly from stored fields.
 *
 * aggregateRating is emitted only when the product genuinely has reviews —
 * Google penalises rating markup with nothing behind it, and an invented
 * rating would be exactly that.
 */
export function productSchema(product: Product, displayName: string) {
  const url = absolute(`/products/${product.handle}`);
  const inStock = (product.stock ?? 0) > 0;

  const schema: Record<string, unknown> = {
    "@type": "Product",
    name: displayName,
    description: truncate(product.description || product.tagline, 500),
    url,
    sku: product.handle,
    image: product.images.map((i) => i.src),
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency || SITE.currency,
      price: product.price,
      availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };

  if (product.color) schema.color = product.color;
  // Fit has no dedicated schema.org field, so it goes through the generic
  // property bag rather than being forced into an unrelated one.
  if (product.fit) {
    schema.additionalProperty = [
      { "@type": "PropertyValue", name: "Fit", value: product.fit },
    ];
  }
  if (product.reviewCount > 0 && product.rating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return schema;
}

/** ItemList for a listing page, so the set of products is machine-readable. */
export function itemListSchema(products: Product[], listName: string) {
  return {
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(`/products/${p.handle}`),
      name: p.title,
    })),
  };
}

/** Wraps one or more schema nodes in a single @graph document. */
export function jsonLd(...nodes: unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}
