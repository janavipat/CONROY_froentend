/**
 * The visitor's answer to the location prompt.
 *
 * Persisted in localStorage so it survives page changes and return visits —
 * the prompt is asked once, never on every navigation. A denial is remembered
 * just as firmly as a grant: we must not re-ask someone who said no.
 */

const KEY = "conroy.geoConsent";

export type GeoConsent = "granted" | "denied" | "unset";

export function readGeoConsent(): GeoConsent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
}

export function writeGeoConsent(value: Exclude<GeoConsent, "unset">): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* private mode — we just ask again next session */
  }
}

/**
 * What the browser itself thinks, which outranks our stored answer: if the
 * visitor already granted or blocked location in site settings, asking again
 * would be pointless (a blocked prompt never appears) or redundant.
 */
export async function browserPermission(): Promise<PermissionState | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return null;
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state;
  } catch {
    return null;
  }
}

/** One GPS fix. Resolves null on denial, timeout, or unsupported browsers. */
export function getCoords(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      // A cached fix up to 5 minutes old is fine — this is a city-level label,
      // not turn-by-turn navigation, and it avoids waking the GPS repeatedly.
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}
