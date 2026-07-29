"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// A short lift, not a slide: 16px is enough to read as "arriving" without the
// page feeling like it assembles itself. 500ms is the slow end of the motion
// band; the stagger is deliberately small so a row of cards settles together
// rather than counting itself in.
const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

/** Scroll-reveal wrapper — fades and lifts content into view once. */
export function Reveal({
  children,
  index = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span" | "figure";
}) {
  const reduce = useReducedMotion();

  // Content must never depend on an animation to be visible: if the visitor
  // prefers reduced motion, render it plainly in its final state rather than
  // starting at opacity 0 and waiting for a reveal that will never play.
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
