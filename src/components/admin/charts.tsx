"use client";

import { useId } from "react";
import { cn } from "@/utils/cn";

/* ────────────────────────── Area / line chart ───────────────────────────── */

export function AreaChart({
  points,
  height = 160,
  className,
  valueFormat = (n) => String(n),
  labels,
}: {
  points: number[];
  height?: number;
  className?: string;
  valueFormat?: (n: number) => string;
  labels?: string[];
}) {
  const gradId = useId();
  const w = 640;
  const h = height;
  const pad = 8;
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => (n <= 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1));
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;
  const last = points[n - 1] ?? 0;
  const peak = Math.max(...points);
  const peakIdx = points.indexOf(peak);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-ink)]" stopOpacity="0.16" />
          <stop offset="100%" className="[stop-color:var(--color-ink)]" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" className="stroke-ink" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {n > 0 && (
        <>
          <circle cx={x(peakIdx)} cy={y(peak)} r={3.5} className="fill-ink" vectorEffect="non-scaling-stroke" />
          <circle cx={x(n - 1)} cy={y(last)} r={3.5} className="fill-accent" vectorEffect="non-scaling-stroke" />
        </>
      )}
      {labels && (
        <>
          <text x={x(0)} y={h - 1} className="fill-stone text-[9px]" style={{ fontSize: 9 }}>
            {labels[0]}
          </text>
          <text x={x(n - 1)} y={h - 1} textAnchor="end" className="fill-stone text-[9px]" style={{ fontSize: 9 }}>
            {labels[n - 1]}
          </text>
        </>
      )}
      <title>{`Peak ${valueFormat(peak)}`}</title>
    </svg>
  );
}

/* ─────────────────────────────── Bar chart ──────────────────────────────── */

export function BarChart({
  points,
  height = 160,
  className,
  labels,
}: {
  points: number[];
  height?: number;
  className?: string;
  labels?: string[];
}) {
  const w = 640;
  const h = height;
  const pad = 8;
  const max = Math.max(1, ...points);
  const n = points.length;
  const gap = 4;
  const bw = (w - pad * 2 - gap * (n - 1)) / n;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} preserveAspectRatio="none" role="img">
      {points.map((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        const bx = pad + i * (bw + gap);
        const isLast = i === n - 1;
        return (
          <rect
            key={i}
            x={bx}
            y={h - pad - bh}
            width={bw}
            height={Math.max(bh, v > 0 ? 2 : 0)}
            rx={2}
            className={isLast ? "fill-accent" : "fill-ink/25"}
          >
            <title>{`${labels?.[i] ?? i}: ${v}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

/* ────────────────────────────── Donut chart ─────────────────────────────── */

const DONUT_COLORS = ["var(--color-ink)", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0ea5e9"];

export function DonutChart({
  slices,
  size = 148,
  className,
}: {
  slices: { label: string; value: number }[];
  size?: number;
  className?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  // Precompute each slice's fraction + cumulative offset (pure, no mutation).
  const fracs = slices.map((s) => s.value / total);
  const offsets = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <svg viewBox="0 0 148 148" width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx="74" cy="74" r={r} fill="none" className="stroke-line" strokeWidth={16} />
        {slices.map((s, i) => {
          const frac = fracs[i];
          const offset = offsets[i];
          const dash = frac * c;
          return (
            <circle
              key={s.label}
              cx="74"
              cy="74"
              r={r}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={16}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset * c}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="capitalize text-ink-soft">{s.label.replace(/_/g, " ")}</span>
            <span className="ml-auto font-medium text-ink">{s.value}</span>
          </li>
        ))}
        {slices.length === 0 && <li className="text-stone">No data yet.</li>}
      </ul>
    </div>
  );
}
