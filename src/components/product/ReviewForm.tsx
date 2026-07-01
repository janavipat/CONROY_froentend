"use client";

import Image from "next/image";
import { useState } from "react";
import { submitReview, uploadReviewImage } from "@/services/reviews";
import { Button } from "@/components/ui/Button";
import { StarIcon, CloseIcon, PlusIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

export function ReviewForm({
  handle,
  onSubmitted,
  onCancel,
}: {
  handle: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const url = await uploadReviewImage(file);
        setImages((prev) => [...prev, url].slice(0, 6));
      }
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return setError("Please select a star rating.");
    if (!author.trim()) return setError("Please enter your name.");
    setError("");
    setSubmitting(true);
    const res = await submitReview(handle, {
      author: author.trim(),
      rating,
      title: title.trim(),
      body: body.trim(),
      images,
    });
    setSubmitting(false);
    if (res.ok) onSubmitted();
    else setError(res.message);
  }

  const fieldClass =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="rounded-media border border-line bg-paper p-5 sm:p-6">
      <h3 className="font-display text-lg text-ink">Rate this product</h3>

      {/* Star input */}
      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <StarIcon
              className={cn(
                "h-7 w-7 transition-colors",
                (hover || rating) >= n ? "text-amber-500" : "text-line",
              )}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-stone">{rating}/5</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className={fieldClass}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className={fieldClass}
        />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Share your experience with this product…"
        className={cn(fieldClass, "mt-3 resize-y")}
      />

      {/* Photos */}
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={src} className="group relative h-16 w-16 overflow-hidden rounded-md bg-mist">
            <Image src={src} alt="Review photo" fill sizes="64px" className="object-cover" />
            <button
              type="button"
              onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 6 && (
          <label
            className={cn(
              "grid h-16 w-16 cursor-pointer place-items-center rounded-md border border-dashed border-line text-stone transition-colors hover:border-ink hover:text-ink",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        )}
      </div>
      <p className="mt-1.5 text-xs text-stone">Add up to 6 photos.</p>

      {error && <p className="mt-3 text-xs text-accent">{error}</p>}

      <div className="mt-5 flex gap-3">
        <Button type="submit" size="md" disabled={submitting || uploading}>
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
