"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { registerWithPassword, loginWithPassword, type AuthUser } from "@/services/auth";

export type { AuthUser };

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial session check runs. */
  initializing: boolean;
  register: (
    opts: { email: string; password: string; phone: string; fullName: string },
    remember: boolean,
  ) => Promise<{ error: string | null }>;
  login: (email: string, password: string, remember: boolean) => Promise<{ error: string | null }>;
  /** Updates the cached user's name (after a successful profile edit). */
  setUserName: (name: string) => void;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "conroy.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

interface StoredSession {
  user: AuthUser;
  token?: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
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

  function persistSession(res: { user?: AuthUser; token?: string }, rememberMe: boolean) {
    if (!res.user) return;
    const session: StoredSession = { user: res.user, token: res.token };
    try {
      const store = rememberMe ? window.localStorage : window.sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    setUser(res.user);
  }

  const register = useCallback(
    async (
      opts: { email: string; password: string; phone: string; fullName: string },
      rememberMe: boolean,
    ) => {
      remember.current = rememberMe;
      const res = await registerWithPassword(opts);
      if (!res.ok || !res.user) return { error: res.message };
      persistSession(res, rememberMe);
      return { error: null };
    },
    [],
  );

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    remember.current = rememberMe;
    const res = await loginWithPassword(email, password);
    if (!res.ok || !res.user) return { error: res.message };
    persistSession(res, rememberMe);
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
        register,
        login,
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
