import { cn } from "@/utils/cn";

/**
 * Branded loading indicator — a ring spinning around the CONROY monogram, with
 * a tracked label. Replaces the plain spinner across the app.
 */
export function Loader({
  label = "Loading",
  className,
  size = "md",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const ring = size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", ring)}>
        <span className="absolute inset-0 rounded-full border-2 border-line" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-ink border-r-ink" />
        <span className="absolute inset-0 grid place-items-center font-display font-semibold text-ink">
          C
        </span>
      </div>
      {label && (
        <span className="animate-pulse text-[0.65rem] uppercase tracking-[0.3em] text-stone">
          {label}
        </span>
      )}
    </div>
  );
}
