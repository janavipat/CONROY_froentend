"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { searchProducts } from "@/lib/products";
import { TRENDING_SEARCHES } from "@/lib/site";
import { formatCurrency } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { SearchIcon } from "@/components/ui/Icons";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <Modal open={open} onClose={onClose} position="top" label="Search" className="w-full">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <label className="flex items-center gap-3 border-b border-ink pb-3">
          <SearchIcon className="h-5 w-5 text-stone" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I'm looking for…"
            className="w-full bg-transparent font-display text-2xl text-ink placeholder:text-stone/50 focus:outline-none"
          />
        </label>

        {query.trim() === "" ? (
          <div className="mt-6">
            <p className="eyebrow text-stone">Trending searches</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            {results.length === 0 ? (
              <p className="py-8 text-center text-stone">
                No matches for “{query}”. Try a different search.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.handle}`}
                      onClick={onClose}
                      className="flex items-center gap-4 py-3"
                    >
                      <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-cream">
                        <Image
                          src={p.images[0].src}
                          alt={p.images[0].alt}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm text-ink">{p.title}</span>
                        <span className="block text-xs text-stone">{p.fit}</span>
                      </span>
                      <span className="text-sm text-ink">{formatCurrency(p.price, p.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
