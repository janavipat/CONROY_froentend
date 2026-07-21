"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { adminListProducts } from "@/services/admin";
import {
  adminListOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminSetOfferActive,
  adminDeleteOffer,
  type Offer,
  type OfferType,
  type DiscountType,
  type OfferPayload,
} from "@/services/offers";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { Loader } from "@/components/ui/Loader";

const TYPE_LABEL: Record<OfferType, string> = {
  all_products: "All products",
  product: "Specific product",
  order_above: "Order above amount",
  code: "Coupon code",
};

const EMPTY: OfferPayload = {
  title: "",
  type: "all_products",
  discountType: "percent",
  discountValue: 10,
  productHandle: null,
  minOrderAmount: null,
  code: null,
  active: false,
};

function describe(o: Offer): string {
  const amount = o.discount_type === "percent" ? `${o.discount_value}% off` : `${formatCurrency(o.discount_value)} off`;
  switch (o.type) {
    case "product":
      return `${amount} on ${o.product_handle}`;
    case "order_above":
      return `${amount} on orders above ${formatCurrency(o.min_order_amount ?? 0)}`;
    case "code":
      return `${amount} with code “${o.code}”`;
    default:
      return `${amount} on all products`;
  }
}

export function OffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OfferPayload>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const [o, p] = await Promise.all([adminListOffers(), adminListProducts()]);
      setOffers(o);
      setProducts(p);
    } catch {
      setError("Could not load offers. (Run offers.sql and start the backend.)");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function run() {
      await refresh();
      if (!active) return;
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof OfferPayload>(key: K, value: OfferPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
  }

  function editOffer(o: Offer) {
    setEditingId(o.id);
    setError("");
    setForm({
      title: o.title,
      type: o.type,
      discountType: o.discount_type,
      discountValue: o.discount_value,
      productHandle: o.product_handle,
      minOrderAmount: o.min_order_amount,
      code: o.code,
      active: o.active,
    });
  }

  async function save() {
    if (!form.title.trim()) return setError("Give the offer a name.");
    if (form.type === "product" && !form.productHandle) return setError("Pick a product.");
    if (form.type === "order_above" && !form.minOrderAmount) return setError("Set a minimum order amount.");
    if (form.type === "code" && !form.code?.trim()) return setError("Enter a coupon code.");

    setSaving(true);
    setError("");
    try {
      if (editingId) await adminUpdateOffer(editingId, form);
      else await adminCreateOffer(form);
      resetForm();
      await refresh();
    } catch {
      setError("Could not save the offer. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(o: Offer) {
    setOffers((os) =>
      os.map((x) => (x.id === o.id ? { ...x, active: !o.active } : { ...x, active: false })),
    );
    try {
      await adminSetOfferActive(o.id, !o.active);
      await refresh();
    } catch {
      setError("Could not change the active offer.");
      await refresh();
    }
  }

  async function remove(id: string) {
    setOffers((os) => os.filter((o) => o.id !== id));
    try {
      await adminDeleteOffer(id);
    } catch {
      await refresh();
    }
  }

  const inputCls =
    "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none";

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Offers</h1>
        <p className="mt-1 text-sm text-stone">
          Only one offer can be active at a time — activating one turns the others off.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* Form */}
      <div className="mt-6 rounded-media border border-line bg-white p-5">
        <h2 className="font-display text-lg text-ink">{editingId ? "Edit offer" : "Create an offer"}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Offer name</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Summer Sale"
              className={inputCls}
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Offer type</span>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as OfferType)}
              className={inputCls}
            >
              {(Object.keys(TYPE_LABEL) as OfferType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Discount</span>
              <select
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value as DiscountType)}
                className={inputCls}
              >
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Value</span>
              <input
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(e) => set("discountValue", Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>

          {/* Conditional fields */}
          {form.type === "product" && (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Product</span>
              <select
                value={form.productHandle ?? ""}
                onChange={(e) => set("productHandle", e.target.value || null)}
                className={inputCls}
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.handle} value={p.handle}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          {form.type === "order_above" && (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">
                Minimum order amount (₹)
              </span>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount ?? ""}
                onChange={(e) => set("minOrderAmount", e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
            </label>
          )}

          {form.type === "code" && (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-stone">Coupon code</span>
              <input
                value={form.code ?? ""}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className={cn(inputCls, "uppercase")}
              />
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Make this the active offer (turns off any other active offer)
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update offer" : "Create offer"}
          </Button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-line px-4 text-sm text-ink transition-colors hover:bg-mist"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="grid place-items-center rounded-media border border-line bg-white py-16">
            <Loader size="sm" label="" />
          </div>
        ) : offers.length === 0 ? (
          <p className="rounded-media border border-line bg-white py-16 text-center text-stone">
            No offers yet — create one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {offers.map((o) => (
              <li
                key={o.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-media border bg-white p-4",
                  o.active ? "border-ink" : "border-line",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{o.title}</span>
                    {o.active && (
                      <span className="rounded-full bg-green-600 px-2 py-0.5 text-[0.65rem] font-medium text-white">
                        Active
                      </span>
                    )}
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[0.65rem] text-stone">
                      {TYPE_LABEL[o.type]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone">{describe(o)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(o)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      o.active
                        ? "border border-line text-ink hover:bg-mist"
                        : "bg-ink text-white hover:opacity-90",
                    )}
                  >
                    {o.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => editOffer(o)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:bg-mist"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(o.id)}
                    className="rounded-md px-3 py-1.5 text-xs text-stone transition-colors hover:text-accent"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
