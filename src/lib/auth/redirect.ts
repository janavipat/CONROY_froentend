/**
 * Where to send someone once they have signed in.
 *
 * The destination travels as a `?redirect=` query parameter, which means it is
 * attacker-controllable: anyone can hand a shopper a link to our own login page
 * carrying someone else's address. Signing in and being bounced to a convincing
 * copy of this site is exactly how credentials get taken, so a destination is
 * only honoured when it is unambiguously a path within this application.
 */

/** The query parameter carrying the intended destination. */
export const REDIRECT_PARAM = "redirect";

/** Anything of the form `scheme:` — http, javascript, data, and the rest. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * True if the value contains a character a browser strips before parsing a URL.
 *
 * Tested by code point rather than a regex literal: the characters in question
 * cannot appear in source without being escaped, and an escape that is written
 * wrongly fails open — which is the one direction this check must not fail.
 */
function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * The supplied destination, or null when it cannot be trusted.
 *
 * Accepts only a path rooted at this origin. Rejected: absolute URLs
 * (`https://evil.test`), scheme-relative ones (`//evil.test`, which a browser
 * treats as another host), backslash variants that some parsers normalise to
 * `//`, and anything that decodes into one of those.
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;

  let candidate = value.trim();
  if (!candidate) return null;

  // A destination may arrive encoded once by the router and again by whatever
  // built the link, so it is decoded until stable before being judged.
  for (let i = 0; i < 3; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(candidate);
    } catch {
      return null; // malformed encoding — not something to follow
    }
    if (decoded === candidate) break;
    candidate = decoded;
  }

  // A tab inside "/<tab>javascript:alert(1)" would be dropped by the browser,
  // leaving a scheme behind — so it must not read as a plain path here.
  if (hasControlCharacters(candidate)) return null;

  // Must be rooted here, and must not be able to name another host.
  if (!candidate.startsWith("/")) return null;
  if (candidate.startsWith("//")) return null;
  if (candidate.startsWith("/\\")) return null;
  if (HAS_SCHEME.test(candidate)) return null;

  return candidate;
}

/**
 * Builds a login/register URL that remembers where the shopper was headed.
 * Falls back to the bare page when the destination is not one we would honour,
 * so a bad value degrades to normal sign-in rather than a broken link.
 */
export function withRedirect(authPath: string, destination: string): string {
  const safe = safeRedirect(destination);
  return safe ? `${authPath}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}` : authPath;
}
