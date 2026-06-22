"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";

interface AuthValues {
  firstName?: string;
  email: string;
  password: string;
}

const fieldClass =
  "h-12 w-full border-b border-line bg-transparent text-sm text-ink placeholder:text-stone/70 focus:border-ink focus:outline-none transition-colors";

/** Login / register form. Auth is stubbed — this is a UI demonstration. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>();
  const [done, setDone] = useState(false);

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 600));
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-cream">
          <CheckIcon className="h-6 w-6" />
        </span>
        <p className="text-ink-soft">
          {isRegister
            ? "Account created (demo). Welcome to CONROY."
            : "Signed in (demo). Welcome back."}
        </p>
        <Button href="/collections/all" variant="outline">
          Start shopping
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {isRegister && (
        <input {...register("firstName")} placeholder="First name" className={fieldClass} />
      )}
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
        {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        {isRegister ? (
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
    </form>
  );
}
