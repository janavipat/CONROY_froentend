import Link from "next/link";
import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * A titled row of products with a link through to the full listing.
 *
 * Shared by New In, Featured, Best Sellers and the T-Shirt edit so the four
 * stay structurally identical — Phase 3 restyles this once and all of them
 * follow. Renders nothing when there are no products: a homepage rail with an
 * empty state reads as broken, and inventing filler would be worse.
 */
export function ProductRail({
  eyebrow,
  title,
  description,
  products,
  href,
  ctaLabel = "View all",
  limit = 4,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  products: Product[];
  href: string;
  ctaLabel?: string;
  limit?: number;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={className ?? "py-section"}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} className="mb-block" />
        <ProductGrid products={products.slice(0, limit)} columns={4} />
        <div className="mt-block flex justify-center">
          <Link href={href} className="nav-label text-ink-soft transition-colors hover:text-ink">
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}
