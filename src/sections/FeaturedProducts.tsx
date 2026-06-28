import { fetchAllProducts } from "@/services/catalog";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export async function FeaturedProducts() {
  const products = await fetchAllProducts();
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="The Collection"
          title="Denim, Made to Last"
          description="Four considered styles in heritage indigo and washed black — straight and relaxed fits for every day."
          className="mb-12"
        />
        <ProductGrid products={products} columns={4} />
        <Reveal className="mt-14 flex justify-center">
          <Button href="/collections/all" variant="outline" size="lg">
            View all products
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
