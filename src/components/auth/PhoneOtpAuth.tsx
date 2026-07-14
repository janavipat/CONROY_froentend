"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuthMode } from "@/services/auth";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { CountryPicker } from "@/components/auth/CountryPicker";
import { OtpInput } from "@/components/auth/OtpInput";
import { CheckIcon, ChevronLeftIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

// Matches the backend OTP validity (otpStore TTL = 1 minute), so the countdown
// the shopper sees lines up with when the code actually expires.
const RESEND_SECONDS = 60;

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const inputClass =
  "h-12 w-full border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink";
const buttonClass =
  "flex h-12 w-full items-center justify-center gap-2 bg-ink text-[0.78rem] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-black disabled:opacity-50";

export function PhoneOtpAuth({ mode = "signin" }: { mode?: AuthMode }) {
  const { user, initializing, isConfigured, demoCode, sendOtp, verifyOtp, signOut } = useAuth();
  const { toast } = useToast();

  const isSignup = mode === "signup";
  const collectEmail = isSignup;

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const phoneRef = useRef<HTMLInputElement>(null);

  const e164 = useMemo(() => `${country.dial}${phone}`, [country, phone]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Focus the phone field AFTER hydration (avoids dropping the first keystroke
  // that `autoFocus` causes when typing before React attaches its handlers).
  useEffect(() => {
    if (step === "phone") phoneRef.current?.focus();
  }, [step]);

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

  function validateName(): boolean {
    if (!isSignup) return true;
    if (!name.trim()) {
      setNameError("Please enter your name");
      return false;
    }
    setNameError(null);
    return true;
  }

  async function handleSend() {
    const okName = validateName();
    const okPhone = validatePhone();
    if (!okName || !okPhone) return;
    setSending(true);
    const { error } = await sendOtp(e164, remember, mode);
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
    const { error } = await sendOtp(e164, remember, mode);
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
    const { error } = await verifyOtp(e164, value, {
      mode,
      email: collectEmail ? email.trim() : undefined,
      fullName: isSignup ? name.trim() : undefined,
    });
    setVerifying(false);
    if (error) {
      setOtpError(error);
      setOtp("");
      toast(error, "error");
      return;
    }
    toast(isSignup ? "Account created successfully" : "Signed in successfully", "success");
  }

  function changeNumber() {
    setStep("phone");
    setOtp("");
    setOtpError(null);
  }

  /* ---- Auto-login splash --------------------------------------------- */
  if (initializing) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-3 text-stone">
        <Spinner className="h-6 w-6 text-ink" />
        <p className="text-sm">Checking your session…</p>
      </div>
    );
  }

  /* ---- Already signed in (session exists) ---------------------------- */
  if (user) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white">
          <CheckIcon className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-2xl text-ink">You&apos;re signed in</h2>
          <p className="text-sm text-stone">{user.phone}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Link href="/collections/all" className={buttonClass}>
            Continue shopping
          </Link>
          <button
            onClick={async () => {
              await signOut();
              toast("Logged out", "info");
            }}
            className="flex h-12 w-full items-center justify-center border border-line text-[0.78rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-mist"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  /* ---- Auth flow ----------------------------------------------------- */
  return (
    <div>
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.form
            key="phone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="space-y-5"
          >
            <p className="text-sm leading-relaxed text-ink-soft">
              {isSignup
                ? "Create your account — enter your name and mobile number to get a one-time verification code."
                : "Enter your mobile number and we'll send you a one-time verification code."}
            </p>

            {isSignup && (
              <div>
                <label className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
                  Full name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  disabled={sending}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="Your name"
                  className={cn(inputClass, nameError && "border-accent")}
                />
                {nameError && <p className="mt-2 text-xs text-accent">{nameError}</p>}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
                  Mobile number
                </label>
                <span
                  className={cn(
                    "text-[0.7rem] tabular-nums",
                    phone.length === country.len ? "text-ink" : "text-stone",
                  )}
                >
                  {phone.length}/{country.len}
                </span>
              </div>
              <div className="flex">
                <CountryPicker value={country} onChange={setCountry} disabled={sending} />
                <input
                  ref={phoneRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  disabled={sending}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, country.len));
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="Mobile number"
                  className={cn(inputClass, "border-l-0", phoneError && "border-accent")}
                />
              </div>
              {phoneError && <p className="mt-2 text-xs text-accent">{phoneError}</p>}
            </div>

            {collectEmail && (
              <div>
                <label className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
                  Email <span className="normal-case tracking-normal text-stone/70">(for order updates &amp; a welcome note)</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={sending}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-ink"
              />
              Keep me signed in on this device
            </label>

            <button type="submit" disabled={sending} className={buttonClass}>
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
          <motion.div
            key="otp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <button
              type="button"
              onClick={changeNumber}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone transition-colors hover:text-ink"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" /> Change number
            </button>

            <p className="text-sm leading-relaxed text-ink-soft">
              Enter the 6-digit code sent to <span className="font-medium text-ink">{e164}</span>.
            </p>

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

            {otpError && <p className="text-xs text-accent">{otpError}</p>}

            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={verifying || otp.length !== 6}
              className={buttonClass}
            >
              {verifying ? (
                <>
                  <Spinner /> Verifying…
                </>
              ) : isSignup ? (
                "Verify & Create account"
              ) : (
                "Verify & Sign in"
              )}
            </button>

            <div className="text-center text-sm text-stone">
              {resendIn > 0 ? (
                <span>
                  Resend code in <span className="font-medium text-ink">{resendIn}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={sending}
                  className="font-medium text-ink underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isConfigured && (
        <p className="mt-6 border border-dashed border-line bg-mist/60 px-3 py-2 text-center text-xs text-stone">
          Demo mode — use code <span className="font-semibold text-ink">{demoCode}</span>. Configure
          a WhatsApp/SMS provider in the backend for live OTP.
        </p>
      )}
    </div>
  );
}
