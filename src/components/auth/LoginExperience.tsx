import Link from "next/link";
import { PhoneOtpAuth } from "@/components/auth/PhoneOtpAuth";
import { cn } from "@/utils/cn";

/** Clean, light, centered auth card in the CONROY house style. */
export function LoginExperience({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const isSignup = mode === "signup";

  const tab = (active: boolean) =>
    cn(
      "-mb-px py-4 text-center font-display text-lg transition-colors",
      active
        ? "border-b-2 border-ink bg-white text-ink"
        : "bg-mist text-stone hover:text-ink",
    );

  return (
    <section className="bg-paper px-5 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-display text-xl tracking-[0.3em] text-ink"
          style={{ fontWeight: 600 }}
        >
          CONROY
        </Link>

        <div className="border border-line bg-white shadow-sm">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-line">
            {isSignup ? (
              <Link href="/account/login" className={tab(false)}>
                Sign In
              </Link>
            ) : (
              <span className={tab(true)}>Sign In</span>
            )}
            {isSignup ? (
              <span className={tab(true)}>Create Account</span>
            ) : (
              <Link href="/account/register" className={tab(false)}>
                Create Account
              </Link>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* Phone OTP powers both — signup just also collects an email. */}
            <PhoneOtpAuth collectEmail={isSignup} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-stone">
          By continuing you agree to CONROY&apos;s{" "}
          <Link href="/policy" className="text-ink underline-offset-2 hover:underline">
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link href="/policy" className="text-ink underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
