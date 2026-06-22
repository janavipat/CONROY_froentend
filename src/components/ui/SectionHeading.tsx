import { cn } from "@/utils/cn";
import { Reveal } from "@/components/motion/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  light?: boolean;
}

/** Reusable editorial section header: eyebrow + serif title + optional lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  light = false,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className={cn("eyebrow", light ? "text-cream/70" : "text-stone")}>{eyebrow}</span>
      )}
      <h2
        className={cn(
          "font-display text-3xl leading-[1.1] sm:text-4xl lg:text-[2.75rem]",
          light ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-[0.95rem] leading-relaxed",
            light ? "text-cream/75" : "text-ink-soft",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
