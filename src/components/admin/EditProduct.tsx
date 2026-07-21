"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { adminGetProduct } from "@/services/admin";
import { ProductForm } from "./ProductForm";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";

export function EditProduct({ handle }: { handle: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let active = true;
    adminGetProduct(handle)
      .then((p) => {
        if (active) {
          setProduct(p);
          setState("ready");
        }
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [handle]);

  if (state === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader size="sm" label="" />
      </div>
    );
  }

  if (state === "error" || !product) {
    return (
      <div className="grid min-h-[40vh] place-items-center gap-3 text-center">
        <p className="text-stone">Could not load “{handle}”.</p>
        <Button href="/admin/products" variant="outline" size="sm">
          Back to products
        </Button>
      </div>
    );
  }

  return <ProductForm initial={product} />;
}
