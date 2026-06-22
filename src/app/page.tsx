import dynamic from "next/dynamic";
import { Hero } from "@/sections/Hero";
import { CollectionShowcase } from "@/sections/CollectionShowcase";
import { FeaturedProducts } from "@/sections/FeaturedProducts";
import { Philosophy } from "@/sections/Philosophy";
import { ServiceFeatures } from "@/sections/ServiceFeatures";
import { CTASection } from "@/sections/CTASection";

// Below-the-fold sections are code-split to keep the initial bundle lean.
const Testimonials = dynamic(() =>
  import("@/sections/Testimonials").then((m) => m.Testimonials),
);
const InstagramFeed = dynamic(() =>
  import("@/sections/InstagramFeed").then((m) => m.InstagramFeed),
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <CollectionShowcase />
      <FeaturedProducts />
      <Philosophy />
      <ServiceFeatures />
      <Testimonials />
      <InstagramFeed />
      <CTASection />
    </>
  );
}
