import type { Metadata } from "next";
import Link from "next/link";
import type { Product } from "@/types";
import { SITE } from "@/lib/site";
import { fetchAllProducts } from "@/services/catalog";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Collections",
  description: "Shop CONROY by category.",
  alternates: { canonical: "/collections" },
  openGraph: { title: `Collections · ${SITE.name}`, url: `${SITE.url}/collections` },
};

/**
 * Shoppers browse by category — Denim, T-Shirts — not by the merchandising
 * collections the admin creates ("Romano Fit · Bleu Heritage" and friends).
 * Those still exist and are still reachable from the Collections menu and
 * /collections/[handle]; they are simply not the top-level structure here.
 *
 * The categories are derived from the live catalogue's own `category` and
 * `productType` fields, so nothing is hard-coded beyond the route each one
 * points at, and no database collection is touched.
 */
const CATEGORY_ROUTES: Record<string, string> = {
  denim: "/denim",
  "t-shirts": "/t-shirts",
};

interface CategoryCard {
  title: string;
  /** The product types inside it — "Jeans" under Denim. */
  types: string[];
  count: number;
  href: string;
}

function categoriesFrom(products: Product[]): CategoryCard[] {
  const groups = new Map<string, { title: string; types: Set<string>; count: number }>();

  for (const p of products) {
    if ((p.status ?? "active") !== "active") continue;
    const title = (p.category ?? "").trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const group = groups.get(key) ?? { title, types: new Set<string>(), count: 0 };
    if (p.productType?.trim()) group.types.add(p.productType.trim());
    group.count += 1;
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, g]) => ({
      title: g.title,
      types: [...g.types],
      count: g.count,
      // Unknown categories fall through to the full catalogue rather than a 404.
      href: CATEGORY_ROUTES[key] ?? "/collections/all",
    }))
    .sort((a, b) => b.count - a.count);
}

export default async function CollectionsPage() {
  const products = await fetchAllProducts();
  const categories = categoriesFrom(products);

  return (
    <>
      <PageHeader
        eyebrow="Shop by category"
        title="Collections"
        description="Every CONROY piece, grouped by what it is."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
      />

      <section className="py-section-sm">
        <Container>
          {/* Categories as a compact row, not a three-column grid: with one
              category the grid left two empty cells and the page then ran on
              into blank space before the footer. The products follow straight
              after it. */}
          {categories.length > 0 && (
            <ul className="mb-block flex flex-wrap items-baseline justify-center gap-x-10 gap-y-4 border-b border-line pb-6">
              {categories.map((c) => (
                <li key={c.title}>
                  <Link href={c.href} className="group inline-flex items-baseline gap-3">
                    <span className="font-display text-[1.625rem] leading-none text-ink transition-colors duration-(--duration-quick) group-hover:text-accent sm:text-[1.875rem]">
                      {[c.title, ...c.types].join(" / ")}
                    </span>
                    <span className="micro-label">
                      {c.count} {c.count === 1 ? "product" : "products"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {products.length === 0 ? (
            <p className="py-20 text-center text-sm text-stone">No products yet.</p>
          ) : (
            <ProductGrid products={products} columns={4} priorityCount={4} />
          )}
        </Container>
      </section>
    </>
  );
}
