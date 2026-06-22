"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/utils/cn";
import { CloseIcon } from "./Icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
  position?: "center" | "right" | "top";
}

/** Accessible, animated modal/drawer used for Quick View, Cart and Search. */
export function Modal({
  open,
  onClose,
  children,
  className,
  label = "Dialog",
  position = "center",
}: ModalProps) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelMotion =
    position === "right"
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : position === "top"
        ? { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } }
        : { initial: { opacity: 0, scale: 0.97, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 16 } };

  const wrapperPos =
    position === "right"
      ? "justify-end items-stretch"
      : position === "top"
        ? "items-start justify-center"
        : "items-center justify-center p-4 sm:p-6";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn("fixed inset-0 z-[100] flex", wrapperPos)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            aria-label="Close dialog"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            className={cn("relative z-10 bg-paper shadow-2xl", className)}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            {...panelMotion}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink hover:text-cream"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
