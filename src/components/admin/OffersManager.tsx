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
import { ConfirmDialog } from "./ui";

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

/** "10% off" / "₹200 off" — the amount alone, for its own column. */
function amountLabel(o: Offer): string {
  return o.discount_type === "percent"
    ? `${o.discount_value}% off`
    : `${formatCurrency(o.discount_value)} off`;
}

/** What the offer applies to, without repeating the amount beside it. */
function conditionLabel(o: Offer): string {
  switch (o.type) {
    case "product":
      return `on ${o.product_handle}`;
    case "order_above":
      return `on orders above ${formatCurrency(o.min_order_amount ?? 0)}`;
    case "code":
      return `with code “${o.code}”`;
    default:
      return "on all products";
  }
}

/* Inputs are the Edit Product page's, verbatim. */
const field =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none";
const label = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone";

export function OffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OfferPayload>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  /**
   * Stops the mouse wheel from editing a number field — a focused
   * <input type="number"> steps on scroll, which is what silently turned a
   * typed 999 into 997 on the product form.
   */
  function blurOnWheel(e: React.WheelEvent<HTMLInputElement>) {
    e.currentTarget.blur();
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
    setDeleting(true);
    setOffers((os) => os.filter((o) => o.id !== id));
    try {
      await adminDeleteOffer(id);
      // The form was editing the offer that just went — clear it rather than
      // leave it pointed at a record that no longer exists.
      if (editingId === id) resetForm();
    } catch {
      await refresh();
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  const activeCount = offers.filter((o) => o.active).length;

  return (
    <div className="mx-auto min-w-0 max-w-[1360px]">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Offers</h1>
        <p className="mt-1 text-sm text-stone">
          Only one offer can be active at a time — activating one turns the others off.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* ── Create / edit ────────────────────────────────────────────────── */}
      <div className="mt-5 rounded-xl border border-[#E5E5E5] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg leading-none text-ink">
            {editingId ? "Edit offer" : "Create an offer"}
          </h2>
          {editingId && (
            <span className="rounded-md bg-[#F5F5F4] px-2.5 py-1 text-[0.6875rem] font-medium text-[#737373]">
              Editing “{form.title || "untitled"}”
            </span>
          )}
        </div>

        {/* Four across on a wide screen, two on a tablet, stacked on a phone —
            the name field alone used to run 1,118px wide. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0 xl:col-span-2">
            <span className={label}>Offer name</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Summer Sale"
              className={field}
            />
          </label>

          <label className="min-w-0">
            <span className={label}>Offer type</span>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as OfferType)}
              className={field}
            >
              {(Object.keys(TYPE_LABEL) as OfferType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            <label className="min-w-0">
              <span className={label}>Discount</span>
              <select
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value as DiscountType)}
                className={field}
              >
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className={label}>Value</span>
              <input
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(e) => set("discountValue", Number(e.target.value))}
                onWheel={blurOnWheel}
                className={field}
              />
            </label>
          </div>

          {/* Conditional fields — a full row of their own, so the four columns
              above keep their positions as the type changes. */}
          {form.type === "product" && (
            <label className="min-w-0 sm:col-span-2 xl:col-span-4">
              <span className={label}>Product</span>
              <select
                value={form.productHandle ?? ""}
                onChange={(e) => set("productHandle", e.target.value || null)}
                className={field}
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
            <label className="min-w-0 sm:col-span-2 xl:col-span-4">
              <span className={label}>Minimum order amount (₹)</span>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount ?? ""}
                onChange={(e) => set("minOrderAmount", e.target.value ? Number(e.target.value) : null)}
                onWheel={blurOnWheel}
                className={field}
              />
            </label>
          )}

          {form.type === "code" && (
            <label className="min-w-0 sm:col-span-2 xl:col-span-4">
              <span className={label}>Coupon code</span>
              <input
                value={form.code ?? ""}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className={cn(field, "uppercase")}
              />
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5E5] pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-[0.8125rem] text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            Make this the active offer
            <span className="text-[#A3A3A3]">(turns off any other)</span>
          </label>

          <div className="flex items-center gap-2">
            {editingId && (
              <Button variant="outline" size="md" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button size="md" onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update offer" : "Create offer"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-5 py-3">
          <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">
            All offers
          </h2>
          {!loading && offers.length > 0 && (
            <span className="text-[0.75rem] text-[#737373]">
              {offers.length} total · {activeCount === 0 ? "none active" : "1 active"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader size="sm" label="" />
          </div>
        ) : offers.length === 0 ? (
          /* Was a 157px band of empty card. */
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-ink">No offers yet</p>
            <p className="mt-1 text-[0.8125rem] text-stone">
              Create one above and it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
            <table className="w-full min-w-[820px] table-fixed border-collapse text-sm">
              <colgroup>
                <col />
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[92px]" />
                <col className="w-[236px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E5E5E5] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[#737373]">
                  <th className="px-5 py-2.5 font-medium">Offer</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 text-right font-medium">Discount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {offers.map((o) => (
                  <tr
                    key={o.id}
                    className={cn(
                      "transition-colors",
                      // Clear but quiet: a faint tint plus the badge, rather
                      // than a heavy border around the whole row.
                      o.active ? "bg-[#16803C]/[0.045]" : "hover:bg-[#FAFAF9]",
                    )}
                  >
                    <td className="px-5 py-2.5">
                      <span className="block truncate font-medium text-ink" title={o.title}>
                        {o.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.75rem] text-[#737373]">
                        {conditionLabel(o)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex whitespace-nowrap rounded-md bg-[#F5F5F4] px-2 py-0.5 text-[0.6875rem] text-[#737373]">
                        {TYPE_LABEL[o.type]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums font-medium text-ink">
                      {amountLabel(o)}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.active ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#16803C]/10 px-2 py-0.5 text-[0.6875rem] font-medium text-[#16803C] ring-1 ring-inset ring-[#16803C]/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16803C]" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[0.75rem] text-[#A3A3A3]">Inactive</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleActive(o)}
                          className={cn(
                            "h-8 rounded-md px-2.5 text-xs font-medium transition-colors",
                            o.active
                              ? "border border-line text-ink hover:bg-[#F5F5F4]"
                              : "bg-ink text-white hover:opacity-90",
                          )}
                        >
                          {o.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => editOffer(o)}
                          className="h-8 rounded-md border border-line px-2.5 text-xs text-ink transition-colors hover:bg-[#F5F5F4]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPendingDelete(o)}
                          className="h-8 rounded-md px-2.5 text-xs text-[#DC2626] transition-colors hover:bg-[#DC2626]/5"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deleting an offer used to happen on the first click, with nothing
          asked and no undo. */}
      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Delete this offer?"
        description="It stops applying at checkout immediately. This can’t be undone."
        detail={
          pendingDelete && (
            <div className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-medium text-[#171717]">
                {pendingDelete.title}
              </span>
              <span className="block truncate text-[0.75rem] text-[#737373]">
                {amountLabel(pendingDelete)} {conditionLabel(pendingDelete)}
                {pendingDelete.active ? " · currently active" : ""}
              </span>
            </div>
          )
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete.id)}
      />
    </div>
  );
}
