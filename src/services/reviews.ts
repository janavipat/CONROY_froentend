import { api } from "./api";
import type { Review, ReviewSummary } from "@/types";

export interface ReviewsResponse {
  summary: ReviewSummary;
  reviews: Review[];
}

export interface SubmitReviewInput {
  author: string;
  rating: number;
  title?: string;
  body?: string;
  images: string[];
}

const EMPTY: ReviewsResponse = {
  summary: { average: 0, count: 0, breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }, photos: [] },
  reviews: [],
};

/** Fetches reviews + summary for a product. */
export async function fetchReviews(handle: string): Promise<ReviewsResponse> {
  try {
    const { data } = await api.get<{ ok: boolean; data: ReviewsResponse }>(
      `/products/${handle}/reviews`,
    );
    return data.data ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Submits a new review. */
export async function submitReview(
  handle: string,
  input: SubmitReviewInput,
): Promise<{ ok: boolean; message: string; review?: Review }> {
  try {
    const { data } = await api.post<{ ok: boolean; message: string; data: Review }>(
      `/products/${handle}/reviews`,
      input,
    );
    return { ok: data.ok, message: data.message, review: data.data };
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      "Could not submit your review. Please try again.";
    return { ok: false, message: msg };
  }
}

/** Uploads a review photo to Supabase Storage; returns its URL. */
export async function uploadReviewImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ ok: boolean; data: { url: string } }>(
    "/reviews/upload",
    form,
    { headers: { "Content-Type": undefined } },
  );
  return data.data.url;
}
