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
