import { api } from "./api";

export type SettingsMap = Record<string, string>;

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/** Toggleable homepage sections, in render order. Hero is always shown. */
export const HOMEPAGE_SECTIONS = [
  { key: "section.shops", label: "Shops slider" },
  { key: "section.heritage", label: "Heritage story" },
  { key: "section.campaign", label: "Campaign film banner" },
  { key: "section.philosophy", label: "Philosophy" },
  { key: "section.services", label: "Service features" },
  { key: "section.testimonials", label: "Testimonials" },
  { key: "section.cta", label: "Call to action" },
] as const;

/** Defaults applied when a key isn't set in the DB yet. */
export const SETTING_DEFAULTS: SettingsMap = {
  "section.shops": "true",
  "section.heritage": "true",
  "section.campaign": "true",
  "section.philosophy": "true",
  "section.services": "true",
  "section.testimonials": "true",
  "section.cta": "true",
  "payments.cod": "true",
  "payments.online": "true",
  "store.maintenance": "false",
  "contact.whatsapp": "919998009904",
};

/** Reads a boolean setting, honouring defaults. */
export function isOn(s: SettingsMap, key: string): boolean {
  const v = s[key] ?? SETTING_DEFAULTS[key];
  return v === "true" || v === "1";
}

/** Reads a string setting, honouring defaults. */
export function settingValue(s: SettingsMap, key: string, fallback = ""): string {
  return s[key] ?? SETTING_DEFAULTS[key] ?? fallback;
}

/**
 * Fetches public store settings. Safe on both server and client (uses global
 * fetch). Never throws — returns {} on any failure so the storefront still
 * renders with defaults.
 */
export async function fetchSiteSettings(): Promise<SettingsMap> {
  try {
    const res = await fetch(`${BASE}/settings`, { cache: "no-store" });
    if (!res.ok) return {};
    const json = (await res.json()) as { data?: SettingsMap };
    return json.data ?? {};
  } catch {
    return {};
  }
}

/** Admin: upsert a partial patch of settings (booleans stored as text). */
export async function adminUpdateSettings(
  patch: Record<string, string | boolean>,
): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.put<{ ok: boolean; message: string }>("/admin/settings", patch);
  return data;
}
