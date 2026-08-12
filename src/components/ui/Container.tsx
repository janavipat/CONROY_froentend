import { cn } from "@/utils/cn";

/** Centered content container with consistent gutters. */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  // Gutters tighten to 16px below 360px. At 320px the 24px gutters cost 48px of
  // a 320px screen, which is what tipped the header and several page layouts
  // into horizontal overflow. Unchanged from 360px up.
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[1280px] px-4 min-[360px]:px-6 sm:px-10 lg:px-16",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
