"use client";

import type { Product } from "@/types";
import { useWishlist } from "@/lib/wishlist-context";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { ProductGrid } from "@/components/product/ProductGrid";

/** Mirrors a product card: 3:4 image, then title and price lines. */
function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="mt-5 w-full space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

/**
 * Renders the caller's saved products. The wishlist is held client-side per
 * visitor, so the full catalogue comes from the server and is filtered here.
 */
export function WishlistGrid({ products }: { products: Product[] }) {
  const { liked, loading, loadError, reload } = useWishlist();
  const saved = products.filter((p) => liked.has(p.handle));

  /*
   * Four states, kept apart. The saved list is read in the browser after this
   * page renders, so before that read finishes there is nothing to say — and
   * saying "nothing saved yet" to someone mid-load, or after a failed load,
   * tells them their wishlist is gone when it is not.
   */
  if (loading) {
    return (
      <section className="py-section">
        <Container>
          <SkeletonGroup
            label="Loading your wishlist"
            className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-14"
          >
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </SkeletonGroup>
        </Container>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="py-section">
        <Container>
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-stone">We couldn&apos;t load your wishlist.</p>
            <Button onClick={reload} variant="outline" size="sm">
              Try again
            </Button>
          </div>
        </Container>
      </section>
    );
  }

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
