"use client";

import { useState } from "react";
import type { Order } from "@/services/orders";
import { cancelOrder } from "@/services/orders";
import { formatCurrency } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BagIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Need different size",
  "Need different color",
  "Delivery taking too long",
  "Changed my mind",
  "Other",
] as const;

export function CancelOrderDialog({
  order,
  phone,
  open,
  onClose,
  onCancelled,
}: {
  order: Order;
  phone: string;
  open: boolean;
  onClose: () => void;
  /** Called after a successful cancellation so the list can refresh. */
  onCancelled: (message: string) => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const discount = order.discount ?? 0;
  const total = order.subtotal - discount;

  async function submit() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    if (reason === "Other" && !customReason.trim()) {
      setError("Please tell us a little more.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await cancelOrder({
      orderId: order.id,
      reason,
      customReason: reason === "Other" ? customReason : "",
      phone,
    });
    setSubmitting(false);

    if (result.ok) {
      onCancelled("Your order has been cancelled successfully.");
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Cancel order"
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-media p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl text-ink">Cancel Order</h2>
      <p className="mt-1 text-sm text-stone">
        Are you sure you want to cancel this order? Order #
        {order.id.slice(0, 8).toUpperCase()}
      </p>

      {/* What's being cancelled */}
      <ul className="mt-5 divide-y divide-line rounded-md border border-line">
        {order.items.map((it, i) => (
          <li key={`${it.product_handle}-${it.size}-${i}`} className="flex items-center gap-3 p-3">
            <span className="grid h-14 w-12 shrink-0 place-items-center rounded-md bg-mist text-stone">
              <BagIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{it.title}</span>
              <span className="block text-xs text-stone">
                Size {it.size} · Qty {it.quantity}
              </span>
            </span>
            <span className="shrink-0 text-sm text-ink">
              {formatCurrency(it.price * it.quantity, order.currency)}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between p-3">
          <span className="text-sm text-stone">Order total</span>
          <span className="font-display text-lg text-ink">
            {formatCurrency(total, order.currency)}
          </span>
        </li>
      </ul>

      {/* Reason */}
      <fieldset className="mt-5">
        <legend className="mb-2 block text-xs font-medium uppercase tracking-wide text-stone">
          Why are you cancelling?
        </legend>
        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                reason === r ? "border-ink bg-paper text-ink" : "border-line text-ink-soft hover:border-ink",
              )}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-ink"
              />
              {r}
            </label>
          ))}
        </div>

        {reason === "Other" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Tell us a little more…"
            aria-label="Tell us more about why you're cancelling"
            className="mt-2 w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none"
          />
        )}
      </fieldset>

      {error && <p className="mt-4 text-xs text-accent">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 rounded-md border border-line py-2.5 text-sm text-ink transition-colors hover:bg-mist disabled:opacity-50"
        >
          Cancel
        </button>
        <Button onClick={submit} className="flex-1" disabled={submitting}>
          {submitting ? "Cancelling…" : "Confirm Cancellation"}
        </Button>
      </div>
    </Modal>
  );
}
