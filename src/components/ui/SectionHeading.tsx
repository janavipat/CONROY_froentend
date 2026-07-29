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
        "flex flex-col gap-5 sm:gap-6",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className={cn("eyebrow", light ? "text-cream/70" : "text-stone")}>{eyebrow}</span>
      )}
      <h2 className={cn("display-section", light ? "text-cream" : "text-ink")}>
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "measure text-body",
            light ? "text-cream/75" : "text-ink-soft",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
