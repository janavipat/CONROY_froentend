"use client";

import type { Address } from "@/services/addresses";
import { formatAddress } from "@/services/addresses";
import { PencilIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

/**
 * The saved-address layer above the checkout form.
 *
 * Every address is on screen as a selectable card, so choosing one is a single
 * tap rather than a trip through a picker. The form remains the source of truth
 * for the order — selecting a card fills it in — so validation, the address
 * snapshot on the order and the courier hand-off are unaffected by anything
 * here, and editing a card cannot rewrite an address a past order was sent to.
 */
export function SavedAddresses({
  addresses,
  selectedId,
  onSelect,
  onEdit,
  onAddNew,
  busy = false,
}: {
  addresses: Address[];
  selectedId: string | null;
  /** Chosen address; the caller copies it into the delivery form. */
  onSelect: (address: Address) => void;
  /** Opens the address form on this record, to update it in place. */
  onEdit: (address: Address) => void;
  onAddNew: () => void;
  busy?: boolean;
}) {
  if (!addresses.length) return null;
  const selected = selectedId ?? addresses[0]?.id;

  return (
    <div className="mt-3">
      <div className="space-y-2.5">
        {addresses.map((a) => {
          const active = a.id === selected;
          return (
            <div
              key={a.id}
              className={cn(
                "relative rounded-lg border transition-colors",
                active ? "border-ink bg-mist/30" : "border-line bg-white hover:border-stone",
              )}
            >
              {/* The label is the hit target: the whole card selects, which is
                  what a thumb expects, while the pencil sits outside it. */}
              <label className="flex cursor-pointer gap-3 p-4 pr-12 sm:pr-14">
                <input
                  type="radio"
                  name="delivery-address"
                  checked={active}
                  onChange={() => onSelect(a)}
                  disabled={busy}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
                      {a.label}
                    </span>
                    {a.isDefault && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-stone">
                        Default
                      </span>
                    )}
                  </span>

                  <span className="mt-1.5 block text-sm font-medium text-ink">{a.fullName}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
                    {formatAddress(a)}
                  </span>
                  <span className="mt-0.5 block text-sm tabular-nums text-stone">{a.phone}</span>
                </span>
              </label>

              {/* 44px of tappable area, kept clear of the label above so a tap
                  on it edits rather than selecting the card underneath. */}
              <button
                type="button"
                onClick={() => onEdit(a)}
                disabled={busy}
                aria-label={`Edit ${a.label} address for ${a.fullName}`}
                className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-md text-stone transition-colors hover:bg-mist hover:text-ink disabled:opacity-40"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddNew}
        disabled={busy}
        className="mt-3 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-stone underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-50"
      >
        + Add new address
      </button>
    </div>
  );
}
