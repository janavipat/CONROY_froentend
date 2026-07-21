"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { startPhoneOtp, verifyPhoneOtp, type AuthUser, type AuthMode } from "@/services/auth";

export type { AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial session check runs. */
  initializing: boolean;
  /** False when the last OTP was sent in mock/dev mode. */
  isConfigured: boolean;
  /** OTP to enter in mock mode (shown as a hint). */
  demoCode: string;
  sendOtp: (
    phoneE164: string,
    remember: boolean,
    mode?: AuthMode,
  ) => Promise<{ error: string | null }>;
  verifyOtp: (
    phoneE164: string,
    code: string,
    opts?: { mode?: AuthMode; email?: string; fullName?: string },
  ) => Promise<{ error: string | null }>;
  /** Updates the cached user's name (after a successful profile edit). */
  setUserName: (name: string) => void;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "conroy.auth";
const DEFAULT_DEMO = "123456";

const AuthContext = createContext<AuthContextValue | null>(null);

interface StoredSession {
  user: AuthUser;
  token?: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [lastSend, setLastSend] = useState<{ mock: boolean; code?: string } | null>(null);
  const remember = useRef(true);

  // Auto-login: restore a stored session on mount.
  useEffect(() => {
    const restore = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
        if (raw) setUser((JSON.parse(raw) as StoredSession).user);
      } catch {
        /* ignore */
      }
      setInitializing(false);
    };
    restore();
  }, []);

  const sendOtp = useCallback(
    async (phoneE164: string, rememberMe: boolean, mode: AuthMode = "signin") => {
      remember.current = rememberMe;
      const res = await startPhoneOtp(phoneE164, mode);
      if (!res.ok) return { error: res.message };
      setLastSend({ mock: res.mock ?? false, code: res.code });
      return { error: null };
    },
    [],
  );

  const verifyOtp = useCallback(
    async (
      phoneE164: string,
      code: string,
      opts?: { mode?: AuthMode; email?: string; fullName?: string },
    ) => {
      const res = await verifyPhoneOtp(phoneE164, code, opts);
      if (!res.ok || !res.user) return { error: res.message };

    const session: StoredSession = { user: res.user, token: res.token };
    try {
      const store = remember.current ? window.localStorage : window.sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    setUser(res.user);
    return { error: null };
  }, []);

  const setUserName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name };
      // Update whichever storage currently holds the session, preserving the token.
      try {
        for (const store of [window.localStorage, window.sessionStorage]) {
          const raw = store.getItem(STORAGE_KEY);
          if (!raw) continue;
          const session = JSON.parse(raw) as StoredSession;
          store.setItem(STORAGE_KEY, JSON.stringify({ ...session, user: next }));
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
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
        // Before any send we assume live; a mock send flips this to show the hint.
        isConfigured: lastSend ? !lastSend.mock : true,
        demoCode: lastSend?.code ?? DEFAULT_DEMO,
        sendOtp,
        verifyOtp,
        setUserName,
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
