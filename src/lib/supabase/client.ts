import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when a real Supabase URL + anon key are present. */
export const isSupabaseConfigured = Boolean(URL.startsWith("http") && ANON);

/* ------------------------------------------------------------------ *
 * Storage adapter that lets the "Remember me" toggle choose between
 * localStorage (persist across browser restarts) and sessionStorage
 * (cleared when the tab closes). Falls back to memory during SSR.
 * ------------------------------------------------------------------ */
const memory = new Map<string, string>();
let useSession = false;

/** Call BEFORE sign-in. remember=true → localStorage, false → sessionStorage. */
export function setRememberSession(remember: boolean) {
  useSession = !remember;
}

function backing(): Storage | null {
  if (typeof window === "undefined") return null;
  return useSession ? window.sessionStorage : window.localStorage;
}

const storage = {
  getItem: (key: string) => backing()?.getItem(key) ?? memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    const b = backing();
    if (b) b.setItem(key, value);
    else memory.set(key, value);
  },
  removeItem: (key: string) => {
    const b = backing();
    if (b) b.removeItem(key);
    else memory.delete(key);
  },
};

let client: SupabaseClient | null = null;

/** Singleton browser Supabase client, or null when not configured (demo mode). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(URL, ANON, {
      auth: {
        storage,
        storageKey: "conroy-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
