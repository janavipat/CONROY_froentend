"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

/** Segmented OTP field: auto-advance, backspace nav, full paste support. */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").slice(0, length);
    onChange(joined);
    if (joined.length === length && !joined.includes("")) onComplete?.(joined);
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    setAt(index, char);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-full min-w-0 rounded-xl border bg-white text-center text-lg font-semibold text-ink shadow-sm outline-none transition-all duration-200 sm:h-14 sm:text-xl",
            "border-line focus:border-ink focus:ring-2 focus:ring-ink/10",
            "dark:bg-white/5 dark:text-white dark:border-white/15 dark:focus:border-white dark:focus:ring-white/15",
            d && "border-ink/40 dark:border-white/40",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500",
            disabled && "opacity-60",
          )}
        />
      ))}
    </div>
  );
}
