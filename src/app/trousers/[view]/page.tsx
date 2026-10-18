import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { TROUSER_VIEWS, type TrouserView } from "@/lib/catalog-taxonomy";
import { browseProducts, newestFirst } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Trouser sub-navigation (e.g. Linen). Each view is a category within the
 * Trousers product type; the table lives in catalog-taxonomy so the sitemap
 * can enumerate these routes without importing this page.
 */

export function generateStaticParams() {
  return Object.keys(TROUSER_VIEWS).map((view) => ({ view }));
}

export async function generateMetadata(props: PageProps<"/trousers/[view]">): Promise<Metadata> {
  const { view: slug } = await props.params;
  const view = TROUSER_VIEWS[slug as TrouserView];
  if (!view) return { title: "Not found", robots: { index: false, follow: true } };

  const title = `${view.title} Trousers`;
  return {
    title,
    description: view.seoDescription,
    alternates: { canonical: `/trousers/${slug}` },
    openGraph: {
      type: "website",
      title: `${title} | ${SITE.name}`,
      description: view.seoDescription,
      url: `${SITE.url}/trousers/${slug}`,
      images: [`${SITE.url}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE.name}`,
      description: view.seoDescription,
      images: [`${SITE.url}/opengraph-image`],
    },
  };
}

export default async function TrouserViewPage(props: PageProps<"/trousers/[view]">) {
  const { view: slug } = await props.params;
  const view = TROUSER_VIEWS[slug as TrouserView];
  if (!view) notFound();

  // Newest first, so the latest trouser leads the page.
  const products = newestFirst(
    await browseProducts({ productType: "Trousers", category: view.category }),
  );

  return (
    <BrowseLayout
      eyebrow="Trousers"
      title={view.title}
      description={view.description}
      showBack
      backFallbackHref="/trousers"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trousers", href: "/trousers" },
        { label: view.title },
      ]}
      products={products}
      emptyMessage={`No ${view.title.toLowerCase()} trousers available right now.`}
    />
  );
}
