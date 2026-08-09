import { Hero } from "@/sections/Hero";
import { ProductRail } from "@/sections/ProductRail";
import { EditBanner } from "@/sections/EditBanner";
import { FeaturedEdit } from "@/sections/FeaturedEdit";
import { ShopTheLookEdit } from "@/sections/ShopTheLookEdit";
import { HeritageStory } from "@/sections/HeritageStory";
import { CampaignBanner } from "@/sections/CampaignBanner";
import { ServiceFeatures } from "@/sections/ServiceFeatures";
import { fetchSiteSettings, isOn } from "@/services/settings";
import { browseProducts, fetchBestSellers } from "@/services/browse";

/**
 * Homepage composition — a fashion-brand storytelling order rather than a
 * catalogue dump:
 *
 *   Hero → Denim Edit → Featured → T-Shirt Edit → Best Sellers
 *        → Shop the Look → Brand Story → Newsletter (in the footer)
 *
 * New In is deliberately absent: it is admin-curated, so as a permanent
 * homepage rail it sat empty (or one card wide in a four-column grid) and left
 * a hole near the top of the page. It now lives in the header's New In menu,
 * where an under-filled rail costs nothing.
 *
 * Every band here is sized by its content. Data-driven sections render nothing
 * at all when they have no products, so a section that isn't curated yet
 * disappears instead of reserving space. Section visibility remains
 * admin-controlled through site settings.
 */
export default async function HomePage() {
  const settings = await fetchSiteSettings();
  const show = (key: string) => isOn(settings, key);

  const [bestSellers, denim, tshirts] = await Promise.all([
    fetchBestSellers(),
    browseProducts({ category: "Denim" }),
    browseProducts({ category: "T-Shirts" }),
  ]);

  // The Denim Edit's photograph comes from the catalogue itself, so it is
  // always real CONROY product photography and never a placeholder.
  const denimImage = denim.find((p) => p.images[0]?.src)?.images[0];

  return (
    <>
      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Denim Edit */}
      <EditBanner
        eyebrow="The edit"
        title="Denim, made to last"
        description="Slim, straight and relaxed cuts in honest indigo and washed black."
        href="/denim"
        ctaLabel="Shop all denim"
        image={denimImage?.src}
        imageAlt={denimImage?.alt ?? "CONROY denim"}
      />

      {/* 3 — Featured. Photography-led, built from live products. */}
      <FeaturedEdit
        eyebrow="The collection"
        title="Featured"
        products={denim}
        href="/denim"
        ctaLabel="Shop all denim"
      />

      {/* 4 — T-Shirt Edit. Hidden entirely until T-shirts exist. */}
      {tshirts.length > 0 && (
        <EditBanner
          eyebrow="The edit"
          title="T-Shirts"
          description="Everyday essentials in honest cotton."
          href="/t-shirts"
          ctaLabel="Shop all t-shirts"
          image={tshirts.find((p) => p.images[0]?.src)?.images[0]?.src}
          imageAlt="CONROY t-shirts"
          imageSide="right"
        />
      )}

      {/* 5 — Best Sellers. Admin-curated; renders nothing until something is
          marked, and narrows to however many products there are. */}
      <ProductRail
        eyebrow="Loved most"
        title="Best Sellers"
        products={bestSellers}
        href="/denim"
        ctaLabel="Shop all denim"
        className="bg-paper py-section-sm"
      />

      {/* 6 — Shop the Look */}
      {denim.length > 0 && (
        <ShopTheLookEdit
          products={denim}
          href="/shop-the-look"
          ctaLabel="Explore the look"
        />
      )}

      {/* 7 — Brand story */}
      {show("section.heritage") && <HeritageStory />}
      {show("section.campaign") && <CampaignBanner />}

      {show("section.services") && <ServiceFeatures />}
      {/* 8 — Newsletter and 9 — Footer are rendered by StoreChrome. */}
    </>
  );
}
