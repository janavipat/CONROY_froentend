"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PhoneOtpAuth } from "@/components/auth/PhoneOtpAuth";
import { ThemeToggle } from "@/components/auth/ThemeToggle";
import { ShieldIcon, CheckIcon, TruckIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const THEME_KEY = "conroy-auth-theme";

const PERKS = [
  { icon: ShieldIcon, text: "Passwordless, secure OTP sign-in" },
  { icon: CheckIcon, text: "No password to remember — ever" },
  { icon: TruckIcon, text: "Faster checkout & order tracking" },
];

export function LoginExperience() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Resolve initial theme on the client to avoid SSR hydration mismatch.
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as
      | "light"
      | "dark"
      | null;
    if (stored) setTheme(stored);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  function toggle() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className={cn(theme === "dark" && "dark")}>
      <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* ── Brand panel (desktop) ─────────────────────────────── */}
        <aside className="relative hidden overflow-hidden bg-[#0e0d0c] lg:flex lg:flex-col lg:justify-between lg:p-14">
          {/* decorative gradient glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#2f4640] opacity-40 blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent opacity-20 blur-[130px]" />
            <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-lime opacity-10 blur-[120px]" />
          </div>

          <div className="relative">
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.3em] text-white"
              style={{ fontWeight: 600 }}
            >
              CONROY
            </Link>
          </div>

          <div className="relative max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[2.6rem] leading-[1.1] text-white"
            >
              Soft comfort,
              <br />
              bold looks.
            </motion.h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/60">
              Sign in with just your phone number. No passwords, no friction — only premium denim,
              made to last.
            </p>

            <ul className="mt-9 space-y-3.5">
              {PERKS.map((p, i) => (
                <motion.li
                  key={p.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white">
                    <p.icon className="h-4 w-4" />
                  </span>
                  {p.text}
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/40">
            © {new Date().getFullYear()} CONROY. Premium denim, made to last.
          </p>
        </aside>

        {/* ── Form panel ────────────────────────────────────────── */}
        <main className="relative flex items-center justify-center overflow-hidden bg-paper px-5 py-12 dark:bg-[#0b0b0c] sm:px-8">
          {/* soft background for the glass card */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent/10 blur-[110px] dark:bg-accent/15" />
            <div className="absolute -left-16 bottom-10 h-72 w-72 rounded-full bg-[#2f4640]/10 blur-[110px] dark:bg-[#2f4640]/25" />
          </div>

          {/* theme toggle */}
          <div className="absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md"
          >
            {/* mobile brand mark */}
            <Link
              href="/"
              className="mb-8 block text-center font-display text-xl tracking-[0.3em] text-ink dark:text-white lg:hidden"
              style={{ fontWeight: 600 }}
            >
              CONROY
            </Link>

            <div className="rounded-2xl border border-white/50 bg-white/70 p-7 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_70px_-20px_rgba(0,0,0,0.7)] sm:p-9">
              <PhoneOtpAuth />
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-stone">
              By continuing you agree to CONROY&apos;s{" "}
              <Link href="/policy" className="text-ink underline-offset-2 hover:underline dark:text-white">
                Terms
              </Link>{" "}
              &amp;{" "}
              <Link href="/policy" className="text-ink underline-offset-2 hover:underline dark:text-white">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
