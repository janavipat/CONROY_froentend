/**
 * Which environment this build is for.
 *
 * `NEXT_PUBLIC_APP_ENV` is inlined at build time, so it is readable in server
 * components, client components and metadata alike. Anything other than
 * "staging" — including it being unset — means production, so this branch
 * renders the real storefront unless the deployment says otherwise.
 */
export const APP_ENV = (process.env.NEXT_PUBLIC_APP_ENV ?? "production").trim().toLowerCase();

export const isStaging = APP_ENV === "staging";

/**
 * Whether this staging build checks out against a REAL Razorpay account.
 *
 * The key id is public by design and already inlined in the browser bundle, so
 * reading its prefix costs nothing and is the only honest source for this: the
 * storefront cannot otherwise know whether a checkout will move real money.
 *
 * It exists so the staging banner can tell the truth. A banner promising "test
 * payments only" over a live key is worse than no banner — it is the reason
 * someone enters a real card believing they are safe.
 */
export const stagingTakesRealPayments =
  isStaging && (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").trim().startsWith("rzp_live_");
