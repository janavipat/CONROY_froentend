"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/utils/cn";

const EMPTY: AdminCollectionPayload = { title: "", subtitle: "", description: "", image: "" };

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
    setError("");
  }

  async function editCollection(c: AdminCollection) {
    setEditingHandle(c.handle);
    setForm({ title: c.title, subtitle: c.subtitle, description: c.description, image: c.image });
    setError("");
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
    if (!window.confirm("Delete this collection? Products are not deleted.")) return;
    setCollections((cs) => cs.filter((c) => c.handle !== handle));
    try {
      await adminDeleteCollection(handle);
      toast("Collection deleted", "info");
    } catch {
      await refresh();
    }
  }

  const inputCls =
    "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none";
  const isAll = editingHandle === "all";

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Collections</h1>
      <p className="mt-1 text-sm text-stone">Group products into collections shoppers can browse.</p>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* List */}
        <div>
          {loading ? (
            <div className="grid place-items-center rounded-media border border-line bg-white py-16">
              <Loader label="Loading collections" />
            </div>
          ) : collections.length === 0 ? (
            <p className="rounded-media border border-line bg-white py-16 text-center text-stone">
              No collections yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {collections.map((c) => (
                <li
                  key={c.handle}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-media border bg-white p-4",
                    editingHandle === c.handle ? "border-ink" : "border-line",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                    <p className="text-xs text-stone">
                      /{c.handle} ·{" "}
                      {c.productCount === -1
                        ? "all products"
                        : `${c.productCount} product${c.productCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => editCollection(c)}
                      className="rounded-md border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink"
                    >
                      Edit
                    </button>
                    {c.handle !== "all" && (
                      <button
                        onClick={() => remove(c.handle)}
                        className="rounded-md border border-line px-3 py-1.5 text-xs text-accent transition-colors hover:border-accent"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Form */}
        <div className="h-fit rounded-media border border-line bg-white p-5 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">
              {editingHandle ? "Edit collection" : "New collection"}
            </h2>
            {editingHandle && (
              <button onClick={resetForm} className="text-xs text-stone hover:text-ink">
                + New
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title (e.g. Summer Edit)"
              className={inputCls}
            />
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Subtitle (optional)"
              className={inputCls}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="Image URL (optional)"
              className={inputCls}
            />
          </div>

          {/* Product assignment */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
              Products {isAll ? "(auto — all products)" : `(${selected.size} selected)`}
            </p>
            {isAll ? (
              <p className="rounded-md bg-mist px-3 py-2 text-xs text-stone">
                The “all” collection always contains every product.
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                {products.map((p) => (
                  <label
                    key={p.handle}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-mist"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.handle)}
                      onChange={() => toggleProduct(p.handle)}
                      className="h-4 w-4 accent-ink"
                    />
                    <span className="truncate text-ink">{p.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingHandle ? "Update collection" : "Create collection"}
            </Button>
            {editingHandle && (
              <button
                onClick={resetForm}
                className="rounded-md border border-line px-4 text-sm text-ink transition-colors hover:bg-mist"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
