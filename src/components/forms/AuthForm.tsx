"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";

/** Static OTP used for the frontend-only demo (no backend yet). */
const DEMO_OTP = "123456";
const RESEND_SECONDS = 30;

const fieldClass =
  "h-12 w-full border-b border-line bg-transparent text-sm text-ink placeholder:text-stone/70 focus:border-ink focus:outline-none transition-colors";

/** Login (Mobile + OTP) / register (email + password). Auth is stubbed — UI demo only. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  return mode === "login" ? <OtpLoginForm /> : <RegisterForm />;
}

/* ---- Shared success card ------------------------------------------------- */

function SuccessCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-cream">
        <CheckIcon className="h-6 w-6" />
      </span>
      <p className="text-ink-soft">{message}</p>
      <Button href="/collections/all" variant="outline">
        Start shopping
      </Button>
    </div>
  );
}

function AuthFooter({ mode }: { mode: "login" | "register" }) {
  return (
    <p className="text-center text-sm text-ink-soft">
      {mode === "register" ? (
        <>
          Already have an account?{" "}
          <Link href="/account/login" className="text-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      ) : (
        <>
          New to CONROY?{" "}
          <Link href="/account/register" className="text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      )}
    </p>
  );
}

/* ---- Mobile + OTP login -------------------------------------------------- */

interface LoginValues {
  mobile: string;
  otp: string;
}

function OtpLoginForm() {
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginValues>({ defaultValues: { mobile: "", otp: "" } });

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [done, setDone] = useState(false);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function sendOtp() {
    const ok = await trigger("mobile");
    if (!ok) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    setSending(false);
    setStep("otp");
    setResendIn(RESEND_SECONDS);
    setValue("otp", "");
    clearErrors("otp");
  }

  async function verifyOtp(values: LoginValues) {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 700)); // simulate verification
    setVerifying(false);
    if (values.otp !== DEMO_OTP) {
      setError("otp", { message: "Incorrect OTP. Please try again." });
      return;
    }
    setDone(true);
  }

  function editNumber() {
    setStep("mobile");
    setValue("otp", "");
    clearErrors();
    setResendIn(0);
  }

  if (done) return <SuccessCard message="Signed in (demo). Welcome back." />;

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "mobile") void sendOtp();
        else void handleSubmit(verifyOtp)();
      }}
    >
      {/* Mobile number */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-stone">
          Mobile number
        </label>
        <div
          className={cn(
            "flex items-center gap-2 border-b border-line transition-colors focus-within:border-ink",
            errors.mobile && "border-accent",
            step === "otp" && "opacity-60",
          )}
        >
          <span className="select-none text-sm text-ink-soft">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            readOnly={step === "otp"}
            placeholder="10-digit mobile number"
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-stone/70 focus:outline-none"
            {...register("mobile", {
              required: "Mobile number is required",
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: "Enter a valid 10-digit mobile number",
              },
            })}
          />
          {step === "otp" && (
            <button
              type="button"
              onClick={editNumber}
              className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
            >
              Change
            </button>
          )}
        </div>
        {errors.mobile && <p className="mt-1.5 text-xs text-accent">{errors.mobile.message}</p>}
      </div>

      {/* OTP */}
      {step === "otp" && (
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-stone">
            Enter OTP
          </label>
          <input
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••"
            className={cn(
              fieldClass,
              "text-center text-lg tracking-[0.6em]",
              errors.otp && "border-accent",
            )}
            {...register("otp", {
              required: "Please enter the OTP",
              pattern: { value: /^\d{6}$/, message: "OTP must be 6 digits" },
            })}
          />
          {errors.otp ? (
            <p className="mt-1.5 text-xs text-accent">{errors.otp.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-stone">
              We sent a 6-digit code to +91 {getValues("mobile")}.{" "}
              <span className="text-ink-soft">(Demo OTP: {DEMO_OTP})</span>
            </p>
          )}

          <div className="mt-2 text-xs text-stone">
            {resendIn > 0 ? (
              <span>Resend OTP in {resendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={() => void sendOtp()}
                disabled={sending}
                className="font-medium text-ink underline-offset-4 hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={sending || verifying}
      >
        {step === "mobile"
          ? sending
            ? "Sending OTP…"
            : "Send OTP"
          : verifying
            ? "Verifying…"
            : "Verify & Sign in"}
      </Button>

      <AuthFooter mode="login" />
    </form>
  );
}

/* ---- Register (email + password) ---------------------------------------- */

interface RegisterValues {
  firstName?: string;
  email: string;
  password: string;
}

function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>();
  const [done, setDone] = useState(false);

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 600));
    setDone(true);
  }

  if (done) return <SuccessCard message="Account created (demo). Welcome to CONROY." />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <input {...register("firstName")} placeholder="First name" className={fieldClass} />
      <div>
        <input
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Enter a valid email" },
          })}
          placeholder="Email"
          className={cn(fieldClass, errors.email && "border-accent")}
        />
        {errors.email && <p className="mt-1.5 text-xs text-accent">{errors.email.message}</p>}
      </div>
      <div>
        <input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "At least 6 characters" },
          })}
          placeholder="Password"
          className={cn(fieldClass, errors.password && "border-accent")}
        />
        {errors.password && <p className="mt-1.5 text-xs text-accent">{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : "Create account"}
      </Button>

      <AuthFooter mode="register" />
    </form>
  );
}
