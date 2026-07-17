import dynamic from "next/dynamic";
import { Hero } from "@/sections/Hero";
import { ShopsSlider } from "@/sections/ShopsSlider";
import { CampaignBanner } from "@/sections/CampaignBanner";
import { HeritageStory } from "@/sections/HeritageStory";
import { Philosophy } from "@/sections/Philosophy";
import { ServiceFeatures } from "@/sections/ServiceFeatures";
import { CTASection } from "@/sections/CTASection";
import { fetchSiteSettings, isOn } from "@/services/settings";

// Below-the-fold sections are code-split to keep the initial bundle lean.
const Testimonials = dynamic(() =>
  import("@/sections/Testimonials").then((m) => m.Testimonials),
);

export default async function HomePage() {
  // Section visibility is admin-controlled (Settings → Homepage sections).
  const settings = await fetchSiteSettings();
  const show = (key: string) => isOn(settings, key);

  return (
    <>
      <Hero />
      {/* Sections alternate dark → light → dark so the two navy bands (Shops
          and the Film) never sit back to back and merge into one block. */}
      {show("section.shops") && <ShopsSlider />}
      {show("section.heritage") && <HeritageStory />}
      {show("section.campaign") && <CampaignBanner />}
      {show("section.philosophy") && <Philosophy />}
      {show("section.services") && <ServiceFeatures />}
      {show("section.testimonials") && <Testimonials />}
      {show("section.cta") && <CTASection />}
    </>
  );
}
