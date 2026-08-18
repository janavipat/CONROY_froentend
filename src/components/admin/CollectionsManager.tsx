"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types";
import {
  adminListCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
  adminGetCollectionProducts,
  adminSetCollectionProducts,
  adminListProducts,
  type AdminCollection,
  type AdminCollectionPayload,
} from "@/services/admin";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { PlusIcon, SearchIcon } from "@/components/ui/Icons";
import { ConfirmDialog } from "./ui";
import { cn } from "@/utils/cn";

const EMPTY: AdminCollectionPayload = { title: "", subtitle: "", description: "", image: "" };

/* Inputs are the Edit Product page's, verbatim, so the two forms are the same
   control at the same height with the same focus ring. */
const field =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none";
const labelBase = "block text-xs font-medium uppercase tracking-wide text-stone";
const label = `mb-1.5 ${labelBase}`;

/** Thin scrollbars for the two panes that scroll inside themselves. */
const thinScroll =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15";

/** Mirrors the server's slug rule, for previewing the handle a title will get. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countLabel(n: number): string {
  if (n === -1) return "All products";
  return `${n} product${n === 1 ? "" : "s"}`;
}

export function CollectionsManager() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [form, setForm] = useState<AdminCollectionPayload>(EMPTY);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Search is display-only: it narrows what is listed, never what is saved.
  const [query, setQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminCollection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Below `lg` the editor sits under the list, a screen or more down. Tapping a
   * row would change something the operator can't see — the dark row is the
   * only hint anything happened. Bring the editor to them. On desktop the two
   * columns are side by side and nothing needs to move.
   */
  function revealEditor() {
    if (window.innerWidth >= 1024) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    editorRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  async function refresh() {
    try {
      const [cols, prods] = await Promise.all([adminListCollections(), adminListProducts()]);
      setCollections(cols);
      setProducts(prods);
    } catch {
      setError("Could not load collections. (Start the backend and run schema.sql.)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function run() {
      await refresh();
      if (!active) return;
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingHandle(null);
    setSelected(new Set());
    setProductQuery("");
    setError("");
  }

  async function editCollection(c: AdminCollection) {
    setEditingHandle(c.handle);
    setForm({ title: c.title, subtitle: c.subtitle, description: c.description, image: c.image });
    setProductQuery("");
    setError("");
    revealEditor();
    try {
      const handles = await adminGetCollectionProducts(c.handle);
      setSelected(new Set(handles));
    } catch {
      setSelected(new Set());
    }
  }

  function toggleProduct(handle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
  }

  async function save() {
    if (!form.title.trim()) return setError("Give the collection a title.");
    setSaving(true);
    setError("");
    try {
      let handle = editingHandle;
      if (editingHandle) {
        await adminUpdateCollection(editingHandle, form);
      } else {
        const res = await adminCreateCollection(form);
        handle = res.data.handle;
      }
      // Persist product membership (skip for the auto "all" collection).
      if (handle && handle !== "all") {
        await adminSetCollectionProducts(handle, [...selected]);
      }
      toast(editingHandle ? "Collection updated" : "Collection created", "success");
      resetForm();
      await refresh();
    } catch {
      setError("Could not save the collection. A handle may already exist.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(handle: string) {
    setDeleting(true);
    setCollections((cs) => cs.filter((c) => c.handle !== handle));
    try {
      await adminDeleteCollection(handle);
      toast("Collection deleted", "info");
      // The editor was showing the row that just went — clear it rather than
      // leave a form pointed at a collection that no longer exists.
      if (editingHandle === handle) resetForm();
    } catch {
      await refresh();
      setError("Could not delete the collection. Please retry.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const isAll = editingHandle === "all";
  const editing = editingHandle !== null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => `${c.title} ${c.handle}`.toLowerCase().includes(q));
  }, [collections, query]);

  const visibleProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.title} ${p.handle}`.toLowerCase().includes(q));
  }, [products, productQuery]);

  /* The handle a new collection will be created with, previewed live from the
     title. On an existing collection it is fixed — the update endpoint keys off
     the handle in the URL and never writes a new one, so an editable box here
     would silently discard whatever was typed into it. */
  const handlePreview = editing ? editingHandle : form.handle || slugify(form.title);

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-stone">
            Group products into collections shoppers can browse.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            revealEditor();
          }}
          size="md"
        >
          <PlusIcon className="h-4 w-4" /> New collection
        </Button>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Two columns on desktop, stacked below it. The list column is fixed and
          the editor takes the rest, so the editor never stretches thin on a
          wide screen and the page keeps its shape from 1024px up. */}
      <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Left: collections list ─────────────────────────────────────── */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">
              Collections
            </h2>
            <span className="shrink-0 rounded-md bg-[#F5F5F4] px-2 py-0.5 text-[0.6875rem] font-medium text-[#737373]">
              {collections.length}
            </span>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center gap-2 rounded-md border border-line px-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-stone" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search collections…"
                aria-label="Search collections"
                className="h-9 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-stone"
              />
            </div>
          </div>

          {/* Scrolls inside itself. A sticky column taller than the viewport can
              never be scrolled to its end, so the cap is what keeps the last
              row reachable. */}
          <div className={cn("max-h-[calc(100vh-15rem)] min-h-[120px] overflow-y-auto px-2 pb-2", thinScroll)}>
            {loading ? (
              <div className="grid place-items-center py-12">
                <Loader size="sm" label="" />
              </div>
            ) : visible.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-stone">
                {collections.length === 0 ? "No collections yet." : "No collections match your search."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {visible.map((c) => {
                  const active = editingHandle === c.handle;
                  return (
                    <li key={c.handle}>
                      <button
                        type="button"
                        onClick={() => editCollection(c)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                          active ? "bg-[#111111]" : "hover:bg-[#F5F5F4]",
                        )}
                      >
                        <span
                          className={cn(
                            "block truncate text-[0.8125rem] font-medium",
                            active ? "text-white" : "text-[#171717]",
                          )}
                        >
                          {c.title}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-[0.75rem]",
                            active ? "text-white/60" : "text-[#737373]",
                          )}
                        >
                          /{c.handle} · {countLabel(c.productCount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right: editor ──────────────────────────────────────────────── */}
        <div
          ref={editorRef}
          className="min-w-0 scroll-mt-20 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] px-6 py-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg text-ink">
                {editing ? "Edit collection" : "New collection"}
              </h2>
              <p className="mt-0.5 truncate text-[0.75rem] text-[#737373]">
                {editing
                  ? `/collections/${editingHandle}`
                  : "Create a collection, then choose the products it holds."}
              </p>
            </div>
            {isAll && (
              <span className="shrink-0 rounded-md bg-[#F5F5F4] px-2.5 py-1 text-[0.6875rem] font-medium text-[#737373]">
                Automatic
              </span>
            )}
          </div>

          <div className="@container space-y-5 p-6">
            {/* Keyed to the card's own width, not the screen's: this column is
                narrowed by the sidebar and the list beside it, so at 1024px a
                viewport-based `sm:` split gave two 172px inputs. */}
            <div className="grid gap-5 @[520px]:grid-cols-2">
              <div className="min-w-0">
                <label className={label} htmlFor="col-title">
                  Collection name
                </label>
                <input
                  id="col-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Summer Edit"
                  className={field}
                />
              </div>
              <div className="min-w-0">
                <label className={label} htmlFor="col-handle">
                  Handle
                </label>
                <input
                  id="col-handle"
                  value={handlePreview}
                  onChange={(e) => setForm((f) => ({ ...f, handle: slugify(e.target.value) }))}
                  readOnly={editing}
                  placeholder="summer-edit"
                  className={cn(field, editing && "cursor-not-allowed bg-[#FAFAF9] text-stone")}
                />
                <p className="mt-1.5 text-[0.6875rem] text-[#A3A3A3]">
                  {editing
                    ? "Fixed after creation — the storefront URL depends on it."
                    : "The storefront URL. Left blank, it follows the name."}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <label className={label} htmlFor="col-subtitle">
                Subtitle
              </label>
              <input
                id="col-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Optional — shown under the title on the storefront"
                className={field}
              />
            </div>

            <div className="min-w-0">
              <label className={label} htmlFor="col-description">
                Description
              </label>
              <textarea
                id="col-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional — a short line about what belongs here."
                rows={3}
                className="w-full resize-y rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
              />
            </div>

            <div className="min-w-0">
              <label className={label} htmlFor="col-image">
                Image
              </label>
              <div className="flex items-start gap-3">
                {/* A plain <img>: this URL is typed by hand and can point at any
                    host, while next/image only serves the three domains allowed
                    in next.config. */}
                <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-mist">
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-stone" aria-hidden>
                      <path
                        d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-9Zm1.6 8.9 3.6-4 2.6 2.9 1.9-2 2.7 3.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  id="col-image"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://…"
                  className={field}
                />
              </div>
            </div>

            {/* Products — capped and scrollable, so a long catalogue doesn't
                push the save actions off the screen. */}
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                {/* labelBase, not label — `cn` is plain clsx, so an "mb-0" after
                    an "mb-1.5" would not reliably win. */}
                <span className={labelBase}>Products</span>
                <span className="text-[0.75rem] text-[#737373]">
                  {isAll ? "Automatic" : `${selected.size} selected`}
                </span>
              </div>

              {isAll ? (
                <p className="rounded-md border border-line bg-[#FAFAF9] px-3 py-2.5 text-[0.8125rem] text-stone">
                  The “all” collection always contains every product. Its membership can’t be
                  edited.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border border-line">
                  <div className="flex items-center gap-2 border-b border-line px-3">
                    <SearchIcon className="h-4 w-4 shrink-0 text-stone" />
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products…"
                      aria-label="Search products"
                      className="h-9 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-stone"
                    />
                  </div>
                  <div className={cn("max-h-[260px] overflow-y-auto p-1.5", thinScroll)}>
                    {visibleProducts.length === 0 ? (
                      <p className="py-8 text-center text-sm text-stone">
                        {products.length === 0 ? "No products yet." : "No products match."}
                      </p>
                    ) : (
                      visibleProducts.map((p) => (
                        <label
                          key={p.handle}
                          className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-[#F5F5F4]"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(p.handle)}
                            onChange={() => toggleProduct(p.handle)}
                            className="h-4 w-4 shrink-0 accent-ink"
                          />
                          <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink">
                            {p.title}
                          </span>
                          <span className="shrink-0 text-[0.6875rem] text-[#A3A3A3]">{p.fit}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions. Delete sits apart from the pair on the right so it is
              never the button next to Save. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5E5] bg-[#FAFAF9] px-6 py-4">
            {editing && !isAll ? (
              <button
                type="button"
                onClick={() => {
                  const c = collections.find((x) => x.handle === editingHandle);
                  if (c) setPendingDelete(c);
                }}
                className="text-[0.8125rem] text-[#DC2626] underline-offset-4 transition-colors hover:underline"
              >
                Delete collection
              </button>
            ) : (
              <span />
            )}

            {/* Wraps, and each button can shrink: at 360px the pair measured
                393px inside a 317px card, and the card clips its overflow — so
                "Create collection" was cut off and unclickable. */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Button variant="outline" size="md" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
              <Button size="md" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create collection"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Delete this collection?"
        description="The products in it are not deleted — they simply stop appearing under this collection."
        detail={
          pendingDelete && (
            <div className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                {pendingDelete.title}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                /{pendingDelete.handle} · {countLabel(pendingDelete.productCount)}
              </span>
            </div>
          )
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete.handle)}
      />
    </div>
  );
}
