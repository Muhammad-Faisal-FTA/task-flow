// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMIT_PRESETS } from "@/middlewares/rateLimit";
import { forgotPassword, resolveAuthError } from "@/services/authService";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .toLowerCase(),
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
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // 3. Process — always returns same message (security: don't reveal email existence)
    const result = await forgotPassword(parsed.data.email);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { status, message } = resolveAuthError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

// Very strict rate limit — 3 requests per hour (NFR Security)
export const POST = withRateLimit(RATE_LIMIT_PRESETS.forgotPassword, handler);