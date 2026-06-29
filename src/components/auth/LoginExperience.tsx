import Link from "next/link";
import { PhoneOtpAuth } from "@/components/auth/PhoneOtpAuth";

/** Clean, light, centered auth card in the CONROY house style. */
export function LoginExperience() {
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
            <span className="-mb-px border-b-2 border-ink bg-white py-4 text-center font-display text-lg text-ink">
              Sign In
            </span>
            <Link
              href="/account/register"
              className="bg-mist py-4 text-center font-display text-lg text-stone transition-colors hover:text-ink"
            >
              Create Account
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <PhoneOtpAuth />
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
