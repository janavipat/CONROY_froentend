import type { Product } from "@/types";
import { fetchCollections } from "@/services/catalog";
import { Container } from "@/components/ui/Container";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { PageHeader } from "@/layouts/PageHeader";

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
  products,
  emptyMessage = "No products here yet.",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  products: Product[];
  emptyMessage?: string;
}) {
  // Titles for the collection facet, so it reads "Vintage Collection" rather
  // than the stored handle. Fetched here because the listings are server
  // components and this is already cached alongside the catalogue.
  const collections = await fetchCollections();
  const labels = Object.fromEntries(collections.map((c) => [c.handle, c.title]));

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

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
