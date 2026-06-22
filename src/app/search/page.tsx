"use client";

import { useMemo, useState } from "react";
import { searchProducts, getAllProducts } from "@/lib/products";
import { TRENDING_SEARCHES } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchIcon } from "@/components/ui/Icons";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchProducts(trimmed) : getAllProducts()),
    [trimmed],
  );

  return (
    <Container className="py-14 lg:py-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Search</h1>

      <label className="mt-8 flex max-w-2xl items-center gap-3 border-b border-ink pb-3">
        <SearchIcon className="h-5 w-5 text-stone" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I'm looking for…"
          className="w-full bg-transparent font-display text-2xl text-ink placeholder:text-stone/50 focus:outline-none"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.12em] text-stone">Trending:</span>
        {TRENDING_SEARCHES.map((term) => (
          <button
            key={term}
            onClick={() => setQuery(term)}
            className="rounded-full border border-line px-3.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {term}
          </button>
        ))}
      </div>

      <div className="mt-12">
        <p className="mb-8 text-sm text-stone">
          {trimmed
            ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${trimmed}”`
            : "Showing all products"}
        </p>
        {results.length > 0 ? (
          <ProductGrid products={results} columns={4} />
        ) : (
          <p className="py-16 text-center text-stone">
            No matches. Try “Straight Fit”, “Relax Fit”, or a colour.
          </p>
        )}
      </div>
    </Container>
  );
}
