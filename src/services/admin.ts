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
  stock: number;
  sku: string;
  status: "active" | "draft" | "archived";
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
  shippingAddress: string | null;
  subtotal: number;
  discount: number;
  total: number;
  offerCode: string | null;
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

/** Validates an admin key against the backend. */
export async function adminVerifyKey(key: string): Promise<boolean> {
  try {
    await api.get("/admin/verify", { headers: { "x-admin-key": key } });
    return true;
  } catch {
    return false;
  }
}

export interface AdminStats {
  revenue: number;
  orderCount: number;
  paidCount: number;
  codCount: number;
  productCount: number;
  customerCount: number;
  returnCount: number;
  pendingReturns: number;
  activeOffer: string | null;
  recentOrders: {
    id: string;
    customerName: string | null;
    email: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export async function adminGetStats(): Promise<AdminStats> {
  const { data } = await api.get<ApiList<AdminStats>>("/admin/stats");
  return data.data;
}

/* ---- Live visitors ------------------------------------------------------ */

export interface LiveLocation {
  countryCode: string;
  country: string;
  flag: string;
  count: number;
  cities: string[];
}

export interface LivePage {
  path: string;
  count: number;
}

export interface LiveData {
  live: number;
  totalSessions: number;
  locations: LiveLocation[];
  pages: LivePage[];
}

export async function adminGetLive(): Promise<LiveData> {
  const { data } = await api.get<ApiList<LiveData>>("/admin/live");
  return data.data;
}

/* ---- Analytics ---------------------------------------------------------- */

export interface AnalyticsPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgSeconds: number;
}
export interface AnalyticsAbandoned {
  handle: string;
  title: string;
  added: number;
  purchased: number;
  notBought: number;
}
export interface AnalyticsLiked {
  handle: string;
  title: string;
  likes: number;
}
export interface AnalyticsSummary {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalReturned: number;
  netRevenue: number;
  avgOrderValue: number;
  totalVisitors: number;
  totalPageViews: number;
  totalTimeSec: number;
  avgSessionSec: number;
  bounceRate: number;
}

export interface RevenuePoint {
  date: string;
  value: number;
}
export interface OrdersPoint {
  date: string;
  count: number;
}
export interface StatusSlice {
  status: string;
  count: number;
}
export interface PageActivityRow {
  path: string;
  visits: number;
  uniqueVisitors: number;
  totalSec: number;
  lastVisit: string;
}

export interface CustomerOrder {
  id: string;
  date: string;
  products: { title: string; quantity: number }[];
  quantity: number;
  amount: number;
  paymentStatus: string;
  deliveryStatus: string;
}
export interface CustomerReturn {
  id: string;
  orderId: string;
  date: string;
  products: { title: string; quantity: number }[];
  reason: string;
  refundAmount: number;
  refundStatus: string;
}
export interface AnalyticsCustomer {
  key: string;
  name: string;
  email: string;
  phone: string | null;
  orders: number;
  items: number;
  grossValue: number;
  returnedAmount: number;
  netPurchase: number;
  avgOrder: number;
  lastOrder: string;
  status: string;
  orderList: CustomerOrder[];
  returnList: CustomerReturn[];
}

export interface AdminAnalytics {
  summary: AnalyticsSummary;
  revenueByDay: RevenuePoint[];
  ordersByDay: OrdersPoint[];
  statusBreakdown: StatusSlice[];
  pageActivity: PageActivityRow[];
  customers: AnalyticsCustomer[];
  topPages: AnalyticsPage[];
  abandoned: AnalyticsAbandoned[];
  mostLiked: AnalyticsLiked[];
}

export async function adminGetAnalytics(): Promise<AdminAnalytics> {
  const { data } = await api.get<ApiList<AdminAnalytics>>("/admin/analytics");
  return data.data;
}

export async function adminListOrders(): Promise<AdminOrder[]> {
  const { data } = await api.get<ApiList<AdminOrder[]>>("/admin/orders");
  return data.data ?? [];
}

export async function adminGetOrder(id: string): Promise<AdminOrder> {
  const { data } = await api.get<ApiList<AdminOrder>>(`/admin/orders/${id}`);
  return data.data;
}

export async function adminListCustomers(): Promise<AdminCustomer[]> {
  const { data } = await api.get<ApiList<AdminCustomer[]>>("/admin/customers");
  return data.data ?? [];
}

/* ---- Accounts (accounting overview) ------------------------------------- */

export interface AccountsSummary {
  buyerCount: number;
  orderCount: number;
  grossSales: number;
  totalDiscount: number;
  netRevenue: number;
  paidRevenue: number;
  codRevenue: number;
  paidCount: number;
  codCount: number;
  avgOrderValue: number;
  returnCount: number;
  refundedAmount: number;
  pendingRefunds: number;
  netMargin: number;
  currency: string;
}

export interface AccountsCustomer {
  name: string | null;
  email: string;
  phone: string | null;
  orderCount: number;
  grossSpent: number;
  discount: number;
  netSpent: number;
  refunded: number;
  netMargin: number;
  lastOrderAt: string;
}

export interface AccountsReturn {
  id: string;
  orderRef: string;
  name: string | null;
  email: string;
  phone: string | null;
  resolution: string;
  status: string;
  reason: string;
  value: number;
  createdAt: string;
}

export interface AdminAccounts {
  summary: AccountsSummary;
  customers: AccountsCustomer[];
  returns: AccountsReturn[];
}

export async function adminGetAccounts(): Promise<AdminAccounts> {
  const { data } = await api.get<ApiList<AdminAccounts>>("/admin/accounts");
  return data.data;
}

export interface AdminSubscriber {
  email: string;
  joinedAt: string;
}

export async function adminListSubscribers(): Promise<AdminSubscriber[]> {
  const { data } = await api.get<ApiList<AdminSubscriber[]>>("/admin/subscribers");
  return data.data ?? [];
}

export interface AdminContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handled?: boolean;
  created_at: string;
}

export async function adminListContacts(): Promise<AdminContact[]> {
  const { data } = await api.get<ApiList<AdminContact[]>>("/admin/contacts");
  return data.data ?? [];
}

export async function adminSetContactHandled(id: string, handled: boolean): Promise<void> {
  await api.patch(`/admin/contacts/${id}`, { handled });
}

export async function adminDeleteContact(id: string): Promise<void> {
  await api.delete(`/admin/contacts/${id}`);
}

export interface AdminReturnItem {
  product_handle: string;
  title: string;
  size: string;
  price: number;
  quantity: number;
}

export type AdminReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "refunded"
  | "replaced"
  | "completed";

export interface AdminReturn {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string | null;
  email: string;
  phone: string | null;
  reason: string;
  resolution: "refund" | "replacement";
  status: AdminReturnStatus;
  createdAt: string;
  items: AdminReturnItem[];
}

export async function adminListReturns(): Promise<AdminReturn[]> {
  const { data } = await api.get<ApiList<AdminReturn[]>>("/admin/returns");
  return data.data ?? [];
}

export async function adminUpdateReturnStatus(id: string, status: AdminReturnStatus) {
  const { data } = await api.patch(`/admin/returns/${id}`, { status });
  return data as { ok: boolean; message: string };
}

export async function adminDeleteReturn(id: string): Promise<void> {
  await api.delete(`/admin/returns/${id}`);
}

/** Uploads an image file to Supabase Storage via the backend; returns its URL. */
/* ---- Inventory ---------------------------------------------------------- */

export type ProductStatus = "active" | "draft" | "archived";

export interface InventoryItem {
  id: string;
  handle: string;
  title: string;
  sku: string;
  stock: number;
  status: ProductStatus;
  price: number;
  currency: string;
}

export async function adminListInventory(): Promise<InventoryItem[]> {
  const { data } = await api.get<ApiList<InventoryItem[]>>("/admin/inventory");
  return data.data ?? [];
}

export async function adminUpdateInventory(
  handle: string,
  patch: { stock?: number; sku?: string; status?: ProductStatus },
) {
  const { data } = await api.patch(`/admin/inventory/${handle}`, patch);
  return data as { ok: boolean; message: string };
}

/* ---- Collections -------------------------------------------------------- */

export interface AdminCollection {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  productCount: number;
}

export interface AdminCollectionPayload {
  title: string;
  handle?: string;
  subtitle: string;
  description: string;
  image: string;
}

export async function adminListCollections(): Promise<AdminCollection[]> {
  const { data } = await api.get<ApiList<AdminCollection[]>>("/admin/collections");
  return data.data ?? [];
}

export async function adminCreateCollection(payload: AdminCollectionPayload) {
  const { data } = await api.post("/admin/collections", payload);
  return data as { ok: boolean; message: string; data: { handle: string } };
}

export async function adminUpdateCollection(handle: string, payload: AdminCollectionPayload) {
  const { data } = await api.put(`/admin/collections/${handle}`, payload);
  return data as { ok: boolean; message: string };
}

export async function adminDeleteCollection(handle: string) {
  const { data } = await api.delete(`/admin/collections/${handle}`);
  return data as { ok: boolean; message: string };
}

/** Fetches the product handles currently in a collection (via the public endpoint). */
export async function adminGetCollectionProducts(handle: string): Promise<string[]> {
  const { data } = await api.get<{ ok: boolean; data: { products: { handle: string }[] } }>(
    `/collections/${handle}`,
  );
  return (data.data.products ?? []).map((p) => p.handle);
}

export async function adminSetCollectionProducts(handle: string, productHandles: string[]) {
  const { data } = await api.put(`/admin/collections/${handle}/products`, { productHandles });
  return data as { ok: boolean; message: string };
}

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
