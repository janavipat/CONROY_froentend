"use client";

import { motion } from "framer-motion";

/** Sun/moon theme switch. Theme state is owned by the parent (scoped to auth). */
export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-line bg-white/70 px-1 backdrop-blur transition-colors dark:border-white/15 dark:bg-white/10"
    >
      <span className="pointer-events-none absolute left-2 text-[0.7rem]">☀️</span>
      <span className="pointer-events-none absolute right-2 text-[0.7rem]">🌙</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="z-10 grid h-7 w-7 place-items-center rounded-full bg-ink shadow-md dark:bg-white"
        style={{ marginLeft: isDark ? "1.75rem" : 0 }}
      />
    </button>
  );
}
