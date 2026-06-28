/**
 * Resolves the backend API base URL. Works on both server and client because
 * it relies on a NEXT_PUBLIC_ variable. Falls back to the in-app /api routes.
 */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/api";
}

/** True when an absolute backend URL is configured (vs. the in-app /api routes). */
export function hasRemoteApi(): boolean {
  return /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_BASE_URL || "");
}
