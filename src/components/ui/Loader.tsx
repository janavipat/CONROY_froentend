import { cn } from "@/utils/cn";
import { ConroyMark } from "./ConroyMark";

/**
 * Branded loading indicator — the CONROY mark breathing gently, with a tracked
 * label. Used everywhere the app waits on data.
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
  // Width only — the mark keeps its own aspect ratio, so height follows.
  const mark = size === "sm" ? "w-9" : "w-12";
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Reserving the box keeps the pulse from nudging the label as it scales. */}
      <div className={cn("grid place-items-center", mark)}>
        <ConroyMark className="animate-brand-breathe text-ink" />
      </div>
      {label && (
        <span className="animate-pulse text-[0.65rem] uppercase tracking-[0.3em] text-stone">
          {label}
        </span>
      )}
    </div>
  );
}
