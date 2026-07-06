import dynamic from "next/dynamic";
import { Hero } from "@/sections/Hero";
import { FeaturedProducts } from "@/sections/FeaturedProducts";
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
      <FeaturedProducts />
      <Philosophy />
      <ServiceFeatures />
      <Testimonials />
      <CTASection />
    </>
  );
}
