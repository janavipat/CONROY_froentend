import Link from "next/link";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * A titled row of products with a link through to the full listing.
 *
 * Shared by Best Sellers and the T-Shirt edit so they stay structurally
 * identical — Phase 3 restyles this once and both follow. Renders nothing when
 * there are no products: a homepage rail with an empty state reads as broken,
 * and inventing filler would be worse.
 *
 * The grid narrows to the number of products it actually has. A four-column
 * grid holding one card is what made an under-curated rail look like a hole in
 * the page.
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

  const shown = products.slice(0, limit);
  const columns = Math.min(4, shown.length) as 1 | 2 | 3 | 4;
  // Caps the row's width so one or two cards stay card-sized and centred
  // instead of stretching across the container.
  const width = {
    1: "mx-auto max-w-[19rem]",
    2: "mx-auto max-w-2xl",
    3: "mx-auto max-w-5xl",
    4: "",
  }[columns];

  return (
    <section className={className ?? "py-section"}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="mb-block"
        />
        <div className={cn(width)}>
          <ProductGrid products={shown} columns={columns} />
        </div>
        <div className="mt-block flex justify-center">
          <Link
            href={href}
            className="nav-label text-ink transition-colors duration-(--duration-base) hover:text-accent"
          >
            {ctaLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}
