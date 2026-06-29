"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { CountryPicker } from "@/components/auth/CountryPicker";
import { OtpInput } from "@/components/auth/OtpInput";
import { CheckIcon, ChevronLeftIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

const RESEND_SECONDS = 30;

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const panelMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { type: "spring" as const, stiffness: 380, damping: 34 },
};

export function PhoneOtpAuth() {
  const { user, initializing, isConfigured, demoCode, sendOtp, verifyOtp, signOut } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const e164 = useMemo(() => `${country.dial}${phone}`, [country, phone]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function validatePhone(): boolean {
    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      setPhoneError("Please enter your mobile number");
      return false;
    }
    if (digits.length !== country.len) {
      setPhoneError(`Enter a valid ${country.len}-digit number`);
      return false;
    }
    setPhoneError(null);
    return true;
  }

  async function handleSend() {
    if (!validatePhone()) return;
    setSending(true);
    const { error } = await sendOtp(e164, remember);
    setSending(false);
    if (error) {
      setPhoneError(error);
      toast(error, "error");
      return;
    }
    setOtp("");
    setOtpError(null);
    setStep("otp");
    setResendIn(RESEND_SECONDS);
    toast(`OTP sent to ${e164}`, "success");
  }

  async function handleResend() {
    if (resendIn > 0 || sending) return;
    setSending(true);
    const { error } = await sendOtp(e164, remember);
    setSending(false);
    if (error) {
      toast(error, "error");
      return;
    }
    setOtp("");
    setOtpError(null);
    setResendIn(RESEND_SECONDS);
    toast("A new code is on its way", "success");
  }

  async function handleVerify(code?: string) {
    const value = code ?? otp;
    if (value.length !== 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    const { error } = await verifyOtp(e164, value);
    setVerifying(false);
    if (error) {
      setOtpError(error);
      setOtp("");
      toast(error, "error");
      return;
    }
    toast("Signed in successfully", "success");
  }

  function changeNumber() {
    setStep("phone");
    setOtp("");
    setOtpError(null);
  }

  /* ---- Auto-login splash --------------------------------------------- */
  if (initializing) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-stone">
        <Spinner className="h-6 w-6 text-ink dark:text-white" />
        <p className="text-sm">Checking your session…</p>
      </div>
    );
  }

  /* ---- Already signed in (session exists) ---------------------------- */
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5 text-center"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckIcon className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-2xl text-ink dark:text-white">You&apos;re signed in</h2>
          <p className="text-sm text-stone">{user.phone}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Link
            href="/collections/all"
            className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-ink"
          >
            Continue shopping
          </Link>
          <button
            onClick={async () => {
              await signOut();
              toast("Logged out", "info");
            }}
            className="flex h-12 items-center justify-center rounded-xl border border-line text-sm font-medium text-ink transition-colors hover:bg-mist dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </motion.div>
    );
  }

  /* ---- Auth flow ----------------------------------------------------- */
  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-[1.7rem] leading-tight text-ink dark:text-white sm:text-3xl">
          {step === "phone" ? "Sign in" : "Verify your number"}
        </h1>
        <p className="mt-1.5 text-sm text-stone">
          {step === "phone"
            ? "Enter your mobile number to receive a one-time code."
            : `We sent a 6-digit code to ${e164}.`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.form
            key="phone"
            {...panelMotion}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-stone">
                Mobile number
              </label>
              <div className="flex">
                <CountryPicker value={country} onChange={setCountry} disabled={sending} />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  value={phone}
                  disabled={sending}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, country.len));
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="Mobile number"
                  className={cn(
                    "h-12 w-full rounded-r-xl border bg-white px-4 text-sm text-ink shadow-sm outline-none transition-all placeholder:text-stone focus:ring-2 focus:ring-ink/10",
                    "border-line focus:border-ink",
                    "dark:bg-white/5 dark:text-white dark:placeholder:text-stone dark:border-white/15 dark:focus:border-white dark:focus:ring-white/15",
                    phoneError && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15",
                  )}
                />
              </div>
              <AnimatePresence>
                {phoneError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs text-rose-500"
                  >
                    {phoneError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft dark:text-zinc-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-line text-ink accent-ink dark:accent-white"
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              disabled={sending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white shadow-lg shadow-ink/10 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60 dark:bg-white dark:text-ink dark:shadow-white/5"
            >
              {sending ? (
                <>
                  <Spinner /> Sending OTP…
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div key="otp" {...panelMotion} className="space-y-5">
            <button
              type="button"
              onClick={changeNumber}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone transition-colors hover:text-ink dark:hover:text-white"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" /> Change number
            </button>

            <OtpInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (otpError) setOtpError(null);
              }}
              onComplete={(v) => void handleVerify(v)}
              disabled={verifying}
              error={Boolean(otpError)}
            />

            <AnimatePresence>
              {otpError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-rose-500"
                >
                  {otpError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={verifying || otp.length !== 6}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white shadow-lg shadow-ink/10 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50 dark:bg-white dark:text-ink"
            >
              {verifying ? (
                <>
                  <Spinner /> Verifying…
                </>
              ) : (
                "Verify & continue"
              )}
            </button>

            <div className="text-center text-sm text-stone">
              {resendIn > 0 ? (
                <span>
                  Resend code in <span className="font-medium text-ink dark:text-white">{resendIn}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={sending}
                  className="font-medium text-ink underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isConfigured && (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-mist/60 px-3 py-2 text-center text-xs text-stone dark:border-white/15 dark:bg-white/5">
          Demo mode — use code <span className="font-semibold text-ink dark:text-white">{demoCode}</span>. Add a Supabase
          anon key for live SMS.
        </p>
      )}
    </div>
  );
}
