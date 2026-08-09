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

      <section className="py-section">
        <Container>
          {/* Filter · Sort · Count. The controls are structural placeholders
              until the filter phase; the count is real. */}
          <div className="mb-12 flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-6">
              <span className="text-xs tracking-[0.01em] text-stone">Filter</span>
              <span className="text-xs tracking-[0.01em] text-stone">Sort</span>
            </div>
            <p className="text-xs tracking-[0.01em] text-stone">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="py-20 text-center text-sm text-stone">{emptyMessage}</p>
          ) : (
            <ProductGrid products={products} columns={4} priorityCount={4} />
          )}
        </Container>
      </section>
    </>
  );
}
