"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  getSupabase,
  isSupabaseConfigured,
  setRememberSession,
} from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  phone: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial session check runs (used for auto-login splash). */
  initializing: boolean;
  /** False when running in demo mode (no Supabase keys). */
  isConfigured: boolean;
  /** Demo OTP shown to the user when not configured. */
  demoCode: string;
  sendOtp: (phoneE164: string, remember: boolean) => Promise<{ error: string | null }>;
  verifyOtp: (phoneE164: string, code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const DEMO_CODE = "123456";
const DEMO_KEY = "conroy-demo-auth";

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maps raw Supabase auth errors to clean, human messages. */
function friendlyError(message?: string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("rate") || m.includes("too many") || m.includes("seconds"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("invalid") && m.includes("otp")) return "That code is invalid or has expired.";
  if (m.includes("expired")) return "This code has expired. Please request a new one.";
  if (m.includes("token")) return "Incorrect code. Please check and try again.";
  if (m.includes("phone")) return "Please enter a valid mobile number.";
  if (m.includes("sms") || m.includes("provider"))
    return "SMS service is unavailable right now. Please try again later.";
  return message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const demoRemember = useRef(true);

  // Auto-login: restore an existing session on mount.
  useEffect(() => {
    let active = true;
    const supabase = getSupabase();

    if (!supabase) {
      // Demo mode — read a stored demo session.
      try {
        const raw =
          window.localStorage.getItem(DEMO_KEY) ?? window.sessionStorage.getItem(DEMO_KEY);
        if (raw && active) setUser(JSON.parse(raw) as AuthUser);
      } catch {
        /* ignore */
      }
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const s = data.session;
      if (s?.user) setUser({ id: s.user.id, phone: s.user.phone ?? "" });
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ? { id: session.user.id, phone: session.user.phone ?? "" } : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendOtp = useCallback(async (phoneE164: string, remember: boolean) => {
    setRememberSession(remember);
    demoRemember.current = remember;
    const supabase = getSupabase();

    if (!supabase) {
      await new Promise((r) => setTimeout(r, 700)); // simulate network
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneE164,
      options: { channel: "sms" },
    });
    return { error: error ? friendlyError(error.message) : null };
  }, []);

  const verifyOtp = useCallback(async (phoneE164: string, code: string) => {
    const supabase = getSupabase();

    if (!supabase) {
      await new Promise((r) => setTimeout(r, 700));
      if (code !== DEMO_CODE) return { error: "Incorrect code. (Demo code is 123456.)" };
      const demoUser: AuthUser = { id: `demo-${phoneE164}`, phone: phoneE164 };
      try {
        const store = demoRemember.current ? window.localStorage : window.sessionStorage;
        store.setItem(DEMO_KEY, JSON.stringify(demoUser));
      } catch {
        /* ignore */
      }
      setUser(demoUser);
      return { error: null };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: code,
      type: "sms",
    });
    if (error) return { error: friendlyError(error.message) };
    if (data.user) setUser({ id: data.user.id, phone: data.user.phone ?? phoneE164 });
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    try {
      window.localStorage.removeItem(DEMO_KEY);
      window.sessionStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        isConfigured: isSupabaseConfigured,
        demoCode: DEMO_CODE,
        sendOtp,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
