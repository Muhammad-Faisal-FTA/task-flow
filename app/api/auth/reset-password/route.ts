// app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { resetPassword, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // 1. Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 2. Validate
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Reset password
    const result = await resetPassword(
      parsed.data.token,
      parsed.data.password
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { status, message } = resolveAuthError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// Auth rate limit — 10 requests per 15 minutes
export const POST = withRateLimit(RATE_LIMIT_PRESETS.auth, handler);
// ```

// ---

// **What this covers:**

// - ✅ **Security** — `verify-email` supports both `GET` (email link click) and `POST` (programmatic) — token validated in both cases
// - ✅ **Security** — `forgot-password` uses `RATE_LIMIT_PRESETS.forgotPassword` — strictest limit (3 req/hr) to prevent email bombing
// - ✅ **Security** — `reset-password` enforces same password strength rules as register — consistent policy
// - ✅ **Security** — reset token validated at both JWT level (expiry) and DB level (token match + expiry) — double protection
// - ✅ **Performance** — Zod `safeParse` used throughout — no throwing on validation, clean error objects
// - ✅ **Scalability** — all routes are stateless — token carries all state needed

// ---

// **Full API surface so far:**
// ```
// POST  /api/auth/register           ← rate limited (10/15min)
// POST  /api/auth/login              ← rate limited (10/15min)
// POST  /api/auth/refresh            ← cookie-based, no rate limit
// POST  /api/auth/logout             ← requires valid access token
// GET   /api/auth/verify-email       ← email link click
// POST  /api/auth/verify-email       ← programmatic verify
// POST  /api/auth/forgot-password    ← rate limited (3/hr)
// POST  /api/auth/reset-password     ← rate limited (10/15min)