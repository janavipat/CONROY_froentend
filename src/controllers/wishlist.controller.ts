import type { Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";

const toggleSchema = z.object({
  productHandle: z.string().min(1).max(160),
  userKey: z.string().min(1).max(120),
});

/**
 * POST /api/wishlist/toggle — likes or unlikes a product for a user.
 * userKey is the signed-in phone or an anonymous browser id.
 */
export async function toggleLike(req: Request, res: Response) {
  const { productHandle, userKey } = toggleSchema.parse(req.body);

  const { data: existing, error: sErr } = await supabaseAdmin
    .from("product_likes")
    .select("id")
    .eq("product_handle", productHandle)
    .eq("user_key", userKey)
    .maybeSingle();
  if (sErr) throw new ApiError(500, sErr.message);

  let liked: boolean;
  if (existing) {
    await supabaseAdmin.from("product_likes").delete().eq("id", existing.id);
    liked = false;
  } else {
    const { error } = await supabaseAdmin
      .from("product_likes")
      .insert({ product_handle: productHandle, user_key: userKey });
    if (error && error.code !== "23505") throw new ApiError(500, error.message);
    liked = true;
  }

  const { count } = await supabaseAdmin
    .from("product_likes")
    .select("*", { count: "exact", head: true })
    .eq("product_handle", productHandle);

  res.json({ ok: true, liked, count: count ?? 0 });
}

/** GET /api/wishlist?userKey=… — the product handles a user has liked. */
export async function listLikes(req: Request, res: Response) {
  const userKey = String(req.query.userKey ?? "").trim();
  if (!userKey) return res.json({ ok: true, data: [] });

  const { data, error } = await supabaseAdmin
    .from("product_likes")
    .select("product_handle")
    .eq("user_key", userKey);
  if (error) throw new ApiError(500, error.message);

  res.json({ ok: true, data: (data ?? []).map((r) => r.product_handle) });
}
