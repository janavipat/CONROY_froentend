import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/layouts/PageHeader";

/**
 * The shared shell for every browse route — New In, Denim and its fits,
 * T-Shirts, and collections.
 *
 * Structure only: title, optional description, a filter/sort/count bar, then
 * the grid. It reuses PageHeader and ProductGrid exactly as they are so the
 * Phase 3 visual pass restyles one place and every listing follows.
 *
 * The filter and sort controls are intentionally placeholders — Phase 2 is
 * routing and hierarchy; the filter UI belongs to a later phase.
 */
export function BrowseLayout({
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
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      <section className="py-section-sm">
        <Container>
          {/* Filter · Sort · Count — a hairline rule with widely tracked
              uppercase labels, the way a listing header reads in print. The
              two controls are still structural placeholders until the filter
              phase, so they are set as labels rather than dressed up as
              buttons that would not do anything. The count is real. */}
          <div className="mb-block flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-8">
              <span className="nav-label text-ink">Filter</span>
              <span className="nav-label text-ink">Sort</span>
            </div>
            <p className="micro-label">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="py-16 text-center text-sm text-stone">{emptyMessage}</p>
          ) : (
            <ProductGrid products={products} columns={4} priorityCount={4} />
          )}
        </Container>
      </section>
    </>
  );
}
