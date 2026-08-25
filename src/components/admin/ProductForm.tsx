"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetProductCollections,
  adminListCollections,
  adminUpdateProduct,
  adminUploadImage,
  type AdminCollection,
  type ProductImageInput,
} from "@/services/admin";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "./ui";
import { CloseIcon, PlusIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import {
  CATEGORY_FOR_TYPE,
  PRODUCT_TYPES,
  STANDARD_COLORS,
  categoriesFor,
  collectionsFor,
  fitsFor,
  sizesFor,
  suggestStandardColor,
} from "@/lib/catalog-taxonomy";

const COLOR_OPTIONS = ["Black", "Blue", "Grey", "Beige"];

const field = "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone";

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [fit, setFit] = useState(initial?.fit ?? "");
  const [productType, setProductType] = useState(initial?.productType ?? "Jeans");
  const [category, setCategory] = useState(initial?.category ?? "Denim");
  const [color, setColor] = useState(initial?.color ?? "");
  // Prefilled from the display colour only when the product predates the
  // field; an explicit saved value always wins.
  const [standardColor, setStandardColor] = useState(
    initial?.standardColor ?? suggestStandardColor(initial?.color ?? ""),
  );
  const [isNewIn, setIsNewIn] = useState(initial?.isNewIn ?? false);
  const [newInOrder, setNewInOrder] = useState(
    initial?.newInOrder != null ? String(initial.newInOrder) : "",
  );
  const [isBestSeller, setIsBestSeller] = useState(initial?.isBestSeller ?? false);
  const [bestSellerOrder, setBestSellerOrder] = useState(
    initial?.bestSellerOrder != null ? String(initial.bestSellerOrder) : "",
  );
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compareAtPrice != null ? String(initial.compareAtPrice) : "",
  );
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [stock, setStock] = useState(String(initial?.stock ?? "0"));
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [status, setStatus] = useState<"active" | "draft" | "archived">(initial?.status ?? "active");
  const [details, setDetails] = useState<string[]>(initial?.details?.length ? initial.details : [""]);
  const [weightG, setWeightG] = useState(initial?.weightG ? String(initial.weightG) : "");
  const [lengthCm, setLengthCm] = useState(initial?.lengthCm ? String(initial.lengthCm) : "");
  const [widthCm, setWidthCm] = useState(initial?.widthCm ? String(initial.widthCm) : "");
  const [heightCm, setHeightCm] = useState(initial?.heightCm ? String(initial.heightCm) : "");
  const [isShippable, setIsShippable] = useState(initial?.isShippable ?? true);
  const [images, setImages] = useState<ProductImageInput[]>(
    initial?.images.map((i) => ({ src: i.src, alt: i.alt })) ?? [],
  );

  // Collection membership. `null` until loaded so an unticked-everything save
  // is never sent before the product's real collections have arrived.
  const [allCollections, setAllCollections] = useState<AdminCollection[] | null>(null);
  const [collections, setCollections] = useState<string[] | null>(editing ? null : []);
  const [collectionsFailed, setCollectionsFailed] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Image management. `replacingIndex` drives the per-tile spinner so a replace
  // doesn't disable the whole Upload control; drag/over indices drive reorder.
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // "all" is derived server-side (every product is in it), so it isn't
        // something an admin picks.
        const cols = await adminListCollections();
        if (active) setAllCollections(cols.filter((c) => c.handle !== "all"));
      } catch {
        if (active) {
          setAllCollections([]);
          setCollectionsFailed(true);
        }
      }
      if (!initial) return;
      try {
        const mine = await adminGetProductCollections(initial.handle);
        if (active) setCollections(mine);
      } catch {
        // Deliberately leaves `collections` null so the save omits the field
        // and the product's existing membership survives — defaulting to an
        // empty list here would silently remove it from every collection.
        if (active) setCollectionsFailed(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [initial]);

  function toggleSize(s: string) {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function toggleCollection(handle: string) {
    setCollections((prev) =>
      prev === null
        ? prev
        : prev.includes(handle)
          ? prev.filter((h) => h !== handle)
          : [...prev, handle],
    );
  }

  // Category options follow Product type. A saved value outside that list is
  // appended rather than hidden — a <select> whose value isn't an option
  // renders blank and would silently rewrite the category on the next save.
  const categoryOptions = useMemo(() => {
    const opts = categoriesFor(productType);
    return category && !opts.includes(category) ? [...opts, category] : opts;
  }, [productType, category]);

  // Collections offered for this product type. Memberships outside the list
  // stay in `collections` state and are still sent on save, so filtering the
  // options can never quietly drop a product out of a collection.
  const collectionOptions = useMemo(
    () => (allCollections ? collectionsFor(productType, allCollections) : null),
    [productType, allCollections],
  );

  const visibleSelectedCount = collections
    ? collections.filter((h) => collectionOptions?.some((c) => c.handle === h)).length
    : 0;

  const sizeOptions = sizesFor(productType);
  // Sizes already saved on the product that aren't in the current type's list —
  // shown separately rather than dropped, so switching Product Type never
  // silently discards what an existing product was sold in.
  const offListSizes = useMemo(
    () => sizes.filter((s) => !sizeOptions.includes(s)),
    [sizes, sizeOptions],
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await adminUploadImage(file);
        setImages((prev) => [...prev, { src: url, alt: title || "Product image" }]);
      }
    } catch {
      setError("Image upload failed. Check the backend + Supabase Storage bucket.");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Swaps one image's file, leaving every other image untouched.
   *
   * Only this tile's `src` changes — its alt text, and the whole rest of the
   * list, are carried through — so replacing a photo never means re-uploading
   * the others. The old object stays in Supabase Storage; the product simply
   * stops pointing at it.
   */
  async function handleReplace(index: number, file: File | undefined) {
    if (!file) return;
    setError("");
    setReplacingIndex(index);
    try {
      const url = await adminUploadImage(file);
      setImages((prev) => prev.map((img, i) => (i === index ? { ...img, src: url } : img)));
    } catch {
      setError("Image upload failed. Check the backend + Supabase Storage bucket.");
    } finally {
      setReplacingIndex(null);
    }
  }

  /**
   * Moves an image within the list. Order IS the stored order: the backend
   * writes `position: i` from this array, and the storefront treats the first
   * image as the primary one.
   */
  function moveImage(from: number, to: number) {
    setImages((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  /**
   * Stops the mouse wheel from editing a number field.
   *
   * A focused <input type="number"> increments/decrements on wheel, so
   * scrolling this form — which runs well past a screen, with the price fields
   * in the middle — silently walked the value the admin had just typed: enter
   * 999, scroll down two notches to reach the button, save 997. Blurring on
   * wheel lets the page scroll and leaves the value alone.
   */
  function blurOnWheel(e: React.WheelEvent<HTMLInputElement>) {
    e.currentTarget.blur();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No field is required — a partial product saves, and the admin fills in
    // the rest later. Blanks become empty strings or 0 rather than blocking.
    const priceNum = Number(price);
    const compareTrimmed = compareAtPrice.trim();
    const compareNum = compareTrimmed && Number.isFinite(Number(compareTrimmed))
      ? Number(compareTrimmed)
      : null;

    setError("");
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      color: color.trim(),
      fit: fit.trim(),
      productType: productType.trim() || "Jeans",
      category: category.trim() || "Denim",
      standardColor: standardColor.trim() || null,
      isNewIn,
      newInOrder: newInOrder.trim() ? Math.max(0, Math.round(Number(newInOrder))) : null,
      isBestSeller,
      bestSellerOrder: bestSellerOrder.trim()
        ? Math.max(0, Math.round(Number(bestSellerOrder)))
        : null,
      price: Number.isFinite(priceNum) ? Math.max(0, Math.round(priceNum)) : 0,
      compareAtPrice: compareNum === null ? null : Math.max(0, Math.round(compareNum)),
      currency: initial?.currency ?? "INR",
      stock: Math.max(0, Math.round(Number(stock) || 0)),
      sku: sku.trim(),
      status,
      sizes,
      // Omitted while still loading — the backend then leaves membership alone
      // rather than reading an empty list as "remove from everything".
      ...(collections ? { collections } : {}),
      details: details.map((d) => d.trim()).filter(Boolean),
      badge: badge.trim() || null,
      images,
      weightG: weightG.trim() ? Math.round(Number(weightG)) : null,
      lengthCm: lengthCm.trim() ? Number(lengthCm) : null,
      widthCm: widthCm.trim() ? Number(widthCm) : null,
      heightCm: heightCm.trim() ? Number(heightCm) : null,
      isShippable,
    };

    try {
      if (editing && initial) {
        await adminUpdateProduct(initial.handle, payload);
      } else {
        await adminCreateProduct(payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not save the product.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    /* Was max-w-3xl, which left most of a desktop screen empty. The form now
       spans a normal admin container and pairs with a sticky summary column. */
    <form onSubmit={handleSubmit} className="mx-auto min-w-0 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-[#737373]">
            <Link href="/admin/products" className="hover:text-[#171717]">
              Products
            </Link>
            {editing && initial && (
              <>
                <span className="mx-1.5 text-[#D4D4D4]">/</span>
                <span className="text-[#171717]">{initial.title}</span>
              </>
            )}
            <span className="mx-1.5 text-[#D4D4D4]">/</span>
            <span className="text-[#171717]">{editing ? "Edit" : "New"}</span>
          </nav>
          <h1 className="mt-1 truncate text-[1.5rem] font-semibold tracking-[-0.02em] text-[#171717] sm:text-[1.75rem]">
            {editing ? initial?.title || "Edit product" : "New product"}
          </h1>
        </div>

        {/* Save and Cancel live in the sticky sidebar card only. A second pair
            here sat directly beside it and, unlike the sidebar, scrolled out of
            reach on a form this long. */}
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-5 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left: the form itself ─────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 [&>section]:mt-0">

      {/* Images */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Images</span>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.src}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              // preventDefault on dragover is what marks this a valid drop target.
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== i) setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveImage(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                "group relative h-28 w-24 shrink-0 cursor-grab overflow-hidden rounded-md bg-mist active:cursor-grabbing",
                dragIndex === i && "opacity-40",
                overIndex === i && dragIndex !== null && dragIndex !== i && "ring-2 ring-ink",
              )}
            >
              {/* draggable={false} so the browser drags the tile, not the <img>. */}
              <SafeImage
                src={img.src}
                alt={img.alt ?? ""}
                fill
                sizes="96px"
                draggable={false}
                className="object-cover"
              />

              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-ink/85 px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wide text-white">
                  Main
                </span>
              )}

              {replacingIndex === i && (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
                </span>
              )}

              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Delete image ${i + 1}`}
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>

              <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-ink/80 py-1 text-center text-[0.5625rem] uppercase tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label={`Replace image ${i + 1}`}
                  onChange={(e) => {
                    void handleReplace(i, e.target.files?.[0]);
                    // Reset so picking the same file again still fires change.
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          ))}

          <label
            className={cn(
              "grid h-28 w-24 cursor-pointer place-items-center rounded-md border border-dashed border-line text-center text-xs text-stone transition-colors hover:border-ink hover:text-ink",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <PlusIcon className="h-5 w-5" />
                Upload
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-stone">
          Drag to reorder — the first image is the main product image. Hover an image to
          replace or delete it. Images are stored in Supabase Storage; only the URL is saved
          to the database.
        </p>
      </section>

      {/* Core fields */}
      <section className="mt-6 grid gap-5 rounded-media border border-line bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="product-title">
            Name
          </label>
          <input id="product-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Black Relax Fit" className={field} />
        </div>

        <div>
          <label className={label}>Product type</label>
          <select
            value={productType}
            onChange={(e) => {
              const next = e.target.value;
              setProductType(next);
              // Keep category in step; the admin can still override it.
              const cat = CATEGORY_FOR_TYPE[next];
              if (cat) setCategory(cat);
            }}
            className={field}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Collections — options follow Product type, so jeans collections and
            T-shirt collections are never offered together. Membership itself
            stays an explicit choice; nothing is auto-assigned. */}
        <div className="sm:col-span-2">
          <label className={label}>
            Collections{visibleSelectedCount ? ` (${visibleSelectedCount} selected)` : ""}
          </label>
          {collectionsFailed ? (
            <p className="text-sm text-stone">
              Could not load collections — this product&rsquo;s collections are left unchanged
              when you save.
            </p>
          ) : collectionOptions === null || collections === null ? (
            <p className="text-sm text-stone">Loading collections…</p>
          ) : collectionOptions.length === 0 ? (
            <p className="text-sm text-stone">
              No {productType} collections yet — create one under Collections first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {collectionOptions.map((c) => (
                <button
                  key={c.handle}
                  type="button"
                  onClick={() => toggleCollection(c.handle)}
                  className={cn(
                    "h-10 rounded-md border px-3 text-sm transition-colors",
                    collections.includes(c.handle)
                      ? "border-ink bg-ink text-white"
                      : "border-line text-ink hover:border-ink",
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Renamed from "Type" — it was being confused with Product type. */}
          <label className={label} htmlFor="product-fit">
            Fit
          </label>
          <input id="product-fit" value={fit} onChange={(e) => setFit(e.target.value)} placeholder="Slim Fit" className={field} list="fit-options" />
          {/* A datalist, not a select: two products still carry the legacy
              "Vintage Collection" value and a select would silently drop it. */}
          <datalist id="fit-options">
            {fitsFor(category).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={label}>Colour</label>
          <input
            value={color}
            onChange={(e) => {
              const next = e.target.value;
              setColor(next);
              // Suggest a bucket while it's still empty; never overwrite a
              // choice the admin has already made.
              if (!standardColor) setStandardColor(suggestStandardColor(next));
            }}
            placeholder="Jet Black"
            className={field}
            list="color-options"
          />
          <datalist id="color-options">
            {COLOR_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-stone">Shown to customers, e.g. &ldquo;Jet Black&rdquo;.</p>
        </div>

        <div>
          <label className={label}>Standard colour</label>
          <select
            value={standardColor}
            onChange={(e) => setStandardColor(e.target.value)}
            className={field}
          >
            <option value="">— not set —</option>
            {STANDARD_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone">Used for filtering only.</p>
        </div>

        <div>
          <label className={label} htmlFor="product-price">
            Selling price (₹)
          </label>
          <input id="product-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} onWheel={blurOnWheel} placeholder="1799" className={field} />
          <p className="mt-1 text-xs text-stone">What the customer pays.</p>
        </div>

        <div>
          <label className={label} htmlFor="product-compare-price">Original price (₹)</label>
          <input
            id="product-compare-price"
            type="number"
            min={0}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            onWheel={blurOnWheel}
            placeholder="2499"
            className={field}
          />
          <p className="mt-1 text-xs text-stone">
            MRP, shown struck through. Leave blank for no was-price.
          </p>
        </div>

        <div>
          <label className={label}>Badge (optional)</label>
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Limited time" className={field} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Relaxed comfort in a deep, washed black." className={field} />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="A relaxed-fit denim cut from soft, breathable fabric…"
            className="w-full resize-y rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
          />
        </div>
      </section>

      {/* Sizes — the options follow Product type: waist inches for Jeans,
          letter sizes for T-Shirts. */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Sizes</span>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSize(s)}
              className={cn(
                "h-10 min-w-11 rounded-md border px-3 text-sm transition-colors",
                sizes.includes(s) ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {offListSizes.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs text-stone">
              Saved on this product but not part of the {productType} size set — still selected.
              Untick to remove.
            </p>
            <div className="flex flex-wrap gap-2">
              {offListSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className="h-10 min-w-11 rounded-md border border-ink bg-ink px-3 text-sm text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Inventory. Status used to sit here as a third column; it now lives in
          the sidebar so the product's state reads at a glance. Same state,
          same value on save. */}
      <section className="mt-6 grid gap-5 rounded-media border border-line bg-white p-5 sm:grid-cols-2">
        <div>
          <label className={label}>Stock</label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onWheel={blurOnWheel}
            placeholder="0"
            className={field}
          />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="CNRY-BLK-01"
            className={field}
          />
        </div>
      </section>

      {/* Merchandising — which homepage rails this product appears in. Both
          are deliberately manual: New In is a buying decision, not an age, and
          there isn't enough sales volume yet to rank Best Sellers. */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Merchandising</span>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isNewIn}
                onChange={(e) => setIsNewIn(e.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              Show in New In
            </label>
            <input
              type="number"
              min={0}
              value={newInOrder}
              onChange={(e) => setNewInOrder(e.target.value)}
              onWheel={blurOnWheel}
              disabled={!isNewIn}
              placeholder="Order, e.g. 1"
              className={cn(field, "mt-2", !isNewIn && "opacity-50")}
            />
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              Show in Best Sellers
            </label>
            <input
              type="number"
              min={0}
              value={bestSellerOrder}
              onChange={(e) => setBestSellerOrder(e.target.value)}
              onWheel={blurOnWheel}
              disabled={!isBestSeller}
              placeholder="Order, e.g. 1"
              className={cn(field, "mt-2", !isBestSeller && "opacity-50")}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-stone">
          Lower order numbers appear first. Leave blank to sort last.
        </p>
      </section>

      {/* Shipping */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className={label}>Shipping</span>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isShippable}
              onChange={(e) => setIsShippable(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Physical product (ships via courier)
          </label>
        </div>
        {isShippable && (
          <div className="grid gap-5 sm:grid-cols-4">
            <div>
              <label className={label}>Weight (g)</label>
              <input
                type="number"
                min={0}
                value={weightG}
                onChange={(e) => setWeightG(e.target.value)}
                onWheel={blurOnWheel}
                placeholder="500"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Length (cm)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                onWheel={blurOnWheel}
                placeholder="30"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Width (cm)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                onWheel={blurOnWheel}
                placeholder="24"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Height (cm)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                onWheel={blurOnWheel}
                placeholder="4"
                className={field}
              />
            </div>
          </div>
        )}
      </section>

      {/* Details / bullet points */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Product details</span>
        <div className="space-y-2">
          {details.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={d}
                onChange={(e) =>
                  setDetails((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                }
                placeholder="e.g. Mid-rise waist with button and zip fly"
                className={field}
              />
              <button
                type="button"
                onClick={() => setDetails((prev) => prev.filter((_, idx) => idx !== i))}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line text-stone hover:border-ink hover:text-ink"
                aria-label="Remove detail"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDetails((prev) => [...prev, ""])}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink hover:underline"
        >
          <PlusIcon className="h-4 w-4" /> Add detail
        </button>
      </section>

      {/* Repeated at the foot of the form: the banner at the top is far
          off-screen from here, which made a rejected submit look like a dead
          button with no request sent. */}
          {error && (
            <p className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
              {error}
            </p>
          )}
        </div>

        {/* ── Right: sticky summary ─────────────────────────────────────── */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          {/* Save */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <Button
              type="submit"
              size="md"
              className="w-full"
              disabled={submitting || uploading}
            >
              {submitting ? "Saving…" : editing ? "Save changes" : "Create product"}
            </Button>
            <Button href="/admin/products" variant="outline" size="md" className="mt-2 w-full">
              Cancel
            </Button>
          </div>

          {/* Status — the same state the form saves; moved out of Inventory so
              it reads at a glance without scrolling. */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
              Product status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  status === "active"
                    ? "bg-[#16803C]"
                    : status === "draft"
                      ? "bg-[#D97706]"
                      : "bg-[#A3A3A3]",
                )}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "draft" | "archived")}
                className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-2 text-sm capitalize text-ink focus:border-ink focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Summary — reflects what's in the form right now, not what was saved. */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
              Summary
            </p>
            <div className="mt-3 flex gap-3">
              <span className="relative grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-[#E5E5E5] bg-[#FAFAF9] text-[0.625rem] text-[#A3A3A3]">
                {images[0]?.src ? (
                  <SafeImage src={images[0].src} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  "No image"
                )}
              </span>
              <div className="min-w-0">
                <p className="break-words text-[0.8125rem] font-medium text-[#171717]">
                  {title || "Untitled product"}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-[0.9375rem] font-semibold tabular-nums text-[#171717]">
                    {price ? formatCurrency(Number(price) || 0) : "—"}
                  </span>
                  {compareAtPrice && Number(compareAtPrice) > Number(price) && (
                    <s className="text-[0.75rem] text-[#A3A3A3]">
                      {formatCurrency(Number(compareAtPrice))}
                    </s>
                  )}
                </p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-[#F0F0EE] pt-3 text-[0.75rem]">
              {[
                ["Type", productType],
                ["Category", category],
                ["Fit", fit || "—"],
                ["Colour", color || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-[#737373]">{k}</dt>
                  <dd className="min-w-0 truncate text-[#171717]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Organization */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#737373]">
              Organization
            </p>
            {collections === null ? (
              <p className="mt-2 text-[0.75rem] text-[#A3A3A3]">Loading…</p>
            ) : collections.length === 0 ? (
              <p className="mt-2 text-[0.75rem] text-[#A3A3A3]">No collection selected</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {collections.map((h) => {
                  const c = allCollections?.find((x) => x.handle === h);
                  return (
                    <li
                      key={h}
                      className="rounded-md bg-[#F5F5F4] px-2 py-1 text-[0.6875rem] text-[#525252]"
                    >
                      {c?.title ?? h}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Danger zone — edit only; creating a product has nothing to delete. */}
          {editing && initial && (
            <div className="rounded-xl border border-[#DC2626]/25 bg-white p-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#DC2626]">
                Danger zone
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[#737373]">
                Deleting removes this product from the storefront. This can&apos;t be undone.
              </p>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(true)}
                className="mt-3 w-full rounded-lg border border-[#DC2626]/30 px-3 py-2 text-[0.8125rem] font-medium text-[#DC2626] transition-colors hover:bg-[#DC2626]/5 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete product"}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Confirms the Danger zone delete. Kept inside the form only for
          placement — it is fixed-position, and every button in it is
          type="button", so it can never submit. */}
      {editing && initial && (
        <ConfirmDialog
          open={confirmDelete}
          busy={deleting}
          title="Delete this product?"
          description="It will be removed from the storefront immediately. This can’t be undone."
          detail={
            <div className="flex items-center gap-3">
              <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#EFEFED]">
                {images[0]?.src && (
                  <SafeImage src={images[0].src} alt="" fill sizes="40px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                  {initial.title}
                </span>
                <span className="block truncate text-[0.75rem] text-[#737373]">{initial.handle}</span>
              </span>
            </div>
          }
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await adminDeleteProduct(initial.handle);
              router.push("/admin/products");
              router.refresh();
            } catch {
              setConfirmDelete(false);
              setError("Could not delete this product. Please retry.");
              setDeleting(false);
            }
          }}
        />
      )}
    </form>
  );
}
