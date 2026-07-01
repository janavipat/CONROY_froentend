"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Review, ReviewSummary } from "@/types";
import { fetchReviews } from "@/services/reviews";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";
import { ReviewForm } from "./ReviewForm";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

/** Compact green rating badge (Flipkart-style). */
function RatingBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs font-semibold text-white">
      {value} <StarIcon className="h-3 w-3" />
    </span>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={cn("h-4 w-4", value >= n ? "text-amber-500" : "text-line")} />
      ))}
    </span>
  );
}

export function ProductReviews({ handle }: { handle: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetchReviews(handle);
    setSummary(res.summary);
    setReviews(res.reviews);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    fetchReviews(handle).then((res) => {
      if (!active) return;
      setSummary(res.summary);
      setReviews(res.reviews);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [handle]);

  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const maxBar = Math.max(1, ...Object.values(summary?.breakdown ?? {}));

  return (
    <section id="reviews" className="border-t border-line bg-white py-14 lg:py-20">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Ratings &amp; Reviews</h2>
          <Button onClick={() => setShowForm((s) => !s)} variant={showForm ? "ghost" : "outline"} size="md">
            {showForm ? "Close" : "Rate product"}
          </Button>
        </div>

        {showForm && (
          <div className="mt-6">
            <ReviewForm
              handle={handle}
              onCancel={() => setShowForm(false)}
              onSubmitted={() => {
                setShowForm(false);
                setLoading(true);
                load();
              }}
            />
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 grid gap-8 border-b border-line pb-8 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl text-ink">{average.toFixed(1)}</span>
              <StarIcon className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm text-stone">
              {count} {count === 1 ? "rating" : "ratings"}
            </p>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = summary?.breakdown?.[String(star)] ?? 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="flex w-8 items-center gap-1 text-ink-soft">
                    {star} <StarIcon className="h-3 w-3 text-stone" />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        star >= 4 ? "bg-green-600" : star === 3 ? "bg-amber-500" : "bg-accent",
                      )}
                      style={{ width: `${(c / maxBar) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-xs text-stone">{c}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer photos */}
        {summary && summary.photos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-ink">Customer photos ({summary.photos.length})</h3>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {summary.photos.map((src, i) => (
                <span key={`${src}-${i}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-mist">
                  <Image src={src} alt="Customer photo" fill sizes="80px" className="object-cover" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review list */}
        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-stone">
              No reviews yet. Be the first to review this product.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex items-center gap-3">
                    <RatingBadge value={r.rating} />
                    {r.title && <span className="font-medium text-ink">{r.title}</span>}
                  </div>
                  {r.body && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.body}</p>}

                  {r.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.images.map((src, i) => (
                        <span key={`${src}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-md bg-mist">
                          <Image src={src} alt="Review photo" fill sizes="64px" className="object-cover" />
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs text-stone">
                    <Stars value={r.rating} className="hidden sm:inline-flex" />
                    <span className="font-medium text-ink-soft">{r.author}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
