import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { browseProducts } from "@/services/browse";
import { BrowseLayout } from "@/layouts/BrowseLayout";

export const metadata: Metadata = {
  title: "Denim",
  description: "Every CONROY denim cut — slim, straight and relaxed.",
  alternates: { canonical: "/denim" },
  openGraph: { title: `Denim · ${SITE.name}`, url: `${SITE.url}/denim` },
};

export default async function DenimPage() {
  const products = await browseProducts({ category: "Denim" });
  return (
    <BrowseLayout
      eyebrow="The category"
      title="All Denim"
      description="Honest indigo and washed black, cut to last."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Denim" }]}
      products={products}
    />
  );
}
