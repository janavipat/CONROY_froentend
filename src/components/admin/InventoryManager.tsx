"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminListInventory,
  adminUpdateInventory,
  type InventoryItem,
  type ProductStatus,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { SearchIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const STATUSES: ProductStatus[] = ["active", "draft", "archived"];

/** The dot beside the status select. Semantic only: live, held back, retired. */
function dotCls(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "bg-[#16803C]";
    case "draft":
      return "bg-[#D97706]";
    default:
      return "bg-[#D4D4D4]";
  }
}

/* Compact table controls. Same border, radius and focus treatment as the Edit
   Product page's inputs, at 36px instead of 44px — a row of full-height fields
   would make the table twice as tall as it needs to be. */
/* Colour is deliberately NOT in the base: `cn` is plain clsx with no
   tailwind-merge, so a later "border-[#DC2626]/40" does not override an
   earlier "border-line" — both ship and CSS source order picks the winner.
   Each caller supplies exactly one border and one text colour instead. */
const cellInputBase =
  "h-9 w-full rounded-md border bg-white px-2.5 text-sm placeholder:text-stone focus:border-ink focus:outline-none";
const cellInput = cn(cellInputBase, "border-line text-ink");

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [originals, setOriginals] = useState<Record<string, InventoryItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const data = await adminListInventory();
        if (!active) return;
        setItems(data);
        setOriginals(Object.fromEntries(data.map((i) => [i.handle, { ...i }])));
      } catch {
        if (active) setError("Could not load inventory. (Run inventory.sql and start the backend.)");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  function edit(handle: string, patch: Partial<InventoryItem>) {
    setItems((prev) => prev.map((i) => (i.handle === handle ? { ...i, ...patch } : i)));
  }

  function isDirty(i: InventoryItem): boolean {
    const o = originals[i.handle];
    return !o || o.sku !== i.sku || o.stock !== i.stock || o.status !== i.status;
  }

  /**
   * Stops the mouse wheel from editing a stock field.
   *
   * A focused <input type="number"> steps on wheel, so scrolling a table this
   * long silently walked whatever had just been typed — the same defect that
   * turned a ₹999 price into ₹997 on the product form, here multiplied by a
   * row per product. Blurring lets the page scroll and leaves the value alone.
   */
  function blurOnWheel(e: React.WheelEvent<HTMLInputElement>) {
    e.currentTarget.blur();
  }

  async function save(i: InventoryItem) {
    setSavingId(i.handle);
    try {
      await adminUpdateInventory(i.handle, { stock: i.stock, sku: i.sku, status: i.status });
      setOriginals((prev) => ({ ...prev, [i.handle]: { ...i } }));
      toast(`${i.title} updated`, "success");
    } catch {
      toast("Could not save. Please retry.", "error");
    } finally {
      setSavingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      {/* ── Header: title, count, search on the same baseline ────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Inventory</h1>
          <p className="mt-1 text-sm text-stone">
            {loading
              ? "Loading…"
              : query.trim()
                ? `${filtered.length} of ${items.length} products`
                : `${items.length} product${items.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 rounded-md border border-line bg-white px-3 sm:w-auto sm:min-w-[280px]">
          <SearchIcon className="h-4 w-4 shrink-0 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or SKU…"
            aria-label="Search name or SKU"
            className="h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-stone"
          />
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader size="sm" label="" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center gap-1 py-16 text-center">
            <p className="text-sm text-ink">No products found.</p>
            {query.trim() && (
              <p className="text-[0.8125rem] text-stone">
                Nothing matches “{query.trim()}”.
              </p>
            )}
          </div>
        ) : (
          /* Narrow screens scroll the table sideways rather than crushing six
             columns of controls into the viewport. */
          <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
            <table className="w-full min-w-[800px] table-fixed border-collapse text-sm">
              {/* Every column but Product is fixed, so the controls line up
                  down the table and Product absorbs the slack instead of
                  leaving a gap on the right. The widths are sized to their
                  contents — a SKU is ~11 characters, not a fifth of the table
                  — and total 594px, so the whole row fits a 1120px laptop
                  without scrolling sideways. */}
              <colgroup>
                <col />
                <col className="w-[150px]" />
                <col className="w-[96px]" />
                <col className="w-[150px]" />
                <col className="w-[110px]" />
                <col className="w-[88px]" />
              </colgroup>

              <thead>
                <tr className="border-b border-[#E5E5E5] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-3 py-2.5 font-medium">SKU</th>
                  <th className="px-3 py-2.5 font-medium">Stock</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5 text-right font-medium">Save</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0F0EE]">
                {filtered.map((i) => {
                  const dirty = isDirty(i);
                  const out = i.stock === 0;
                  return (
                    <tr key={i.handle} className="transition-colors hover:bg-[#FAFAF9]">
                      <td className="px-4 py-2">
                        {/* The handle rides on the title's line rather than
                            under it: it fills the width Product is given on a
                            wide screen without making every row taller, and it
                            tells near-identical names apart. Dropped below xl,
                            where the column is too narrow to spare the room. */}
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="truncate font-medium text-ink" title={i.title}>
                            {i.title}
                          </span>
                          <span className="hidden shrink-0 whitespace-nowrap text-[0.75rem] text-[#A3A3A3] xl:block">
                            /{i.handle}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <input
                          value={i.sku}
                          onChange={(e) => edit(i.handle, { sku: e.target.value })}
                          placeholder="—"
                          aria-label={`SKU for ${i.title}`}
                          className={cellInput}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={i.stock}
                          onChange={(e) => edit(i.handle, { stock: Number(e.target.value) })}
                          onWheel={blurOnWheel}
                          aria-label={`Stock for ${i.title}`}
                          className={cn(
                            cellInputBase,
                            "tabular-nums",
                            // Out of stock is a warning, not a link — the old
                            // styling used the brand's royal blue accent.
                            out ? "border-[#DC2626]/50 text-[#DC2626]" : "border-line text-ink",
                          )}
                        />
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-full", dotCls(i.status))}
                            aria-hidden
                          />
                          <select
                            value={i.status}
                            onChange={(e) =>
                              edit(i.handle, { status: e.target.value as ProductStatus })
                            }
                            aria-label={`Status for ${i.title}`}
                            className={cn(cellInput, "capitalize")}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s} className="capitalize">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums text-ink">
                        {formatCurrency(i.price, i.currency)}
                      </td>

                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => save(i)}
                          disabled={!dirty || savingId === i.handle}
                          className={cn(
                            "h-8 w-full rounded-md px-2 text-xs font-medium transition-colors",
                            dirty
                              ? "bg-ink text-white hover:opacity-90"
                              : "cursor-default border border-line text-stone",
                          )}
                        >
                          {savingId === i.handle ? "…" : dirty ? "Save" : "Saved"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
