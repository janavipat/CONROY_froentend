"use client";

import { useWishlist } from "@/lib/wishlist-context";
import { HeartIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

/** Heart toggle to add/remove a product from the wishlist (likes). */
export function LikeButton({
  handle,
  className,
  size = "md",
}: {
  handle: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { isLiked, toggle } = useWishlist();
  const liked = isLiked(handle);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]";

  return (
    <button
      type="button"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(handle);
      }}
      className={cn(
        // No plate, no shadow — the icon sits directly on the photograph.
        "grid place-items-center transition-opacity duration-(--duration-base) ease-[var(--ease-luxe)] hover:opacity-70",
        dim,
        className,
      )}
    >
      <HeartIcon
        className={cn(
          icon,
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
          liked ? "fill-current text-accent" : "text-white",
        )}
      />
    </button>
  );
}
