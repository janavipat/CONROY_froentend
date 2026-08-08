"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { readPendingCartItem } from "@/lib/pending-cart";
import type { AuthMode } from "@/services/auth";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { CountryPicker } from "@/components/auth/CountryPicker";
import { CheckIcon } from "@/components/ui/Icons";
import { cn } from "@/utils/cn";

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

/** Email + password auth — sign-up still collects a phone number (the
 * account's identity in the DB), sign-in is email + password only. */
export function EmailAuthForm({ mode = "signin" }: { mode?: AuthMode }) {
  const { user, initializing, register, login, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isSignup = mode === "signup";

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the primary field AFTER hydration (avoids dropping the first
  // keystroke that `autoFocus` causes when typing before React attaches its
  // handlers).
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function validateName(): boolean {
    if (!isSignup) return true;
    if (!name.trim()) {
      setNameError("Please enter your name");
      return false;
    }
    setNameError(null);
    return true;
  }

  function validatePhone(): boolean {
    if (!isSignup) return true;
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

  function validateEmail(): boolean {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setEmailError("Enter a valid email");
      return false;
    }
    setEmailError(null);
    return true;
  }

  function validatePassword(): boolean {
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError(null);
    return true;
  }

  function validateConfirmPassword(): boolean {
    if (!isSignup) return true;
    if (confirmPassword !== password) {
      setConfirmError("Passwords don't match");
      return false;
    }
    setConfirmError(null);
    return true;
  }

  async function handleSubmit() {
    const okName = validateName();
    const okPhone = validatePhone();
    const okEmail = validateEmail();
    const okPassword = validatePassword();
    const okConfirm = validateConfirmPassword();
    if (!okName || !okPhone || !okEmail || !okPassword || !okConfirm) return;

    setSubmitting(true);
    const { error } = isSignup
      ? await register(
          { email: email.trim(), password, phone: `${country.dial}${phone}`, fullName: name.trim() },
          remember,
        )
      : await login(email.trim(), password, remember);
    setSubmitting(false);

    if (error) {
      setEmailError(error);
      toast(error, "error");
      return;
    }
    toast(isSignup ? "Account created successfully" : "Signed in successfully", "success");

    // Came here from a blocked "Add to cart"? Go back to that product so the
    // form can finish the add. Otherwise the screen is unchanged.
    const pending = readPendingCartItem();
    if (pending) router.replace(`/products/${pending.handle}`);
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="space-y-5"
    >
      <p className="text-sm leading-relaxed text-ink-soft">
        {isSignup ? "Create your account with your email and a password." : "Sign in with your email and password."}
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
            disabled={submitting}
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

      {isSignup && (
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
            <CountryPicker value={country} onChange={setCountry} disabled={submitting} />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              disabled={submitting}
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
      )}

      <div>
        <label className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
          Email
        </label>
        <input
          ref={emailRef}
          type="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          placeholder="you@example.com"
          className={cn(inputClass, emailError && "border-accent")}
        />
        {emailError && <p className="mt-2 text-xs text-accent">{emailError}</p>}
      </div>

      <div>
        <label className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
          Password
        </label>
        <input
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          disabled={submitting}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          placeholder="••••••••"
          className={cn(inputClass, passwordError && "border-accent")}
        />
        {passwordError && <p className="mt-2 text-xs text-accent">{passwordError}</p>}
      </div>

      {isSignup && (
        <div>
          <label className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-stone">
            Confirm password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={submitting}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError(null);
            }}
            placeholder="••••••••"
            className={cn(inputClass, confirmError && "border-accent")}
          />
          {confirmError && <p className="mt-2 text-xs text-accent">{confirmError}</p>}
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

      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? (
          <>
            <Spinner /> {isSignup ? "Creating account…" : "Signing in…"}
          </>
        ) : isSignup ? (
          "Signup"
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
}
