# CONROY frontend — staging

The `staging` branch. Same storefront as `main`, deployed as its **own Vercel
project**, pointed at the **staging backend** and the **staging Supabase
project**. Nothing here touches production.

## What makes it staging

One variable: `NEXT_PUBLIC_APP_ENV=staging`. Unset, this branch builds the real
storefront — verified by building it both ways.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_APP_ENV=staging` | Shows the "Staging — test site" banner; sets `noindex, nofollow` and a `Disallow: /` robots.txt. |
| `NEXT_PUBLIC_API_BASE_URL` | Which backend the storefront talks to. Must be the staging API, including `/api`. |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | The staging Supabase project — used for browser-side auth. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | The `rzp_test_…` key id. |

The ₹1 price is **not** set here. Prices are resolved server-side by the
backend and simply rendered by the storefront, so there is one number and no
way for the displayed price to disagree with the amount charged.

Search engines are shut out because staging is the same copy on a different
domain; indexed, it would compete with conroy.global for its own queries.

## Configuration

There is deliberately **no committed `.env.local` on this branch** (`main` has
one, pointing at the production API). Everything comes from the host's
dashboard, so an unset variable fails closed instead of inheriting production's
value. See [`.env.staging.example`](.env.staging.example).

If `NEXT_PUBLIC_API_BASE_URL` is missing the storefront falls back to bundled
demo data — the pages render, but the catalogue is not live and checkout is not
real. A page that loads is therefore not on its own proof the wiring is right;
check the backend's `/health` too.

## Verifying a deployment

1. The amber "Staging — test site" banner is on every page.
2. `https://<staging-site>/robots.txt` reads `Disallow: /`.
3. A product tile shows **₹1** — that figure comes from the staging backend.
4. Sign in with any phone number and OTP `123456`.
