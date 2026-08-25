"use client";

import { useState } from "react";
import type { Address } from "@/services/addresses";
import { formatAddress } from "@/services/addresses";
import { cn } from "@/utils/cn";

/**
 * The saved-address layer above the checkout form.
 *
 * A returning customer sees the address they already gave us rather than an
 * empty form. The form is still the source of truth for the order — choosing a
 * saved address fills it in — so validation, the order snapshot and the courier
 * hand-off are unchanged by anything here.
 */
export function SavedAddresses({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  busy = false,
}: {
  addresses: Address[];
  selectedId: string | null;
  /** Chosen address; the caller copies it into the delivery form. */
  onSelect: (address: Address) => void;
  onAddNew: () => void;
  busy?: boolean;
}) {
  const [choosing, setChoosing] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(selectedId);

  const selected = addresses.find((a) => a.id === selectedId) ?? addresses[0];
  if (!selected) return null;

  if (!choosing) {
    return (
      <div className="mt-3">
        <AddressCard address={selected} />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setPendingId(selected.id);
              setChoosing(true);
            }}
            disabled={busy}
            className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline disabled:opacity-50"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onAddNew}
            disabled={busy}
            className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-stone underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
          >
            + Add new address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-sm text-ink-soft">Select delivery address</p>

      <div className="mt-3 space-y-2">
        {addresses.map((a) => (
          <label
            key={a.id}
            className={cn(
              "flex cursor-pointer gap-3 border p-4 transition-colors",
              pendingId === a.id ? "border-ink" : "border-line hover:border-stone",
            )}
          >
            <input
              type="radio"
              name="delivery-address"
              checked={pendingId === a.id}
              onChange={() => setPendingId(a.id)}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <AddressBody address={a} />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const next = addresses.find((a) => a.id === pendingId);
            if (next) onSelect(next);
            setChoosing(false);
          }}
          disabled={busy || !pendingId}
          className="flex h-12 items-center justify-center bg-ink px-6 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Use this address
        </button>
        <button
          type="button"
          onClick={onAddNew}
          disabled={busy}
          className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-stone underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
        >
          + Add new address
        </button>
        <button
          type="button"
          onClick={() => setChoosing(false)}
          className="text-[0.78rem] uppercase tracking-[0.14em] text-stone underline-offset-4 hover:text-ink hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddressCard({ address }: { address: Address }) {
  return (
    <div className="border border-ink p-4">
      <AddressBody address={address} />
    </div>
  );
}

function AddressBody({ address }: { address: Address }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
          {address.label}
        </span>
        {address.isDefault && (
          <span className="border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-stone">
            Default
          </span>
        )}
      </span>
      <span className="mt-2 block text-sm font-medium text-ink">{address.fullName}</span>
      <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
        {formatAddress(address)}
      </span>
      <span className="mt-0.5 block text-sm text-stone">{address.phone}</span>
    </span>
  );
}
