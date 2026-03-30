// middlewares/rateLimit.ts

import { NextRequest, NextResponse } from "next/server";

// ─── In-memory store ──────────────────────────────────────────────────────────
// For production: replace with Redis (NFR Scalability note)
// Key: IP address, Value: { count, resetAt }
interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp ms
}

declare global {
  // eslint-disable-next-line no-var
  var _rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store: Map<string, RateLimitEntry> =
  global._rateLimitStore ?? new Map();
global._rateLimitStore = store;

// ─── Cleanup: remove expired entries every 5 minutes ──────────────────────────
// Prevents memory leak in long-running dev server
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ─── Config presets ───────────────────────────────────────────────────────────
export interface RateLimitConfig {
  limit: number;       // Max requests
  windowMs: number;    // Time window in ms
  message?: string;    // Custom error message
}

export const RATE_LIMIT_PRESETS = {
  // Auth routes — strict (NFR Security requirement)
  auth: {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 10 requests per 15 minutes
    message: "Too many attempts. Please try again in 15 minutes.",
  },
  // Forgot password — very strict
  forgotPassword: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    message: "Too many reset attempts. Please try again in an hour.",
  },
  // General API routes
  api: {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    message: "Too many requests. Please slow down.",
  },
} as const;

// ─── Get client IP ────────────────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  // Check forwarded headers (reverse proxy / Vercel)
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ─── Core rate limit check ────────────────────────────────────────────────────
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  // New or expired window — reset
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  // Within window — increment
  entry.count += 1;

  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── withRateLimit HOC ────────────────────────────────────────────────────────
// Wraps route handlers with rate limiting
// Usage:
//   export const POST = withRateLimit(RATE_LIMIT_PRESETS.auth, handler)
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const ip  = getClientIp(req);
    const key = `${ip}:${req.nextUrl.pathname}`;

    const { allowed, remaining, resetAt } = checkRateLimit(key, config);

    // Always add rate limit headers (good practice)
    const headers = {
      "X-RateLimit-Limit":     String(config.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset":     String(Math.ceil(resetAt / 1000)), // Unix seconds
    };

    if (!allowed) {
      return NextResponse.json(
        {
          error: config.message ?? "Too many requests.",
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000), // seconds
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Inject rate limit headers into successful response too
    const response = await handler(req, context);
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

    return response;
  };
}

// ─── Compose: withRateLimit + withAuth together ───────────────────────────────
// Convenience wrapper for protected + rate-limited routes
// Usage:
//   export const POST = withRateLimitedAuth(RATE_LIMIT_PRESETS.auth, handler)
import { withAuth, AuthenticatedHandler } from "./authMiddleware";

export function withRateLimitedAuth(
  config: RateLimitConfig,
  handler: AuthenticatedHandler
) {
  return withRateLimit(config, withAuth(handler) as any);
}