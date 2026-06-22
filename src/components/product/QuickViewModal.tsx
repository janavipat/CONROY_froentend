"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { Rating } from "@/components/ui/Rating";
import { AddToCartForm } from "./AddToCartForm";

export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label={`Quick view: ${product.title}`} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
      <div className="grid sm:grid-cols-2">
        <div className="relative aspect-[4/5] bg-mist">
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt}
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <div>
            <h2 className="font-display text-2xl text-ink">{product.title}</h2>
            <p className="mt-1 text-sm text-stone">{product.tagline}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg text-ink">{formatCurrency(product.price, product.currency)}</span>
            <Rating value={product.rating} count={product.reviewCount} />
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">{product.description}</p>
          <AddToCartForm product={product} compact />
          <Link
            href={`/products/${product.handle}`}
            onClick={onClose}
            className="text-xs uppercase tracking-[0.18em] text-ink underline-offset-4 hover:underline"
          >
            View full details
          </Link>
        </div>
      </div>
    </Modal>
  );
}
