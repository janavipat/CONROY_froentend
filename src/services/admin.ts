import { api } from "./api";
import type { Product } from "@/types";

export interface ProductImageInput {
  src: string;
  alt?: string;
}

export interface AdminProductPayload {
  title: string;
  handle?: string;
  tagline: string;
  description: string;
  color: string;
  fit: string;
  price: number;
  currency: string;
  sizes: string[];
  details: string[];
  badge?: string | null;
  images: ProductImageInput[];
}

interface ApiList<T> {
  ok: boolean;
  data: T;
}

/** Lists all products (admin view). */
export async function adminListProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiList<Product[]>>("/products");
  return data.data ?? [];
}

/** Fetches a single product for editing. */
export async function adminGetProduct(handle: string): Promise<Product> {
  const { data } = await api.get<ApiList<Product>>(`/products/${handle}`);
  return data.data;
}

export async function adminCreateProduct(payload: AdminProductPayload) {
  const { data } = await api.post("/admin/products", payload);
  return data as { ok: boolean; message: string; data: { handle: string } };
}

export async function adminUpdateProduct(handle: string, payload: AdminProductPayload) {
  const { data } = await api.put(`/admin/products/${handle}`, payload);
  return data as { ok: boolean; message: string };
}

export async function adminDeleteProduct(handle: string) {
  const { data } = await api.delete(`/admin/products/${handle}`);
  return data as { ok: boolean; message: string };
}

export interface AdminOrderItem {
  product_handle: string;
  title: string;
  size: string;
  fit: string;
  price: number;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  customerName: string | null;
  email: string;
  phone: string | null;
  subtotal: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminCustomer {
  phone: string;
  email: string | null;
  joinedAt: string;
  orderCount: number;
  totalSpent: number;
}

export async function adminListOrders(): Promise<AdminOrder[]> {
  const { data } = await api.get<ApiList<AdminOrder[]>>("/admin/orders");
  return data.data ?? [];
}

export async function adminListCustomers(): Promise<AdminCustomer[]> {
  const { data } = await api.get<ApiList<AdminCustomer[]>>("/admin/customers");
  return data.data ?? [];
}

/** Uploads an image file to Supabase Storage via the backend; returns its URL. */
export async function adminUploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiList<{ url: string; path: string }>>(
    "/admin/upload",
    form,
    // Let the browser set the multipart boundary.
    { headers: { "Content-Type": undefined } },
  );
  return data.data.url;
}
