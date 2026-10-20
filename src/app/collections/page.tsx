import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { browseProducts, newestFirst, type BrowseQuery } from "@/services/browse";
import { Container } from "@/components/ui/Container";
import { SafeImage } from "@/components/ui/SafeImage";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore CONROY collections — premium denim, linen and cotton twill. Considered fabrics, everyday essentials.",
  alternates: { canonical: "/collections" },
  openGraph: { title: `Collections | ${SITE.name}`, url: `${SITE.url}/collections`, images: [`${SITE.url}/opengraph-image`] },
};

/**
 * The collections a shopper browses, in order. Each uses the same query as its
 * own listing page, so the count and photograph on the card always match what
 * the shopper finds after clicking through. The admin's merchandising
 * collections ("Romano Fit · Bleu Heritage" and friends) still live at
 * /collections/[handle]; they are not the top-level structure here.
 */
const COLLECTIONS: {
  title: string;
  href: string;
  query: BrowseQuery;
  /** The listing page shows newest first; the card's photograph follows it. */
  newest?: boolean;
}[] = [
  { title: "Denim", href: "/denim", query: { category: "Denim" } },
  { title: "Linen", href: "/linen", query: { productType: "Linen" }, newest: true },
  { title: "Cotton Twill", href: "/cotton-twill", query: { productType: "Cotton Twill" }, newest: true },
];

export default async function CollectionsPage() {
  const cards = await Promise.all(
    COLLECTIONS.map(async (c) => {
      const found = await browseProducts(c.query);
      const products = c.newest ? newestFirst(found) : found;
      const image = products.find((p) => p.images?.[0]?.src)?.images[0];
      return { ...c, count: products.length, image };
    }),
  );

  return (
    <section className="pb-section pt-14 sm:pt-16">
      <Container>
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[2.25rem] leading-[1.1] text-ink sm:text-[2.75rem] lg:text-[3.25rem]">
            Explore Our Collections
          </h1>
          <p className="mt-4 text-[0.75rem] uppercase tracking-[0.22em] text-stone">
            Considered fabrics. Everyday essentials.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            // Two columns leave the third card alone on its row; centre it
            // rather than leaving an empty half beside it.
            <li
              key={c.href}
              className="sm:max-lg:odd:last:col-span-2 sm:max-lg:odd:last:mx-auto sm:max-lg:odd:last:w-[calc(50%-0.75rem)]"
            >
              <Link href={c.href} className="group block">
                <span className="relative block aspect-[4/5] w-full overflow-hidden bg-mist">
                  {c.image && (
                    <SafeImage
                      src={c.image.src}
                      alt={c.image.alt || `${c.title} collection`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      priority={i === 0}
                      className="object-cover object-center transition-transform duration-(--duration-slow) ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                    />
                  )}
                </span>

                <span className="mt-5 flex items-baseline justify-between gap-4 border-b border-line pb-4">
                  <span className="font-display text-[1.625rem] leading-none text-ink">{c.title}</span>
                  <span className="micro-label">
                    {c.count} {c.count === 1 ? "product" : "products"}
                  </span>
                </span>

                <span className="nav-label mt-4 inline-flex items-center gap-2 text-ink transition-colors duration-(--duration-base) group-hover:text-accent">
                  Explore collection
                  <span aria-hidden className="transition-transform duration-(--duration-base) group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
