import Link from "next/link";
import type { Product } from "@/types";
import { fetchCollections } from "@/services/catalog";
import { Container } from "@/components/ui/Container";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { PageHeader } from "@/layouts/PageHeader";
import { breadcrumbSchema, itemListSchema, jsonLd } from "@/lib/seo";

/**
 * The shared shell for every browse route — New In, Denim and its fits,
 * T-Shirts, and collections.
 *
 * Structure only: title, optional description, then the browser — the
 * filter/sort/count bar and the grid. It reuses PageHeader and ProductGrid
 * exactly as they are so a visual pass restyles one place and every listing
 * follows.
 *
 * The filter and sort controls were placeholders here until now; they live in
 * ProductBrowser, which every listing shares.
 */
export async function BrowseLayout({
  eyebrow,
  title,
  description,
  breadcrumbs,
  showBack = false,
  backFallbackHref,
  subLinks,
  products,
  emptyMessage = "No products here yet.",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  /**
   * Sub-category links shown under the header.
   *
   * The denim fits were reachable only through the header's hover panel, which
   * is not in the served HTML — so /denim/slim and its siblings had no
   * incoming link anywhere on the site and were orphaned from a crawler's
   * point of view.
   */
  subLinks?: { label: string; href: string }[];
  /** Opt-in: only listings a shopper drills into carry a back control. */
  showBack?: boolean;
  backFallbackHref?: string;
  products: Product[];
  emptyMessage?: string;
}) {
  // Titles for the collection facet, so it reads "Vintage Collection" rather
  // than the stored handle. Fetched here because the listings are server
  // components and this is already cached alongside the catalogue.
  const collections = await fetchCollections();
  const labels = Object.fromEntries(collections.map((c) => [c.handle, c.title]));

  /* Structured data for the listing.
     BreadcrumbList mirrors the trail already rendered above, and ItemList
     names the products on the page so the set is machine-readable rather than
     only present as markup. Built here so every listing route gets both
     without repeating it — and so there is exactly one graph per page. */
  const crumbTrail = (breadcrumbs ?? []).filter((c) => c.href || c.label);
  const schema = jsonLd(
    crumbTrail.length > 1
      ? breadcrumbSchema(
          // The final crumb is the current page and carries no href; a
          // ListItem may omit its URL, so it is left off rather than invented.
          crumbTrail.map((c) => ({ name: c.label, path: c.href ?? null })),
        )
      : null,
    products.length ? itemListSchema(products, title) : null,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        showBack={showBack}
        backFallbackHref={backFallbackHref}
      />

      {/* Sub-category links — a real anchor each, so these pages are
          reachable without opening the header panel. */}
      {subLinks && subLinks.length > 0 && (
        <nav aria-label="Refine by fit" className="border-b border-line bg-paper">
          <Container className="flex flex-wrap justify-center gap-x-6 gap-y-2 py-4">
            {subLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[0.6875rem] uppercase tracking-[0.14em] text-stone transition-colors duration-(--duration-quick) hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
      <section className="pb-section-sm pt-block">
        <Container>
          <ProductBrowser
            products={products}
            emptyMessage={emptyMessage}
            collectionLabels={labels}
          />
        </Container>
      </section>
    </>
  );
}
