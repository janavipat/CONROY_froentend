"use client";

import { useEffect, useState } from "react";
import {
  adminListInventory,
  adminUpdateInventory,
  type InventoryItem,
  type ProductStatus,
} from "@/services/admin";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/utils/cn";

const STATUSES: ProductStatus[] = ["active", "draft", "archived"];

function statusCls(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "bg-green-600 text-white";
    case "draft":
      return "bg-amber-500 text-white";
    default:
      return "bg-mist text-ink-soft";
  }
}

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

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.sku.toLowerCase().includes(query.toLowerCase()),
  );

  const inputCls =
    "h-9 rounded-md border border-line bg-white px-2 text-sm text-ink focus:border-ink focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Inventory</h1>
          <p className="mt-1 text-sm text-stone">
            {loading ? "Loading…" : `${items.length} product${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or SKU…"
          className="h-10 w-full max-w-xs rounded-md border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-media border border-line bg-white py-16">
          <Loader label="Loading inventory" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-media border border-line bg-white">
          {/* Header */}
          <div className="hidden min-w-[720px] grid-cols-[2fr_1.2fr_0.9fr_1.1fr_0.9fr_90px] items-center gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-stone sm:grid">
            <span>Product</span>
            <span>SKU</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Price</span>
            <span className="text-right">Save</span>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-stone">No products found.</p>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((i) => {
                const dirty = isDirty(i);
                return (
                  <li
                    key={i.handle}
                    className="grid min-w-[720px] grid-cols-[2fr_1.2fr_0.9fr_1.1fr_0.9fr_90px] items-center gap-4 px-5 py-3"
                  >
                    <span className="truncate text-sm font-medium text-ink">{i.title}</span>
                    <input
                      value={i.sku}
                      onChange={(e) => edit(i.handle, { sku: e.target.value })}
                      placeholder="—"
                      className={cn(inputCls, "w-full")}
                    />
                    <input
                      type="number"
                      min={0}
                      value={i.stock}
                      onChange={(e) => edit(i.handle, { stock: Number(e.target.value) })}
                      className={cn(inputCls, "w-20", i.stock === 0 && "border-accent text-accent")}
                    />
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusCls(i.status))} />
                      <select
                        value={i.status}
                        onChange={(e) => edit(i.handle, { status: e.target.value as ProductStatus })}
                        className={cn(inputCls, "w-full capitalize")}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm text-ink">{formatCurrency(i.price, i.currency)}</span>
                    <div className="text-right">
                      <button
                        onClick={() => save(i)}
                        disabled={!dirty || savingId === i.handle}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          dirty
                            ? "bg-ink text-white hover:opacity-90"
                            : "cursor-default border border-line text-stone",
                        )}
                      >
                        {savingId === i.handle ? "…" : dirty ? "Save" : "Saved"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
