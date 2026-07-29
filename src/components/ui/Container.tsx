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
  return (
    <Tag className={cn("mx-auto w-full max-w-[1280px] px-6 sm:px-10 lg:px-16", className)}>
      {children}
    </Tag>
  );
}
