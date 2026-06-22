import { cn } from "@/utils/cn";
import { StarIcon } from "./Icons";

/** Five-star rating display. */
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
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5 text-ink">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={cn("h-3.5 w-3.5", i < Math.round(value) ? "opacity-100" : "opacity-20")}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-stone">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
