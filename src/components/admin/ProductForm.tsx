"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminUploadImage,
  type ProductImageInput,
} from "@/services/admin";
import { Button } from "@/components/ui/Button";
import { CloseIcon, PlusIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const SIZE_OPTIONS = ["28", "30", "32", "34", "36", "38", "40"];
const TYPE_OPTIONS = ["Straight fit", "Relax fit", "Slim fit"];
const COLOR_OPTIONS = ["Black", "Blue", "Grey", "Beige"];

const field = "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone";

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [fit, setFit] = useState(initial?.fit ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [details, setDetails] = useState<string[]>(initial?.details?.length ? initial.details : [""]);
  const [images, setImages] = useState<ProductImageInput[]>(
    initial?.images.map((i) => ({ src: i.src, alt: i.alt })) ?? [],
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleSize(s: string) {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Name is required.");
    if (!fit.trim()) return setError("Type is required.");
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Enter a valid price.");

    setError("");
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      color: color.trim(),
      fit: fit.trim(),
      price: Math.round(priceNum),
      currency: initial?.currency ?? "INR",
      sizes,
      details: details.map((d) => d.trim()).filter(Boolean),
      badge: badge.trim() || null,
      images,
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
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {editing ? "Edit product" : "New product"}
        </h1>
        <Button href="/admin/products" variant="ghost" size="sm">
          Cancel
        </Button>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Images */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Images</span>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.src} className="group relative h-28 w-24 overflow-hidden rounded-md bg-mist">
              <Image src={img.src} alt={img.alt ?? ""} fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
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
          Images are stored in Supabase Storage — only the URL is saved to the database.
        </p>
      </section>

      {/* Core fields */}
      <section className="mt-6 grid gap-5 rounded-media border border-line bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Black Relax Fit" className={field} />
        </div>

        <div>
          <label className={label}>Type</label>
          <input value={fit} onChange={(e) => setFit(e.target.value)} placeholder="Relax fit" className={field} list="type-options" />
          <datalist id="type-options">
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={label}>Colour</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" className={field} list="color-options" />
          <datalist id="color-options">
            {COLOR_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={label}>Price (₹)</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2000" className={field} />
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

      {/* Sizes */}
      <section className="mt-6 rounded-media border border-line bg-white p-5">
        <span className={label}>Sizes</span>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
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

      <div className="mt-6 flex gap-3">
        <Button type="submit" size="lg" disabled={submitting || uploading}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Create product"}
        </Button>
        <Button href="/admin/products" variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </form>
  );
}
