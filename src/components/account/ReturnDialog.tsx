"use client";

import { useState } from "react";
import type { Order } from "@/services/orders";
import { createReturn, type ReturnResolution } from "@/services/returns";
import { formatCurrency } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

const REASONS = [
  "Item is defective or damaged",
  "Wrong item delivered",
  "Size doesn't fit",
  "Item not as described",
  "Quality not as expected",
  "No longer needed",
  "Other",
];

interface Selection {
  checked: boolean;
  quantity: number;
}

export function ReturnDialog({
  order,
  open,
  onClose,
  onSubmitted,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [sel, setSel] = useState<Record<string, Selection>>(() =>
    Object.fromEntries(
      order.items.map((it) => [`${it.product_handle}-${it.size}`, { checked: false, quantity: 1 }]),
    ),
  );
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState<ReturnResolution>("refund");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggle(key: string, checked: boolean) {
    setSel((s) => ({ ...s, [key]: { ...s[key], checked } }));
  }
  function setQty(key: string, quantity: number) {
    setSel((s) => ({ ...s, [key]: { ...s[key], quantity } }));
  }

  async function submit() {
    const items = order.items
      .filter((it) => sel[`${it.product_handle}-${it.size}`]?.checked)
      .map((it) => ({
        productHandle: it.product_handle,
        size: it.size,
        quantity: sel[`${it.product_handle}-${it.size}`].quantity,
      }));

    if (items.length === 0) {
      setError("Select at least one item to return.");
      return;
    }
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await createReturn({ orderId: order.id, reason, resolution, items });
    setSubmitting(false);
    if (result.ok) {
      onSubmitted();
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Return or replace items"
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-media p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl text-ink">Return or replace</h2>
      <p className="mt-1 text-sm text-stone">
        Order #{order.id.slice(0, 8).toUpperCase()} · pick the items you&apos;d like to return.
      </p>

      {/* Items */}
      <div className="mt-5 space-y-2">
        {order.items.map((it) => {
          const key = `${it.product_handle}-${it.size}`;
          const s = sel[key];
          return (
            <div
              key={key}
              className={cn(
                "rounded-md border p-3 transition-colors",
                s?.checked ? "border-ink bg-paper" : "border-line",
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={s?.checked ?? false}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="mt-1 h-4 w-4 accent-ink"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{it.title}</span>
                  <span className="block text-xs text-stone">
                    {it.fit} · Size {it.size} · Ordered {it.quantity} ·{" "}
                    {formatCurrency(it.price, order.currency)}
                  </span>
                </span>
              </label>

              {s?.checked && it.quantity > 1 && (
                <div className="mt-2 flex items-center gap-2 pl-7 text-xs text-stone">
                  <span>Qty to return:</span>
                  <select
                    value={s.quantity}
                    onChange={(e) => setQty(key, Number(e.target.value))}
                    className="rounded border border-line bg-white px-2 py-1 text-ink focus:border-ink focus:outline-none"
                  >
                    {Array.from({ length: it.quantity }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reason */}
      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone">
          Reason for return
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">Select a reason…</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Resolution */}
      <div className="mt-4">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-stone">
          Preferred resolution
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(["refund", "replacement"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResolution(r)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-sm capitalize transition-colors",
                resolution === r ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-accent">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-md border border-line py-2.5 text-sm text-ink transition-colors hover:bg-mist"
        >
          Cancel
        </button>
        <Button onClick={submit} className="flex-1" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </Modal>
  );
}
