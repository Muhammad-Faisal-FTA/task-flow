// hooks/useAuth.ts
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  JSX,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ message: string }>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
  getAccessToken: () => Promise<string | null>;
}

export type UseAuthReturn = AuthState & AuthActions;

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<UseAuthReturn | null>(null);

// ─── API base helper ──────────────────────────────────────────────────────────
interface ApiError {
  error: string;
  fields?: Record<string, string[]>;
}

async function authFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include" as RequestCredentials, // Send cookies (refresh token)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    // Attach field errors to the thrown error for form handling
    const error = new Error(err.error ?? "Something went wrong.") as Error & {
      fields?: Record<string, string[]>;
      status?: number;
    };
    error.fields = err.fields;
    error.status = res.status;
    throw error;
  }

  return data as T;
}

// ─── Token storage ────────────────────────────────────────────────────────────
// Access token lives ONLY in memory — never localStorage/sessionStorage
// This prevents XSS token theft
let inMemoryToken: string | null = null;

function setInMemoryToken(token: string | null) {
  inMemoryToken = token;
}

function getInMemoryToken(): string | null {
  return inMemoryToken;
}

// ─── Auth Provider ────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth consumer hook ────────────────────────────────────────────────────
export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Core state hook ──────────────────────────────────────────────────────────
function useAuthState(): UseAuthReturn {
  const router = useRouter();

  const [user, setUser]           = useState<AuthUser | null>(null);
  const [accessToken, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh timer ref — cleared on logout
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Schedule silent token refresh ──────────────────────────────────────────
  // Refresh 1 minute before expiry (access token = 15min → refresh at 14min)
  const scheduleRefresh = useCallback((delayMs = 14 * 60 * 1000) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await authFetch<{ accessToken: string }>(
          "/api/auth/refresh",
          { method: "POST" }
        );
        setInMemoryToken(data.accessToken);
        setToken(data.accessToken);
        scheduleRefresh(); // Schedule next refresh
      } catch {
        // Refresh failed — session expired, force logout
        handleExpiredSession();
      }
    }, delayMs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle expired session ─────────────────────────────────────────────────
  const handleExpiredSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setInMemoryToken(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    router.push("/login");
  }, [router]);

  // ── Bootstrap: try silent refresh on mount ─────────────────────────────────
  // If user has a valid refresh cookie → restore session without re-login
  useEffect(() => {
    async function bootstrap() {
      try {
        const data = await authFetch<{ accessToken: string }>(
          "/api/auth/refresh",
          { method: "POST" }
        );
        setInMemoryToken(data.accessToken);
        setToken(data.accessToken);

        // Decode user from token payload (base64 middle segment)
        const payload = JSON.parse(
          atob(data.accessToken.split(".")[1])
        ) as { userId: string; email: string };

        // Fetch full user profile
        const userRes = await authFetch<{ user: AuthUser }>(
          "/api/auth/me",
          {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          }
        );

        setUser(userRes.user);
        scheduleRefresh();
      } catch {
        // No valid session — user needs to log in
        setUser(null);
        setToken(null);
        setInMemoryToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();

    // Cleanup refresh timer on unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  // ── Visibility change: refresh when tab becomes active ─────────────────────
  // Prevents stale token when user switches tabs for a long time
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      if (!getInMemoryToken()) return;

      try {
        const data = await authFetch<{ accessToken: string }>(
          "/api/auth/refresh",
          { method: "POST" }
        );
        setInMemoryToken(data.accessToken);
        setToken(data.accessToken);
        scheduleRefresh();
      } catch {
        handleExpiredSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [scheduleRefresh, handleExpiredSession]);

  // ── getAccessToken: used by API calls outside this hook ────────────────────
  // Tries in-memory first, falls back to refresh
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const existing = getInMemoryToken();
    if (existing) return existing;

    try {
      const data = await authFetch<{ accessToken: string }>(
        "/api/auth/refresh",
        { method: "POST" }
      );
      setInMemoryToken(data.accessToken);
      setToken(data.accessToken);
      scheduleRefresh();
      return data.accessToken;
    } catch {
      handleExpiredSession();
      return null;
    }
  }, [scheduleRefresh, handleExpiredSession]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<void> => {
    const data = await authFetch<{ user: AuthUser; accessToken: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    setInMemoryToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    scheduleRefresh();
  }, [scheduleRefresh]);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> => {
    await authFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    // Don't log in automatically — user must verify email first
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    const token = getInMemoryToken();

    try {
      await authFetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Even if API fails, clear local state
    } finally {
      setUser(null);
      setToken(null);
      setInMemoryToken(null);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }
  }, []);

  // ── Forgot password ────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (
    email: string
  ): Promise<{ message: string }> => {
    return authFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  // ── Reset password ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<{ message: string }> => {
    return authFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password, confirmPassword }),
    });
  }, []);

  // ── Verify email ───────────────────────────────────────────────────────────
  const verifyEmail = useCallback(async (
    token: string
  ): Promise<{ message: string }> => {
    return authFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }, []);

  return {
    // State
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getAccessToken,
  };
}