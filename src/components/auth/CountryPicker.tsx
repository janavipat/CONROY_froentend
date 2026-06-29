"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUNTRIES, type Country } from "@/lib/countries";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

export function CountryPicker({
  value,
  onChange,
  disabled,
}: {
  value: Country;
  onChange: (c: Country) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.iso2.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-12 items-center gap-1.5 rounded-l-xl border border-r-0 border-line bg-white px-3 text-sm text-ink transition-colors hover:bg-mist focus:outline-none disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        <span className="text-base leading-none">{value.flag}</span>
        <span className="font-medium">{value.dial}</span>
        <ChevronDownIcon
          className={cn("h-3.5 w-3.5 text-stone transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#17171a]"
          >
            <div className="flex items-center gap-2 border-b border-line px-3 dark:border-white/10">
              <SearchIcon className="h-4 w-4 text-stone" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code"
                className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-stone dark:text-white"
              />
            </div>
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-stone">No matches</li>
              )}
              {filtered.map((c) => (
                <li key={c.iso2 + c.dial}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-mist dark:text-zinc-100 dark:hover:bg-white/5",
                      c.iso2 === value.iso2 && "bg-mist font-medium dark:bg-white/5",
                    )}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-stone">{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
