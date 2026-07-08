import type { Request, Response } from "express";
import { z } from "zod";
import { recordPing, snapshot } from "../lib/liveVisitors.js";
import { supabaseAdmin } from "../lib/supabase.js";

const pingSchema = z.object({
  sessionId: z.string().min(1).max(120),
  path: z.string().max(300).optional(),
  tz: z.string().max(100).optional(),
  locale: z.string().max(35).optional(),
});

/** POST /api/track — public heartbeat from storefront visitors. */
export async function trackVisit(req: Request, res: Response) {
  const ping = pingSchema.parse(req.body);
  recordPing(ping);
  res.json({ ok: true });
}

/** GET /api/admin/live — live-visitor snapshot for the admin dashboard. */
export async function getLiveVisitors(_req: Request, res: Response) {
  res.json({ ok: true, data: snapshot() });
}

/* ─────────────────────── Persisted analytics events ─────────────────────── */

const pageViewSchema = z.object({
  sessionId: z.string().min(1).max(120),
  path: z.string().min(1).max(300),
  durationMs: z.coerce.number().int().nonnegative().max(86_400_000).default(0),
});

const cartAddSchema = z.object({
  sessionId: z.string().min(1).max(120),
  productHandle: z.string().min(1).max(160),
});

/** POST /api/analytics/pageview — records a page view + time-on-page. */
export async function recordPageView(req: Request, res: Response) {
  const input = pageViewSchema.parse(req.body);
  // Best-effort — analytics must never break the storefront (or fail loudly).
  await supabaseAdmin
    .from("page_views")
    .insert({ session_id: input.sessionId, path: input.path, duration_ms: input.durationMs })
    .then(({ error }) => error && console.warn("page_view not stored (run analytics.sql):", error.message));
  res.json({ ok: true });
}

/** POST /api/analytics/cart-add — records an add-to-cart for a product. */
export async function recordCartAdd(req: Request, res: Response) {
  const input = cartAddSchema.parse(req.body);
  await supabaseAdmin
    .from("cart_adds")
    .insert({ session_id: input.sessionId, product_handle: input.productHandle })
    .then(({ error }) => error && console.warn("cart_add not stored (run analytics.sql):", error.message));
  res.json({ ok: true });
}

/* ────────────────────────── Admin analytics ─────────────────────────────── */

/** GET /api/admin/analytics — aggregated storefront analytics. */
export async function getAnalytics(_req: Request, res: Response) {
  // Product titles for friendly labels.
  const { data: products } = await supabaseAdmin.from("products").select("handle, title");
  const titleOf = new Map((products ?? []).map((p) => [p.handle as string, p.title as string]));

  // ── Top pages: views, avg time-on-page, unique sessions ──
  const { data: views } = await supabaseAdmin
    .from("page_views")
    .select("path, duration_ms, session_id")
    .order("created_at", { ascending: false })
    .limit(5000);
  const pageAgg = new Map<string, { views: number; totalMs: number; sessions: Set<string> }>();
  for (const v of views ?? []) {
    const path = v.path as string;
    const cur = pageAgg.get(path) ?? { views: 0, totalMs: 0, sessions: new Set<string>() };
    cur.views += 1;
    cur.totalMs += (v.duration_ms as number) ?? 0;
    cur.sessions.add(v.session_id as string);
    pageAgg.set(path, cur);
  }
  const topPages = [...pageAgg.entries()]
    .map(([path, a]) => ({
      path,
      views: a.views,
      uniqueVisitors: a.sessions.size,
      avgSeconds: a.views ? Math.round(a.totalMs / a.views / 1000) : 0,
    }))
    .sort((x, y) => y.views - x.views)
    .slice(0, 15);

  // ── Added to cart but not bought ──
  const { data: adds } = await supabaseAdmin.from("cart_adds").select("product_handle");
  const addCount = new Map<string, number>();
  for (const a of adds ?? []) {
    const h = a.product_handle as string;
    addCount.set(h, (addCount.get(h) ?? 0) + 1);
  }
  const { data: purchased } = await supabaseAdmin.from("order_items").select("product_handle");
  const buyCount = new Map<string, number>();
  for (const p of purchased ?? []) {
    const h = p.product_handle as string;
    buyCount.set(h, (buyCount.get(h) ?? 0) + 1);
  }
  const abandoned = [...addCount.entries()]
    .map(([handle, added]) => ({
      handle,
      title: titleOf.get(handle) ?? handle,
      added,
      purchased: buyCount.get(handle) ?? 0,
      notBought: Math.max(0, added - (buyCount.get(handle) ?? 0)),
    }))
    .filter((r) => r.notBought > 0)
    .sort((x, y) => y.notBought - x.notBought)
    .slice(0, 15);

  // ── Most liked products ──
  const { data: likes } = await supabaseAdmin.from("product_likes").select("product_handle");
  const likeCount = new Map<string, number>();
  for (const l of likes ?? []) {
    const h = l.product_handle as string;
    likeCount.set(h, (likeCount.get(h) ?? 0) + 1);
  }
  const mostLiked = [...likeCount.entries()]
    .map(([handle, count]) => ({ handle, title: titleOf.get(handle) ?? handle, likes: count }))
    .sort((x, y) => y.likes - x.likes)
    .slice(0, 15);

  res.json({
    ok: true,
    data: {
      totalPageViews: (views ?? []).length,
      topPages,
      abandoned,
      mostLiked,
    },
  });
}
