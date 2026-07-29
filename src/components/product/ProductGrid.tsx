import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
}: {
  products: Product[];
  columns?: 2 | 3 | 4;
  priorityCount?: number;
}) {
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-x-6 gap-y-14 sm:gap-x-8 lg:gap-x-10 lg:gap-y-20", colClass)}>
      {products.map((product, i) => (
        <Reveal key={product.id} index={i % columns} as="div">
          <ProductCard product={product} priority={i < priorityCount} />
        </Reveal>
      ))}
    </div>
  );
}
