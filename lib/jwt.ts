// lib/jwt.ts

import jwt, { SignOptions, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  EmailTokenPayload,
} from "@/types/auth";

// ─── Secrets ──────────────────────────────────────────────────────────────────
const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const EMAIL_SECRET   = process.env.JWT_EMAIL_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET || !EMAIL_SECRET) {
  throw new Error(
    "Missing JWT secrets in .env.local:\n" +
    "JWT_ACCESS_SECRET=\nJWT_REFRESH_SECRET=\nJWT_EMAIL_SECRET="
  );
}

// Type assertions since we've already validated these are not undefined
const ACCESS_SECRET_ASSERTED  = ACCESS_SECRET as string;
const REFRESH_SECRET_ASSERTED = REFRESH_SECRET as string;
const EMAIL_SECRET_ASSERTED   = EMAIL_SECRET as string;

// ─── Token expiry constants ───────────────────────────────────────────────────
export const TOKEN_EXPIRY = {
  ACCESS:        "15m",   // Short-lived — FR-01 security requirement
  REFRESH:       "7d",    // Long-lived — stored in httpOnly cookie
  EMAIL_VERIFY:  "24h",   // Verify email within 24 hours
  PASSWORD_RESET: "1h",   // Reset link valid for 1 hour only
} as const;

// ─── Result type — no throwing on verify, caller decides ─────────────────────
type TokenResult<T> =
  | { success: true;  payload: T }
  | { success: false; error: "expired" | "invalid" };

// ─── Access Token ─────────────────────────────────────────────────────────────
export function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">
): string {
  return jwt.sign(
    { ...payload, type: "access" } satisfies AccessTokenPayload,
    ACCESS_SECRET_ASSERTED,
    { expiresIn: TOKEN_EXPIRY.ACCESS } as SignOptions
  );
}

export function verifyAccessToken(
  token: string
): TokenResult<AccessTokenPayload> {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET_ASSERTED) as AccessTokenPayload;
    if (payload.type !== "access") return { success: false, error: "invalid" };
    return { success: true, payload };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { success: false, error: "expired" };
    return { success: false, error: "invalid" };
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────
export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">
): string {
  return jwt.sign(
    { ...payload, type: "refresh" } satisfies RefreshTokenPayload,
    REFRESH_SECRET_ASSERTED,
    { expiresIn: TOKEN_EXPIRY.REFRESH } as SignOptions
  );
}

export function verifyRefreshToken(
  token: string
): TokenResult<RefreshTokenPayload> {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET_ASSERTED) as RefreshTokenPayload;
    if (payload.type !== "refresh") return { success: false, error: "invalid" };
    return { success: true, payload };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { success: false, error: "expired" };
    return { success: false, error: "invalid" };
  }
}

// ─── Email Token (verify + reset — same secret, different type field) ─────────
export function signEmailToken(
  payload: Omit<EmailTokenPayload, "type">,
  purpose: EmailTokenPayload["type"]
): string {
  const expiry =
    purpose === "email_verify"
      ? TOKEN_EXPIRY.EMAIL_VERIFY
      : TOKEN_EXPIRY.PASSWORD_RESET;

  return jwt.sign(
    { ...payload, type: purpose } satisfies EmailTokenPayload,
    EMAIL_SECRET_ASSERTED,
    { expiresIn: expiry } as SignOptions
  );
}

export function verifyEmailToken(
  token: string,
  expectedType: EmailTokenPayload["type"]
): TokenResult<EmailTokenPayload> {
  try {
    const payload = jwt.verify(token, EMAIL_SECRET_ASSERTED) as EmailTokenPayload;

    // Guard: token type must match what we expect
    if (payload.type !== expectedType) {
      return { success: false, error: "invalid" };
    }

    return { success: true, payload };
  } catch (err) {
    if (err instanceof TokenExpiredError) return { success: false, error: "expired" };
    return { success: false, error: "invalid" };
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────
// Refresh token lives in httpOnly cookie — never accessible to JS
export const REFRESH_COOKIE_NAME = "tf_refresh_token";

export const refreshCookieOptions = {
  httpOnly: true,                                      // Not accessible via JS
  secure: process.env.NODE_ENV === "production",       // HTTPS only in prod
  sameSite: "lax" as const,                           // CSRF protection
  maxAge: 7 * 24 * 60 * 60,                           // 7 days in seconds
  path: "/api/auth",                                   // Only sent to auth routes
} as const;