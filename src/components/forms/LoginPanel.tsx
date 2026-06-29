"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { PhoneLoginForm } from "./PhoneLoginForm";
import { AuthForm } from "./AuthForm";

/** Login experience: phone OTP (primary) with an email/password fallback. */
export function LoginPanel() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [showEmail, setShowEmail] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="font-display text-2xl text-ink">You&apos;re signed in</h2>
        <p className="text-ink-soft">{user.phone}</p>
        <div className="flex gap-3">
          <Button href="/collections/all">Start shopping</Button>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PhoneLoginForm />

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-stone">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {showEmail ? (
        <AuthForm mode="login" />
      ) : (
        <button
          onClick={() => setShowEmail(true)}
          className="w-full rounded-pill border border-line py-3 text-sm text-ink transition-colors hover:border-ink"
        >
          Continue with email instead
        </button>
      )}
    </div>
  );
}
