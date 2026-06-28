"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startPhoneOtp, verifyPhoneOtp } from "@/services/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { CheckIcon, PhoneIcon } from "@/components/ui/Icons";

const inputClass =
  "h-12 w-full rounded-md border border-line bg-white px-3 text-[15px] text-ink placeholder:text-stone focus:border-ink focus:outline-none transition-colors";

export function PhoneLoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid phone number.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await startPhoneOtp(phone);
    setLoading(false);
    if (res.ok) {
      setNote(res.message);
      setStep("otp");
    } else {
      setError(res.message);
    }
  }

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^[0-9]{4,8}$/.test(code.trim())) {
      setError("Enter the code sent to your phone.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await verifyPhoneOtp(phone, code.trim());
    setLoading(false);
    if (res.ok && res.user && res.accessToken) {
      signIn({ user: res.user, accessToken: res.accessToken });
      router.push("/");
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-mist text-ink">
          <PhoneIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg text-ink">Sign in with your phone</h2>
          <p className="text-sm text-stone">
            {step === "phone"
              ? "We'll text you a one-time code."
              : `Code sent to ${phone}`}
          </p>
        </div>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleSend} className="space-y-4" noValidate>
          <div className="flex gap-2">
            <span className="grid h-12 shrink-0 place-items-center rounded-md border border-line bg-mist px-3 text-[15px] text-ink-soft">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className={inputClass}
            />
          </div>
          {error && <p className="text-xs text-accent">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          {note && (
            <p className="flex items-start gap-2 rounded-md bg-sage px-3 py-2 text-xs text-ink-soft">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> {note}
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code"
            className={`${inputClass} text-center text-lg tracking-[0.4em]`}
          />
          {error && <p className="text-xs text-accent">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Verify & sign in"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="text-stone hover:text-ink"
            >
              ← Change number
            </button>
            <button
              type="button"
              onClick={() => handleSend()}
              className="text-stone hover:text-ink"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
