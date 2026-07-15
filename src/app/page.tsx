import dynamic from "next/dynamic";
import { Hero } from "@/sections/Hero";
import { ShopsSlider } from "@/sections/ShopsSlider";
import { CampaignBanner } from "@/sections/CampaignBanner";
import { HeritageStory } from "@/sections/HeritageStory";
import { Philosophy } from "@/sections/Philosophy";
import { ServiceFeatures } from "@/sections/ServiceFeatures";
import { CTASection } from "@/sections/CTASection";

// Below-the-fold sections are code-split to keep the initial bundle lean.
const Testimonials = dynamic(() =>
  import("@/sections/Testimonials").then((m) => m.Testimonials),
);

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Sections alternate dark → light → dark so the two navy bands (Shops
          and the Film) never sit back to back and merge into one block.
          The Shops is also the single product entry point — the previous
          "What's New" and "Denim, Made to Last" rails showed the same four
          styles over again. */}
      <ShopsSlider />
      <HeritageStory />
      <CampaignBanner />
      <Philosophy />
      <ServiceFeatures />
      <Testimonials />
      <CTASection />
    </>
  );
}
