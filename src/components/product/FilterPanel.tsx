"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { PlusIcon, MinusIcon } from "@/components/ui/Icons";
import type { FilterState } from "@/lib/product-filters";

export type FilterKey = keyof Omit<FilterState, "inStock">;

export interface FacetGroup {
  key: FilterKey;
  label: string;
  options: { value: string; label: string; count: number }[];
}

/**
 * One collapsible facet.
 *
 * Open by default: on a listing with five facets the panel is short enough to
 * read at a glance, and a shopper should see what they can narrow by without
 * clicking anything first. The control is a real button with aria-expanded, so
 * it works from the keyboard and reads correctly to a screen reader.
 */
function Section({
  title,
  chosen,
  children,
}: {
  title: string;
  chosen: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-line py-5 first:pt-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="nav-label text-ink">
          {title}
          {chosen > 0 && <span className="ml-1.5 text-accent">({chosen})</span>}
        </span>
        {open ? (
          <MinusIcon className="h-3.5 w-3.5 shrink-0 text-stone" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5 shrink-0 text-stone" />
        )}
      </button>

      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

/**
 * The filter panel — one component for the desktop sidebar and the mobile
 * drawer, so the two can never drift apart.
 *
 * Checkboxes rather than pills: several values per facet is the normal case
 * ("32 or 34"), and a checkbox says that without needing to be discovered.
 */
export function FilterPanel({
  groups,
  filters,
  onToggle,
  hasStockMix,
  onStockChange,
}: {
  groups: FacetGroup[];
  filters: FilterState;
  onToggle: (key: FilterKey, value: string) => void;
  hasStockMix: boolean;
  onStockChange: (v: boolean) => void;
}) {
  return (
    <div>
      {groups.map((g) => (
        <Section key={g.key} title={g.label} chosen={filters[g.key].length}>
          <ul className="space-y-0.5">
            {g.options.map((o) => {
              const checked = filters[g.key].includes(o.value);
              return (
                <li key={o.value}>
                  {/* The whole row is the target — a bare 16px box is a poor
                      one on a phone. */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 py-1.5 text-sm transition-colors",
                      checked ? "text-ink" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(g.key, o.value)}
                      className="h-4 w-4 shrink-0 accent-ink"
                    />
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.count > 0 && (
                      <span className="shrink-0 text-xs tabular-nums text-stone">{o.count}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}

      {hasStockMix && (
        <Section title="Availability" chosen={filters.inStock ? 1 : 0}>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 py-1.5 text-sm transition-colors",
              filters.inStock ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onStockChange(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-ink"
            />
            In stock only
          </label>
        </Section>
      )}
    </div>
  );
}
