"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/types";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { ProductGrid } from "./ProductGrid";
import { FilterPanel, type FacetGroup, type FilterKey } from "./FilterPanel";
import { CloseIcon } from "@/components/ui/Icons";
import { SortSelect } from "./SortSelect";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  applyFilters,
  buildFacets,
  sortProducts,
  type FilterState,
  type SortValue,
} from "@/lib/product-filters";

/**
 * Filter, sort and grid for every browse listing.
 *
 * Filtering happens over the products the page already has rather than through
 * a new request, so results change on the same frame as the tick and no API
 * work is repeated. Facets are built from that same set, which means a listing
 * only offers a filter that can actually change it — the denim page has no
 * "T-Shirts" option, and a page whose prices are all within a few hundred
 * rupees has no price bands.
 *
 * Desktop puts the panel in a sidebar beside a three-column grid; a phone gets
 * one FILTER button opening the same panel in a drawer.
 */
export function ProductBrowser({
  products,
  emptyMessage = "No products here yet.",
  collectionLabels = {},
}: {
  products: Product[];
  emptyMessage?: string;
  /** Collection handle → title, so the facet reads "Vintage Collection". */
  collectionLabels?: Record<string, string>;
}) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortValue>("featured");
  const [drawer, setDrawer] = useState(false);
  const reduce = useReducedMotion();

  // Built from the full set, so an option never disappears because the current
  // selection excludes it — which would make a filter impossible to undo from
  // the panel that set it.
  const facets = useMemo(
    () => buildFacets(products, collectionLabels),
    [products, collectionLabels],
  );

  const visible = useMemo(
    () => sortProducts(applyFilters(products, filters, facets.price, facets.discount), sort),
    [products, filters, facets.price, facets.discount, sort],
  );

  const count = activeFilterCount(filters);

  useLockBodyScroll(drawer);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  function toggle(key: FilterKey, value: string) {
    setFilters((f) => {
      const list = f[key];
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  const setInStock = (v: boolean) => setFilters((f) => ({ ...f, inStock: v }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  const groups: FacetGroup[] = (
    [
      { key: "category", label: "Category", options: facets.category },
      { key: "size", label: "Size", options: facets.size },
      { key: "color", label: "Colour", options: facets.color },
      { key: "collection", label: "Collection", options: facets.collection },
      { key: "fit", label: "Fit", options: facets.fit },
      {
        key: "price",
        label: "Price",
        options: facets.price.map((b) => ({ value: b.id, label: b.label, count: 0 })),
      },
      {
        key: "discount",
        label: "Discount",
        options: facets.discount.map((b) => ({ value: b.id, label: b.label, count: 0 })),
      },
    ] satisfies FacetGroup[]
  ).filter((g) => g.options.length > 0);

  const hasControls = groups.length > 0 || facets.hasStockMix;

  /** The chosen values, as removable chips. */
  const chips = [
    ...groups.flatMap((g) =>
      filters[g.key].map((v) => ({
        key: g.key,
        value: v,
        label: g.options.find((o) => o.value === v)?.label ?? v,
      })),
    ),
    ...(filters.inStock ? [{ key: "stock" as const, value: "", label: "In stock only" }] : []),
  ];

  const panel = (
    <FilterPanel
      groups={groups}
      filters={filters}
      onToggle={toggle}
      hasStockMix={facets.hasStockMix}
      onStockChange={setInStock}
    />
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      {hasControls && (
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-28 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-1">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <h2 className="nav-label text-ink">Filter</h2>
            {count > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="mt-5">{panel}</div>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
          {hasControls && (
            <button
              onClick={() => setDrawer(true)}
              className="nav-label flex items-center gap-2 text-ink lg:hidden"
            >
              Filter
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.625rem] text-white">
                  {count}
                </span>
              )}
            </button>
          )}

          <p className="micro-label order-last w-full sm:order-none sm:w-auto">
            {visible.length} {visible.length === 1 ? "product" : "products"}
          </p>

          {/* Sort is deliberately outside the filter panel: it is one choice,
              not a set, and it never narrows the results. */}
          <div className="ml-auto">
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>

        {/* ── Selected filters ──────────────────────────────────────────── */}
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={`${c.key}-${c.value}`}
                onClick={() =>
                  c.key === "stock" ? setInStock(false) : toggle(c.key as FilterKey, c.value)
                }
                className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink"
              >
                {c.label}
                <CloseIcon className="h-3 w-3 text-stone" />
              </button>
            ))}
            <button
              onClick={clearAll}
              className="ml-1 text-xs text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        <div className="mt-block">
          {visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-stone">
                {products.length === 0 ? emptyMessage : "No products match these filters."}
              </p>
              {count > 0 && (
                <button
                  onClick={clearAll}
                  className="mt-3 text-xs text-ink underline underline-offset-4"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            /* Three across beside the sidebar, so the cards keep the width
               they were designed at rather than being squeezed to four. */
            <ProductGrid products={visible} columns={3} priorityCount={3} />
          )}
        </div>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-[120] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close filters"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-ink/50"
            />
            <motion.div
              role="dialog"
              aria-label="Filter products"
              className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-white"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <p className="font-display text-lg text-ink">
                  Filter{count > 0 && <span className="text-stone"> · {count}</span>}
                </p>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="Close"
                  className="-m-2 grid h-10 w-10 place-items-center text-ink"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{panel}</div>

              <div className="flex shrink-0 items-center gap-3 border-t border-line px-5 py-4">
                <button
                  onClick={clearAll}
                  disabled={count === 0}
                  className="h-12 flex-1 border border-ink/25 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink disabled:opacity-40"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setDrawer(false)}
                  className="h-12 flex-1 bg-ink text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
                >
                  Apply · {visible.length}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
