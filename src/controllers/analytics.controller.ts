import type { Request, Response } from "express";
import { z } from "zod";
import { recordPing, snapshot } from "../lib/liveVisitors.js";

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
