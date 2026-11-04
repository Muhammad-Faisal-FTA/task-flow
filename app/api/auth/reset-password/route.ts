// app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { resetPassword, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const ResetPasswordSchema = z.object({
  email: z.string().email("A valid email is required").toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),
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
      parsed.data.email,
      parsed.data.otp,
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
