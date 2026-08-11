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
/**
 * Alternates two lists, so a mixed band leads with one of each instead of all
 * the denim followed by all the t-shirts. Whichever list runs out first simply
 * stops contributing, so a catalogue with only one category still fills.
 */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

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

  // Featured and Shop the Look both show the range rather than one category,
  // alternating so the mix is visible in the first few tiles.
  const mixed = interleave(denim, tshirts);

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

      {/* 3 — Featured. Photography-led, built from live products across both
          categories rather than denim alone. */}
      <FeaturedEdit
        eyebrow="The collection"
        title="Featured"
        products={mixed}
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
      {mixed.length > 0 && (
        <ShopTheLookEdit
          products={mixed}
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
