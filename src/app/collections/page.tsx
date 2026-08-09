import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { fetchCollections } from "@/services/catalog";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/layouts/PageHeader";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated CONROY collections.",
  alternates: { canonical: "/collections" },
  openGraph: { title: `Collections · ${SITE.name}`, url: `${SITE.url}/collections` },
};

/**
 * Index of the real collections in the database. Collections are merchandising
 * groupings, browsed separately from categories like Denim and T-Shirts.
 *
 * "all" is excluded: it's the catch-all backing /collections/all, not a
 * curated collection a shopper would choose.
 */
export default async function CollectionsPage() {
  const collections = (await fetchCollections()).filter((c) => c.handle !== "all");

  return (
    <>
      <PageHeader
        eyebrow="Curated by CONROY"
        title="Collections"
        description="Considered edits, grouped by story rather than by cut."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
      />

      <section className="py-section">
        <Container>
          {collections.length === 0 ? (
            <p className="py-20 text-center text-sm text-stone">No collections yet.</p>
          ) : (
            <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <li key={c.handle}>
                  <Link href={`/collections/${c.handle}`} className="group block">
                    <h2 className="display-product text-ink transition-colors duration-(--duration-quick) group-hover:text-accent">
                      {c.title}
                    </h2>
                    {c.subtitle && <p className="mt-2 text-sm text-stone">{c.subtitle}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
