"use client";

import type { Product } from "@/types";
import { useWishlist } from "@/lib/wishlist-context";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";

/**
 * Renders the caller's saved products. The wishlist is held client-side per
 * visitor, so the full catalogue comes from the server and is filtered here.
 */
export function WishlistGrid({ products }: { products: Product[] }) {
  const { liked } = useWishlist();
  const saved = products.filter((p) => liked.has(p.handle));

  return (
    <section className="py-section">
      <Container>
        {saved.length === 0 ? (
          <p className="py-20 text-center text-sm text-stone">
            Nothing saved yet. Tap the heart on a product to keep it here.
          </p>
        ) : (
          <ProductGrid products={saved} columns={4} />
        )}
      </Container>
    </section>
  );
}
