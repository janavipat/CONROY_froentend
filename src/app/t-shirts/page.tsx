import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

export const metadata: Metadata = {
  title: "T-Shirts",
  description: "CONROY T-shirts.",
  alternates: { canonical: "/t-shirts" },
  openGraph: { title: `T-Shirts · ${SITE.name}`, url: `${SITE.url}/t-shirts` },
};

/**
 * Kept structurally separate from denim: T-shirts have their own category and
 * their own fits, and must never inherit denim's slim/straight/relaxed set.
 * The catalogue holds no T-shirts yet, so this renders an empty state rather
 * than placeholder products.
 */
export default async function TShirtsPage() {
  const products = await browseProducts({ category: "T-Shirts" });
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All T-Shirts"
      description="Everyday essentials in honest cotton."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "T-Shirts" }]}
      products={products}
      emptyMessage="No T-shirts in the catalogue yet. Add one from the admin panel with Category set to T-Shirts."
    />
  );
}
