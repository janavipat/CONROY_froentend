import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white border border-ink hover:bg-black",
  outline: "bg-white text-ink border border-ink hover:bg-ink hover:text-white",
  ghost: "bg-transparent text-ink hover:text-accent border border-transparent",
  light: "bg-white text-ink border border-white hover:bg-transparent hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-6 text-sm",
  md: "h-12 px-8 text-sm",
  lg: "h-14 px-10 text-[0.95rem]",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-medium tracking-normal transition-colors duration-300 ease-[var(--ease-luxe)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(baseClasses, VARIANTS[variant], SIZES[size], className);

  if ("href" in rest && rest.href) {
    return (
      <Link className={classes} {...(rest as ComponentProps<typeof Link>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
