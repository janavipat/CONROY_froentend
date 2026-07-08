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
        "grid place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95",
        dim,
        className,
      )}
    >
      <HeartIcon className={cn(icon, liked ? "fill-current text-accent" : "text-ink")} />
    </button>
  );
}
