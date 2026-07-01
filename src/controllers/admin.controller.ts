import type { Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { ApiError } from "../middleware/errors.js";
import { uploadProductImage } from "../lib/storage.js";
import { adminProductSchema } from "../validators/schemas.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Replaces a product's images with the provided list. */
async function setImages(
  productId: string,
  images: { src: string; alt?: string }[],
): Promise<void> {
  await supabaseAdmin.from("product_images").delete().eq("product_id", productId);
  if (images.length) {
    const { error } = await supabaseAdmin.from("product_images").insert(
      images.map((img, i) => ({
        product_id: productId,
        src: img.src,
        alt: img.alt ?? "",
        position: i,
      })),
    );
    if (error) throw new ApiError(500, error.message);
  }
}

/** POST /api/admin/upload — uploads an image to Supabase Storage, returns its URL. */
export async function uploadImage(req: Request, res: Response) {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) throw new ApiError(400, "No file uploaded (field name must be 'file').");

  const seed = Date.now();
  const result = await uploadProductImage(file.buffer, file.originalname, file.mimetype, seed);
  res.status(201).json({ ok: true, data: result });
}

/** POST /api/admin/products — creates a product. */
export async function createProduct(req: Request, res: Response) {
  const input = adminProductSchema.parse(req.body);
  const handle = input.handle?.trim() || slugify(input.title);
  if (!handle) throw new ApiError(400, "Could not derive a handle from the name.");

  const { error: pErr } = await supabaseAdmin.from("products").insert({
    id: handle,
    handle,
    title: input.title,
    tagline: input.tagline,
    description: input.description,
    color: input.color,
    fit: input.fit,
    price: input.price,
    currency: input.currency,
    sizes: input.sizes,
    details: input.details,
    stock: 99,
    rating: 5,
    review_count: 0,
    badge: input.badge ?? null,
  });
  if (pErr) {
    if (pErr.code === "23505") throw new ApiError(409, "A product with this handle already exists.");
    throw new ApiError(500, pErr.message);
  }

  await setImages(handle, input.images);
  res.status(201).json({ ok: true, message: "Product created.", data: { handle } });
}

/** PUT /api/admin/products/:handle — updates a product. */
export async function updateProduct(req: Request, res: Response) {
  const { handle } = req.params;
  const input = adminProductSchema.parse(req.body);

  const { data: existing, error: gErr } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (gErr) throw new ApiError(500, gErr.message);
  if (!existing) throw new ApiError(404, `Product not found: ${handle}`);

  const { error: uErr } = await supabaseAdmin
    .from("products")
    .update({
      title: input.title,
      tagline: input.tagline,
      description: input.description,
      color: input.color,
      fit: input.fit,
      price: input.price,
      currency: input.currency,
      sizes: input.sizes,
      details: input.details,
      badge: input.badge ?? null,
    })
    .eq("handle", handle);
  if (uErr) throw new ApiError(500, uErr.message);

  await setImages(existing.id as string, input.images);
  res.json({ ok: true, message: "Product updated.", data: { handle } });
}

/** DELETE /api/admin/products/:handle — deletes a product (images cascade). */
export async function deleteProduct(req: Request, res: Response) {
  const { handle } = req.params;
  const { error } = await supabaseAdmin.from("products").delete().eq("handle", handle);
  if (error) throw new ApiError(500, error.message);
  res.json({ ok: true, message: "Product deleted." });
}

/* ─────────────────────────── Admin: orders ──────────────────────────────── */

function paymentMethodOf(status: string): string {
  return status === "cod_pending" ? "Cash on Delivery" : "Online";
}

/** GET /api/admin/orders — every order with items + customer + payment method. */
export async function listAllOrders(_req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);

  const orders = (data ?? []).map((o) => ({
    id: o.id,
    customerName: (o.full_name as string) || null,
    email: o.email,
    phone: o.phone,
    subtotal: o.subtotal,
    currency: o.currency,
    status: o.status,
    paymentMethod: paymentMethodOf(o.status as string),
    createdAt: o.created_at,
    items: o.items ?? [],
  }));

  res.json({ ok: true, count: orders.length, data: orders });
}

/* ────────────────────────── Admin: customers ────────────────────────────── */

interface UserRow {
  phone: string;
  email: string | null;
  created_at: string;
}

/** GET /api/admin/customers — signed-up customers + their order count & spend. */
export async function listCustomers(_req: Request, res: Response) {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, error.message);

  // Aggregate orders per customer phone.
  const { data: orders } = await supabaseAdmin.from("orders").select("phone, subtotal");
  const stats = new Map<string, { count: number; spent: number }>();
  for (const o of orders ?? []) {
    const key = o.phone as string | null;
    if (!key) continue;
    const cur = stats.get(key) ?? { count: 0, spent: 0 };
    cur.count += 1;
    cur.spent += (o.subtotal as number) ?? 0;
    stats.set(key, cur);
  }

  const customers = ((users ?? []) as UserRow[]).map((u) => ({
    phone: u.phone,
    email: u.email,
    joinedAt: u.created_at,
    orderCount: stats.get(u.phone)?.count ?? 0,
    totalSpent: stats.get(u.phone)?.spent ?? 0,
  }));

  res.json({ ok: true, count: customers.length, data: customers });
}
