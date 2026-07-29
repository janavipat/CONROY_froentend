import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

/*
 * The house button — tailored rather than retail: a 4px corner, uppercase text
 * at 0.08em, and a single 350ms transition on colour, border and position.
 *
 *   primary   — deep navy, warming to gold on hover
 *   outline   — the secondary: hairline ink border, filling with navy on hover
 *   ghost     — a quiet text action; no fill, no lift
 *   light     — for dark photography, where navy would disappear
 */
// `cn` is plain clsx (no tailwind-merge), so a later class cannot override an
// earlier one — the lift lives on the variants that want it rather than in the
// base with a "shadow-none" opt-out, which would not win.
const LIFT = "hover:-translate-y-0.5 hover:shadow-(--shadow-button)";

const VARIANTS: Record<Variant, string> = {
  primary: `bg-ink text-white border border-transparent hover:bg-accent hover:border-accent ${LIFT}`,
  outline: `bg-transparent text-ink border border-ink/25 hover:bg-ink hover:text-white hover:border-ink ${LIFT}`,
  // A quiet text action: no fill, so a shadow would float with nothing under it.
  ghost: "bg-transparent text-ink border border-transparent hover:text-accent",
  light: `bg-transparent text-white border border-white/60 hover:bg-white hover:text-ink hover:border-white ${LIFT}`,
};

// Heights 52–56px, horizontal padding 32–48px, 15–16px type.
const SIZES: Record<Size, string> = {
  sm: "h-[52px] px-8 text-[0.9375rem]",
  md: "h-[54px] px-10 text-[0.9375rem]",
  lg: "h-14 px-12 text-base",
};

const baseClasses = [
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap",
  "rounded-(--radius-button) font-medium uppercase tracking-[0.08em] leading-none",
  "transition-[background-color,border-color,color,transform,box-shadow] duration-(--duration-button) ease-out",
  "cursor-pointer",
  "active:translate-y-0 active:shadow-none",
  // Gold ring reads clearly against both the navy fill and the ivory ground.
  "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
  // Disabled must not lift or shadow — it should look inert, not hoverable.
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
].join(" ");

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
