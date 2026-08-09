import { Hero } from "@/sections/Hero";
import { ProductRail } from "@/sections/ProductRail";
import { EditBanner } from "@/sections/EditBanner";
import { HeritageStory } from "@/sections/HeritageStory";
import { CampaignBanner } from "@/sections/CampaignBanner";
import { ServiceFeatures } from "@/sections/ServiceFeatures";
import { fetchSiteSettings, isOn } from "@/services/settings";
import { browseProducts, fetchBestSellers, fetchNewIn } from "@/services/browse";

/**
 * Homepage composition — a fashion-brand storytelling order rather than a
 * catalogue dump:
 *
 *   Hero → New In → Denim Edit → Featured → Brand Story → Shop the Look
 *        → Best Sellers → T-Shirt Edit → Newsletter (in the footer)
 *
 * Rails that have no products render nothing rather than an empty state, so
 * the page stays coherent while New In and Best Sellers are still unset.
 * Section visibility remains admin-controlled through site settings.
 */
export default async function HomePage() {
  const settings = await fetchSiteSettings();
  const show = (key: string) => isOn(settings, key);

  const [newIn, bestSellers, denim, tshirts] = await Promise.all([
    fetchNewIn(),
    fetchBestSellers(),
    browseProducts({ category: "Denim" }),
    browseProducts({ category: "T-Shirts" }),
  ]);

  return (
    <>
      {/* 1 — Hero */}
      <Hero />

      {/* 2 — New In. Admin-curated; hidden until something is marked. */}
      <ProductRail
        eyebrow="Just arrived"
        title="New In"
        description="The latest pieces to join the collection."
        products={newIn}
        href="/new-in"
        ctaLabel="View all new in"
      />

      {/* 3 — Denim Edit */}
      {show("section.heritage") && <HeritageStory />}
      <EditBanner
        eyebrow="The edit"
        title="Denim, made to last"
        description="Slim, straight and relaxed cuts in honest indigo and washed black."
        href="/denim"
        ctaLabel="Shop all denim"
      />

      {/* 4 — Featured products */}
      <ProductRail
        eyebrow="The collection"
        title="Featured"
        products={denim}
        href="/denim"
        ctaLabel="Shop all denim"
        className="bg-paper py-section"
      />

      {/* 5 — Brand story */}
      {show("section.campaign") && <CampaignBanner />}

      {/* 6 — Shop the Look */}
      <EditBanner
        eyebrow="Styled by CONROY"
        title="Shop the Look"
        description="Complete outfits, put together by our team."
        href="/shop-the-look"
        ctaLabel="Explore the looks"
        className="py-section"
      />

      {/* 7 — Best Sellers. Admin-curated, like New In. */}
      <ProductRail
        eyebrow="Loved most"
        title="Best Sellers"
        products={bestSellers}
        href="/denim"
        ctaLabel="Shop all denim"
        className="bg-paper py-section"
      />

      {/* 8 — T-Shirt Edit. Hidden entirely until T-shirts exist. */}
      {tshirts.length > 0 && (
        <EditBanner
          eyebrow="The edit"
          title="T-Shirts"
          description="Everyday essentials in honest cotton."
          href="/t-shirts"
          ctaLabel="Shop all t-shirts"
          className="py-section"
        />
      )}

      {show("section.services") && <ServiceFeatures />}
      {/* 9 — Newsletter and 10 — Footer are rendered by StoreChrome. */}
    </>
  );
}
