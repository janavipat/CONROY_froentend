import { cn } from "@/utils/cn";

/**
 * A placeholder shaped like the content that is coming.
 *
 * Used instead of a spinner wherever the shape of the result is already known —
 * an order card, an address, a review. A spinner says only "wait"; a skeleton
 * says what is arriving and reserves its space, so nothing jumps when the real
 * content lands.
 *
 * `animate-pulse` rather than a travelling shimmer: it is the quieter of the
 * two, matches the admin placeholders already in the project, and respects the
 * global reduced-motion rule without needing its own handling.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-mist", className)} />;
}

/**
 * Wraps a group of skeletons so assistive technology announces the wait once,
 * rather than reading out a screenful of decorative boxes.
 */
export function SkeletonGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
