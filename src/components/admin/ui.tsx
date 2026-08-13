"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";

/**
 * Admin design primitives.
 *
 * The storefront's tokens are tuned for editorial photography — warm paper, a
 * serif display face, generous air. An operations console needs the opposite:
 * dense, neutral, legible at a glance. These primitives carry that second
 * system so the two never bleed into each other, and so every admin surface
 * shares one card, one badge and one number treatment.
 */

export const ADMIN = {
  page: "bg-[#F7F7F5]",
  card: "bg-white border border-[#E5E5E5]",
  text: "text-[#171717]",
  muted: "text-[#737373]",
  border: "border-[#E5E5E5]",
} as const;

/* ───────────────────────────────── Card ─────────────────────────────────── */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(16,16,16,0.04)]",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]">{title}</h2>
      {action}
    </div>
  );
}

/* ──────────────────────────────── Badges ────────────────────────────────── */

/**
 * Order state → colour. Semantic only: green settled, amber awaiting, blue in
 * flight, red failed, grey unknown. Anything unrecognised degrades to neutral
 * rather than inventing a colour for it.
 */
const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20" },
  delivered: { label: "Delivered", cls: "bg-[#16803C]/10 text-[#16803C] ring-[#16803C]/20" },
  cod_pending: { label: "COD", cls: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20" },
  pending: { label: "Pending", cls: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/20" },
  processing: { label: "Processing", cls: "bg-[#2563EB]/10 text-[#2563EB] ring-[#2563EB]/20" },
  shipped: { label: "Shipped", cls: "bg-[#2563EB]/10 text-[#2563EB] ring-[#2563EB]/20" },
  cancelled: { label: "Cancelled", cls: "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20" },
  failed: { label: "Failed", cls: "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/20" },
  refunded: { label: "Refunded", cls: "bg-[#7C3AED]/10 text-[#7C3AED] ring-[#7C3AED]/20" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    cls: "bg-[#F5F5F4] text-[#737373] ring-[#E5E5E5]",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.6875rem] font-medium capitalize ring-1 ring-inset",
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

/* ──────────────────────────────── Delta ─────────────────────────────────── */

/**
 * Period-over-period change. Renders nothing when the comparison is unknown —
 * a dash is honest, an invented "+0.0%" is not.
 */
export function Delta({ value, className }: { value: number | null; className?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={cn("text-[0.75rem] text-[#A3A3A3]", className)}>—</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap text-[0.75rem] font-medium",
        up ? "text-[#16803C]" : "text-[#DC2626]",
        className,
      )}
    >
      <svg viewBox="0 0 12 12" className={cn("h-3 w-3", !up && "rotate-180")} aria-hidden>
        <path d="M6 2.5 10 8H2z" fill="currentColor" />
      </svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/* ────────────────────────────── Sparkline ───────────────────────────────── */

/** A bare trend line for KPI cards — no axes, no labels, just the shape. */
export function Sparkline({
  points,
  className,
  tone = "ink",
}: {
  points: number[];
  className?: string;
  tone?: "ink" | "up" | "down";
}) {
  const id = useId();
  if (!points.length) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const x = (i: number) => (points.length <= 1 ? w : (i * w) / (points.length - 1));
  const y = (v: number) => h - 2 - ((v - min) / span) * (h - 6);
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const stroke = tone === "up" ? "#16803C" : tone === "down" ? "#DC2626" : "#171717";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-full", className)} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ───────────────────────────── Skeletons ────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[#EFEFED]", className)} />;
}

/* ──────────────────────────────- Count up ───────────────────────────────── */

/**
 * Counts a figure up from zero once, on mount.
 *
 * Driven by requestAnimationFrame against elapsed time rather than a per-frame
 * increment, so the run takes the same ~700ms on any refresh rate and always
 * lands exactly on the target. `format` keeps currency and plain counts on the
 * same component. Respects prefers-reduced-motion by rendering the final value
 * immediately.
 */
export function CountUp({
  value,
  format,
  duration = 700,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    /**
     * The animation is decoration; the number is not. requestAnimationFrame is
     * paused entirely while a page isn't compositing — a background tab, a
     * hidden embed — and an rAF-only counter would sit at 0 for as long as
     * that lasts, reading as "no orders" rather than "not animated yet". This
     * timer is the guarantee: whatever happens to the frames, the true figure
     * is shown. It is a no-op when the animation did run.
     */
    const settle = setTimeout(() => setShown(value), duration + 80);

    // Every state write happens inside a callback, never in the effect body —
    // writing synchronously here would cascade a render on mount.
    if (reduced || value === 0) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(settle);
      };
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out: fast, then settles
      setShown(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [value, duration]);

  return <>{format ? format(shown) : shown.toLocaleString("en-IN")}</>;
}

/* ────────────────────────── Confirm dialog ──────────────────────────────── */

/**
 * Confirmation before a destructive action.
 *
 * This replaces `window.confirm`. The native dialog does technically ask, but
 * it asks in the browser's chrome rather than the console's — unstyled, unable
 * to name the record in anything but plain text, and dismissible with a stray
 * Enter because the browser focuses OK by default. Deleting a product is not
 * undoable, so the ask is worth doing properly: the product's name and image
 * are shown, Cancel takes focus, and Escape or a backdrop click both cancel.
 *
 * The confirming button is never the default action — an operator who mashes
 * Enter cancels rather than deletes.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  /** Optional record identity — the thing being destroyed, shown verbatim. */
  detail?: React.ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const headingId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Escape always cancels — but not mid-delete, when there is nothing left to
    // call off and closing would only hide the outcome.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus lands on Cancel, so Enter and Space are safe.
    const focus = requestAnimationFrame(() => cancelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      cancelAnimationFrame(focus);
    };
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !busy && onCancel()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="relative w-full max-w-[420px] rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_20px_60px_rgba(16,16,16,0.22)]"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DC2626]/10">
                <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#DC2626]" aria-hidden>
                  <path
                    d="M10 6.5v4.2M10 13.6v.05M8.6 2.9 1.9 15.1a1.6 1.6 0 0 0 1.4 2.4h13.4a1.6 1.6 0 0 0 1.4-2.4L11.4 2.9a1.6 1.6 0 0 0-2.8 0Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id={headingId}
                  className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#171717]"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[#737373]">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {detail && (
              <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-[#FAFAF9] p-3">{detail}</div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-[0.8125rem] font-medium text-[#171717] transition-colors hover:bg-[#F5F5F4] disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="rounded-lg bg-[#DC2626] px-4 py-2 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? busyLabel : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────── Branded loader ─────────────────────────────── */

/**
 * The CONROY loading state.
 *
 * Grey skeletons say "something is coming" but say nothing about whose product
 * this is; on a screen an operator stares at all day, the mark is worth the
 * moment. A ring turns around the monogram with the wordmark beneath, on the
 * admin ground so it reads as part of the console rather than a page overlay.
 */
export function BrandLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid min-h-[50vh] w-full place-items-center", className)}
    >
      <div className="flex flex-col items-center">
        <span className="relative grid h-14 w-14 place-items-center">
          {/* Track, then the turning arc over it. */}
          <span className="absolute inset-0 rounded-full border-2 border-[#E5E5E5]" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#171717] [animation-duration:900ms]" />
          <span className="font-display text-[0.9rem] leading-none tracking-[0.08em] text-[#171717]">
            C
          </span>
        </span>

        <span className="mt-4 font-display text-[0.8125rem] leading-none tracking-[0.3em] text-[#171717]">
          CONROY
        </span>
        <span className="mt-2 text-[0.75rem] text-[#737373]">{label}…</span>
      </div>
    </div>
  );
}
