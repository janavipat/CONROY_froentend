import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { DENIM_VIEWS, type DenimView } from "@/lib/catalog-taxonomy";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Denim sub-navigation. Slim/Straight/Relaxed filter on the `fit` field;
 * Vintage is a merchandising grouping, so it resolves through the existing
 * collection join table instead — the two are deliberately different concepts.
 *
 * The table itself lives in catalog-taxonomy so the sitemap can enumerate
 * these routes without importing this page.
 */

export function generateStaticParams() {
  return Object.keys(DENIM_VIEWS).map((fit) => ({ fit }));
}

export async function generateMetadata(props: PageProps<"/denim/[fit]">): Promise<Metadata> {
  const { fit } = await props.params;
  const view = DENIM_VIEWS[fit as DenimView];
  if (!view) return { title: "Not found", robots: { index: false, follow: true } };

  // "Slim Fit Jeans" rather than "Slim Fit Denim": jeans is what people search
  // for, and the Vintage view is a collection rather than a fit.
  const title = fit === "vintage" ? "Vintage Denim" : `${view.title} Jeans`;
  return {
    title,
    description: view.seoDescription,
    alternates: { canonical: `/denim/${fit}` },
    openGraph: {
      type: "website",
      title: `${title} | ${SITE.name}`,
      description: view.seoDescription,
      url: `${SITE.url}/denim/${fit}`,
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

export default async function DenimFitPage(props: PageProps<"/denim/[fit]">) {
  const { fit } = await props.params;
  const view = DENIM_VIEWS[fit as DenimView];
  if (!view) notFound();

  const products = await browseProducts(
    "collection" in view && view.collection
      ? { collection: view.collection }
      : { category: "Denim", fit: (view as { fit: string }).fit },
  );

  return (
    <BrowseLayout
      eyebrow="Denim"
      title={view.title}
      description={view.description}
      showBack
      backFallbackHref="/denim"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Denim", href: "/denim" },
        { label: view.title },
      ]}
      products={products}
      emptyMessage={`No ${view.title.toLowerCase()} denim available right now.`}
    />
  );
}
