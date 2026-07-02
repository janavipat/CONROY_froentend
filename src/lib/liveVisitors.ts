/**
 * In-memory live-visitor tracker. Storefront pages send a heartbeat every few
 * seconds; a visitor counts as "live" while seen within LIVE_TTL_MS. Geography
 * is derived from the client-provided locale (country) and timezone (city) —
 * no external geo-IP service, works offline and in local dev.
 *
 * State is intentionally ephemeral (resets on restart) — it models presence,
 * not history. Persist to a table later if long-term analytics are needed.
 */

const LIVE_TTL_MS = 60_000; // a session is "live" if seen in the last 60s

export interface VisitorPing {
  sessionId: string;
  path?: string;
  tz?: string; // IANA timezone, e.g. "Asia/Kolkata"
  locale?: string; // e.g. "en-IN"
}

interface Visit {
  lastSeen: number;
  path: string;
  countryCode: string;
  country: string;
  city: string;
  flag: string;
}

const store = new Map<string, Visit>();
const seenSessions = new Set<string>();
let totalSessions = 0;

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  IN: { name: "India", flag: "🇮🇳" },
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  AE: { name: "United Arab Emirates", flag: "🇦🇪" },
  CA: { name: "Canada", flag: "🇨🇦" },
  AU: { name: "Australia", flag: "🇦🇺" },
  SG: { name: "Singapore", flag: "🇸🇬" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  ES: { name: "Spain", flag: "🇪🇸" },
  IT: { name: "Italy", flag: "🇮🇹" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  JP: { name: "Japan", flag: "🇯🇵" },
  BD: { name: "Bangladesh", flag: "🇧🇩" },
  PK: { name: "Pakistan", flag: "🇵🇰" },
  LK: { name: "Sri Lanka", flag: "🇱🇰" },
  NP: { name: "Nepal", flag: "🇳🇵" },
  MY: { name: "Malaysia", flag: "🇲🇾" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
};

function regionFromLocale(locale?: string): string {
  if (!locale) return "";
  const m = locale.match(/[-_]([A-Za-z]{2})\b/);
  return m ? m[1].toUpperCase() : "";
}

function cityFromTz(tz?: string): string {
  if (!tz) return "";
  return (tz.split("/").pop() ?? "").replace(/_/g, " ");
}

function deriveGeo(locale?: string, tz?: string) {
  const cc = regionFromLocale(locale);
  const meta = COUNTRIES[cc];
  return {
    countryCode: cc || "??",
    country: meta?.name ?? (cc || "Unknown"),
    flag: meta?.flag ?? "🌐",
    city: cityFromTz(tz),
  };
}

function prune() {
  const now = Date.now();
  for (const [id, v] of store) {
    if (now - v.lastSeen > LIVE_TTL_MS) store.delete(id);
  }
}

/** Record a heartbeat from a storefront visitor. */
export function recordPing(p: VisitorPing): void {
  const geo = deriveGeo(p.locale, p.tz);
  store.set(p.sessionId, { lastSeen: Date.now(), path: p.path || "/", ...geo });
  if (!seenSessions.has(p.sessionId)) {
    seenSessions.add(p.sessionId);
    totalSessions += 1;
  }
  prune();
}

export interface LiveSnapshot {
  live: number;
  totalSessions: number;
  locations: {
    countryCode: string;
    country: string;
    flag: string;
    count: number;
    cities: string[];
  }[];
  pages: { path: string; count: number }[];
}

/** Current live-visitor snapshot, grouped by country and by page. */
export function snapshot(): LiveSnapshot {
  prune();
  const visits = [...store.values()];

  const byCountry = new Map<
    string,
    { countryCode: string; country: string; flag: string; count: number; cities: Set<string> }
  >();
  for (const v of visits) {
    const e =
      byCountry.get(v.countryCode) ??
      { countryCode: v.countryCode, country: v.country, flag: v.flag, count: 0, cities: new Set<string>() };
    e.count += 1;
    if (v.city) e.cities.add(v.city);
    byCountry.set(v.countryCode, e);
  }

  const locations = [...byCountry.values()]
    .map((e) => ({
      countryCode: e.countryCode,
      country: e.country,
      flag: e.flag,
      count: e.count,
      cities: [...e.cities],
    }))
    .sort((a, b) => b.count - a.count);

  const byPage = new Map<string, number>();
  for (const v of visits) byPage.set(v.path, (byPage.get(v.path) ?? 0) + 1);
  const pages = [...byPage.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return { live: visits.length, totalSessions, locations, pages };
}
