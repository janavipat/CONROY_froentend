"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { PlusIcon, MinusIcon } from "./Icons";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "text-sm tracking-[0.01em]",
                  isOpen ? "text-ink" : "text-ink-soft",
                )}
              >
                {item.title}
              </span>
              {isOpen ? (
                <MinusIcon className="h-4 w-4 shrink-0 text-ink" />
              ) : (
                <PlusIcon className="h-4 w-4 shrink-0 text-stone" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-sm leading-relaxed text-ink-soft">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
