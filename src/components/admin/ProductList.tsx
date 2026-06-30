"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { adminListProducts, adminDeleteProduct } from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await adminListProducts();
        if (active) {
          setProducts(data);
          setError("");
        }
      } catch {
        if (active) setError("Could not load products. Is the backend running?");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(handle: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setDeleting(handle);
    try {
      await adminDeleteProduct(handle);
      setProducts((prev) => prev.filter((p) => p.handle !== handle));
    } catch {
      setError("Delete failed. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-stone">
            {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button href="/admin/products/new" size="md">
          <PlusIcon className="h-4 w-4" /> New product
        </Button>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-media border border-line bg-white">
        {/* Header row (desktop) */}
        <div className="hidden grid-cols-[64px_1.6fr_1fr_0.8fr_0.8fr_140px] items-center gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
          <span />
          <span>Name</span>
          <span>Type</span>
          <span>Colour</span>
          <span>Price</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
          </div>
        ) : products.length === 0 ? (
          <div className="grid place-items-center gap-3 py-16 text-center">
            <p className="text-stone">No products yet.</p>
            <Button href="/admin/products/new" variant="outline" size="sm">
              Create your first product
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[56px_1fr] items-center gap-4 px-4 py-3 sm:grid-cols-[64px_1.6fr_1fr_0.8fr_0.8fr_140px] sm:px-5"
              >
                <span className="relative h-14 w-12 overflow-hidden rounded-md bg-mist">
                  {p.images[0] && (
                    <Image
                      src={p.images[0].src}
                      alt={p.images[0].alt || p.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <Link
                    href={`/admin/products/${p.handle}/edit`}
                    className="block truncate text-sm font-medium text-ink hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="block truncate text-xs text-stone sm:hidden">
                    {p.fit} · {formatCurrency(p.price, p.currency)}
                  </span>
                </span>
                <span className="hidden text-sm text-ink-soft sm:block">{p.fit}</span>
                <span className="hidden text-sm text-ink-soft sm:block">{p.color || "—"}</span>
                <span className="hidden text-sm text-ink sm:block">
                  {formatCurrency(p.price, p.currency)}
                </span>
                <span className="col-start-2 flex items-center justify-end gap-2 sm:col-start-auto">
                  <Link
                    href={`/admin/products/${p.handle}/edit`}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p.handle, p.title)}
                    disabled={deleting === p.handle}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-accent transition-colors hover:border-accent disabled:opacity-50"
                  >
                    {deleting === p.handle ? "…" : "Delete"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
