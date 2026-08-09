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
// No lift and no shadow. Nothing else on the page has depth, so a button that
// rises off it announces itself as a retail control; the colour change alone
// is the affordance. Black at rest, royal blue on hover — the brand's only
// two-colour move.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white border border-ink hover:bg-accent hover:border-accent",
  outline: "bg-transparent text-ink border border-ink/30 hover:bg-ink hover:text-white hover:border-ink",
  // A quiet text action: no fill, no border.
  ghost: "bg-transparent text-ink border border-transparent hover:text-accent",
  light: "bg-transparent text-white border border-white/70 hover:bg-white hover:text-ink hover:border-white",
};

// Heights 48–56px, horizontal padding 32–48px, 13–14px type. Tighter than
// before: the type is uppercase and widely tracked, so the box can sit closer.
const SIZES: Record<Size, string> = {
  sm: "h-11 px-7 text-[0.75rem]",
  md: "h-12 px-9 text-[0.8125rem]",
  lg: "h-[54px] px-11 text-[0.8125rem]",
};

const baseClasses = [
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap",
  "rounded-(--radius-button) font-medium uppercase tracking-[0.16em] leading-none",
  "transition-[background-color,border-color,color] duration-(--duration-button) ease-out",
  "cursor-pointer",
  // Royal ring reads clearly against both the black fill and the off-white ground.
  "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
  "disabled:opacity-40 disabled:cursor-not-allowed",
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
