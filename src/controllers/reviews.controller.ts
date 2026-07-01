import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { uploadProductImage } from "../lib/storage.js";
import { reviewSchema } from "../validators/schemas.js";

interface ReviewRow {
  id: string;
  product_handle: string;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  created_at: string;
}

function mapReview(r: ReviewRow) {
  return {
    id: r.id,
    author: r.author,
    rating: r.rating,
    title: r.title ?? "",
    body: r.body,
    images: r.images ?? [],
    createdAt: r.created_at,
  };
}

/** Recomputes and stores a product's average rating + review count. */
async function refreshProductAggregate(handle: string) {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("rating")
    .eq("product_handle", handle);
  const ratings = (data ?? []).map((r) => r.rating as number);
  const count = ratings.length;
  const average = count ? ratings.reduce((s, n) => s + n, 0) / count : 0;
  await supabaseAdmin
    .from("products")
    .update({ rating: Math.round(average * 10) / 10, review_count: count })
    .eq("handle", handle);
  return { count, average };
}

/** GET /api/products/:handle/reviews — list reviews + summary. */
export async function listReviews(req: Request, res: Response) {
  const { handle } = req.params;
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("product_handle", handle)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);

  const reviews = (data ?? []) as ReviewRow[];
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  // Star breakdown 5→1.
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
  // All photos across reviews (for the "customer photos" strip).
  const photos = reviews.flatMap((r) => r.images ?? []);

  res.json({
    ok: true,
    data: {
      summary: {
        average: Math.round(average * 10) / 10,
        count,
        breakdown,
        photos,
      },
      reviews: reviews.map(mapReview),
    },
  });
}

/** POST /api/products/:handle/reviews — create a review. */
export async function createReview(req: Request, res: Response) {
  const { handle } = req.params;
  const input = reviewSchema.parse(req.body);

  const { data: product, error: pErr } = await supabaseAdmin
    .from("products")
    .select("handle")
    .eq("handle", handle)
    .maybeSingle();
  if (pErr) throw new ApiError(500, pErr.message);
  if (!product) throw new ApiError(404, `Product not found: ${handle}`);

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      product_handle: handle,
      author: input.author,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      images: input.images,
    })
    .select()
    .single();
  if (error) throw new ApiError(500, error.message);

  await refreshProductAggregate(handle);
  res.status(201).json({ ok: true, message: "Thanks for your review!", data: mapReview(data) });
}

/** POST /api/reviews/upload — uploads a review photo, returns its URL. */
export async function uploadReviewImage(req: Request, res: Response) {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw new ApiError(400, "No file uploaded (field name must be 'file').");
  const result = await uploadProductImage(
    file.buffer,
    file.originalname,
    file.mimetype,
    Date.now(),
    "reviews",
  );
  res.status(201).json({ ok: true, data: result });
}
