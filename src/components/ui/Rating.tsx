import { cn } from "@/utils/cn";
import { StarIcon } from "./Icons";

/**
 * Five-star rating display. Stars fill fractionally, so a 4.2 and a 4.7 read
 * differently instead of both rounding up to five solid stars. The numeric
 * average sits alongside them — it's the part shoppers actually compare.
 */
export function Rating({
  value,
  count,
  className,
  showCount = true,
}: {
  value: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}) {
  const rated = value > 0;

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={rated ? `Rated ${value.toFixed(1)} out of 5` : "No ratings yet"}
    >
      <div className="flex items-center gap-0.5 text-ink">
        {Array.from({ length: 5 }).map((_, i) => {
          // How much of this star is earned: 1 = full, 0.4 = 40% filled, 0 = empty.
          const fill = Math.min(1, Math.max(0, value - i));
          return (
            <span key={i} className="relative inline-flex h-3.5 w-3.5 shrink-0">
              <StarIcon className="h-3.5 w-3.5 opacity-20" />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <StarIcon className="h-3.5 w-3.5 max-w-none opacity-100" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {rated && <span className="text-xs font-medium text-ink-soft">{value.toFixed(1)}</span>}
      {showCount && count !== undefined && (
        <span className="text-xs text-stone">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
