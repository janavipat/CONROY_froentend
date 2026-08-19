"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ChevronDownIcon, CheckIcon } from "@/components/ui/Icons";
import { SORTS, type SortValue } from "@/lib/product-filters";

/**
 * The sort control, as a listbox rather than a native <select>.
 *
 * A native select paints with the operating system's own chrome — a grey
 * bevelled control on Windows, a blue highlight on macOS — which was the one
 * piece of UI on the listing not set in the house typography. This is a button
 * and a panel: the same widely tracked uppercase label the rest of the bar
 * uses, hairline borders, no radius beyond the site's own.
 *
 * Kept deliberately apart from the filters: sort is one choice and never
 * narrows the results.
 */
export function SortSelect({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORTS.find((s) => s.value === value) ?? SORTS[0];

  // Close on outside click or Escape, and hand focus back to the trigger so a
  // keyboard user is not dropped at the top of the page.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort by ${current.label}`}
        className="flex items-center gap-2 py-1 text-ink"
      >
        <span className="nav-label">Sort</span>
        <span className="text-xs text-ink-soft">{current.label}</span>
        <ChevronDownIcon
          className={cn("h-3 w-3 text-stone transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Sort products"
          /* Right-aligned: the control sits at the end of the toolbar, so a
             left-aligned panel would hang off the edge on a narrow screen. */
          className="absolute right-0 top-full z-40 mt-2 w-56 border border-line bg-white py-1 shadow-lg"
        >
          {SORTS.map((s) => {
            const active = s.value === value;
            return (
              <li key={s.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(s.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    active ? "text-ink" : "text-ink-soft hover:bg-paper hover:text-ink",
                  )}
                >
                  {s.label}
                  {active && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-ink" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
