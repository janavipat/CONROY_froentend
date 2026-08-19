import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

/**
 * Denim sub-navigation. Slim/Straight/Relaxed filter on the `fit` field;
 * Vintage is a merchandising grouping, so it resolves through the existing
 * collection join table instead — the two are deliberately different concepts.
 */
const DENIM_VIEWS = {
  slim: { title: "Slim Fit", description: "Cut close through the thigh and leg.", fit: "Slim Fit" },
  straight: { title: "Straight Fit", description: "A clean line from knee to hem.", fit: "Straight Fit" },
  relaxed: { title: "Relaxed Fit", description: "Easy through the seat and thigh.", fit: "Relaxed Fit" },
  vintage: {
    title: "Vintage",
    description: "Washed and faded denim from the CONROY Vintage collection.",
    collection: "vintage-collection",
  },
} as const satisfies Record<
  string,
  { title: string; description: string; fit?: string; collection?: string }
>;

type DenimView = keyof typeof DENIM_VIEWS;

export function generateStaticParams() {
  return Object.keys(DENIM_VIEWS).map((fit) => ({ fit }));
}

export async function generateMetadata(props: PageProps<"/denim/[fit]">): Promise<Metadata> {
  const { fit } = await props.params;
  const view = DENIM_VIEWS[fit as DenimView];
  if (!view) return { title: "Not found" };
  return {
    title: `${view.title} Denim`,
    description: view.description,
    alternates: { canonical: `/denim/${fit}` },
    openGraph: { title: `${view.title} · ${SITE.name}`, url: `${SITE.url}/denim/${fit}` },
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
