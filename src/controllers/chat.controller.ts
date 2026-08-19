import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { chatMessageSchema, chatStatusSchema } from "../validators/schemas.js";

/**
 * POST /api/chat — a visitor submits a message from the storefront chat widget.
 * Name/email are optional (anonymous visitors), so they're stored as null when
 * not supplied.
 */
export async function submitChatMessage(req: Request, res: Response) {
  const input = chatMessageSchema.parse(req.body);

  const { error } = await supabaseAdmin.from("chat_messages").insert({
    name: input.name || null,
    email: input.email || null,
    message: input.message,
    status: "new",
  });
  if (error) throw new ApiError(500, error.message);

  res.status(201).json({
    ok: true,
    message: "Thank you for contacting us. Our team will get back to you shortly.",
  });
}

/** GET /api/admin/chat — list chat messages for the admin inbox (newest first). */
export async function listChatMessages(_req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new ApiError(500, error.message);

  const messages = (data ?? []).map((m) => ({
    id: m.id as string,
    name: (m.name as string) || null,
    email: (m.email as string) || null,
    message: m.message as string,
    status: m.status as string,
    createdAt: m.created_at as string,
  }));

  res.json({ ok: true, count: messages.length, data: messages });
}

/** PATCH /api/admin/chat/:id — move a message through triage (new→read→…). */
export async function setChatMessageStatus(req: Request, res: Response) {
  const { status } = chatStatusSchema.parse(req.body);

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .update({ status })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, `Chat message not found: ${req.params.id}`);

  res.json({ ok: true, message: "Status updated." });
}

/** DELETE /api/admin/chat/:id — remove a chat message. */
export async function deleteChatMessage(req: Request, res: Response) {
  const { error } = await supabaseAdmin
    .from("chat_messages")
    .delete()
    .eq("id", req.params.id);
  if (error) throw new ApiError(500, error.message);
  res.json({ ok: true, message: "Message deleted." });
}
